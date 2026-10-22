const express = require('express');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Tool = require('../models/Tool');
const { protect } = require('../middleware/auth');

const router = express.Router();

const MAX_DAYS = 60;
const str = (v) => (typeof v === 'string' ? v.trim() : '');

const startOfDay = (d) => {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
};

// True if an approved booking overlaps [start, end] (inclusive)
async function hasConflict(toolId, start, end, excludeId) {
  const q = {
    tool: toolId,
    status: 'approved',
    startDate: { $lte: end },
    endDate: { $gte: start },
  };
  if (excludeId) q._id = { $ne: excludeId };
  return (await Booking.countDocuments(q)) > 0;
}

const populateAll = (q) =>
  q
    .populate('tool', 'name imageUrl category city locality country pricePerDay deposit')
    .populate('owner', 'name email')
    .populate('borrower', 'name email');

// Request to borrow a tool
router.post('/', protect, async (req, res, next) => {
  try {
    const { toolId, startDate, endDate } = req.body;
    const message = str(req.body.message).slice(0, 500);
    const pickupWindow = str(req.body.pickupWindow).slice(0, 60);
    if (!toolId || !startDate || !endDate) {
      return res.status(400).json({ message: 'toolId, startDate and endDate are required' });
    }
    if (!mongoose.isValidObjectId(toolId)) return res.status(400).json({ message: 'Invalid tool' });
    const start = startOfDay(startDate);
    const end = startOfDay(endDate);
    if (isNaN(start) || isNaN(end)) return res.status(400).json({ message: 'Invalid dates' });
    if (end < start) return res.status(400).json({ message: 'End date must be on or after start date' });
    if (start < startOfDay(new Date())) return res.status(400).json({ message: 'Start date cannot be in the past' });
    if (Math.round((end - start) / 86400000) + 1 > MAX_DAYS) {
      return res.status(400).json({ message: `You can borrow a tool for at most ${MAX_DAYS} days at a time` });
    }

    const tool = await Tool.findById(toolId);
    if (!tool) return res.status(404).json({ message: 'Tool not found' });
    if (!tool.available) return res.status(409).json({ message: 'This tool is currently not available' });
    if (tool.owner.equals(req.user._id)) return res.status(400).json({ message: "You can't borrow your own tool" });

    if (await hasConflict(tool._id, start, end)) {
      return res.status(409).json({ message: 'Those dates are already booked' });
    }

    const duplicate = await Booking.findOne({
      tool: tool._id,
      borrower: req.user._id,
      status: 'pending',
      startDate: { $lte: end },
      endDate: { $gte: start },
    });
    if (duplicate) return res.status(409).json({ message: 'You already have a pending request for these dates' });

    const days = Math.round((end - start) / 86400000) + 1;
    const booking = await Booking.create({
      tool: tool._id,
      owner: tool.owner,
      borrower: req.user._id,
      startDate: start,
      endDate: end,
      message,
      pickupWindow,
      days,
      rentalCost: days * (tool.pricePerDay || 0),
      deposit: tool.deposit || 0,
      instant: Boolean(tool.instantBook),
      status: tool.instantBook ? 'approved' : 'pending', // instant-book tools skip owner approval
    });
        // Re-check after saving: if two requests raced, undo this one
    if (booking.status === 'approved' && (await hasConflict(tool._id, start, end, booking._id))) {
      await booking.deleteOne();
      return res.status(409).json({ message: 'Those dates are already booked' });
    }
    res.status(201).json({ booking });
  } catch (err) {
    next(err);
  }
});

// Things I am borrowing
router.get('/mine', protect, async (req, res, next) => {
  try {
    const bookings = await populateAll(Booking.find({ borrower: req.user._id }).sort({ createdAt: -1 }));
    res.json({ bookings });
  } catch (err) {
    next(err);
  }
});

// Requests for tools I own
router.get('/incoming', protect, async (req, res, next) => {
  try {
    const bookings = await populateAll(Booking.find({ owner: req.user._id }).sort({ createdAt: -1 }));
    res.json({ bookings });
  } catch (err) {
    next(err);
  }
});

// Status changes
router.patch('/:id/status', protect, async (req, res, next) => {
  try {
    const status = str(req.body.status);
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isOwner = booking.owner.equals(req.user._id);
    const isBorrower = booking.borrower.equals(req.user._id);
    if (!isOwner && !isBorrower) return res.status(403).json({ message: 'Not your booking' });

    const from = booking.status;

    if (isOwner && status === 'approved' && from === 'pending') {
      if (await hasConflict(booking.tool, booking.startDate, booking.endDate, booking._id)) {
        return res.status(409).json({ message: 'Another approved booking overlaps these dates' });
      }
    } else if (isOwner && status === 'declined' && from === 'pending') {
      // ok
    } else if (isOwner && status === 'returned' && from === 'approved') {
      // ok
    } else if (isBorrower && status === 'cancelled' && (from === 'pending' || from === 'approved')) {
      // ok
    } else {
      return res.status(400).json({ message: `Cannot change status from ${from} to ${status}` });
    }

    booking.status = status;
    await booking.save();
    res.json({ booking });
  } catch (err) {
    next(err);
  }
});

// Borrower reviews the tool after it was returned
router.post('/:id/review', protect, async (req, res, next) => {
  try {
    const { rating } = req.body;
    const comment = str(req.body.comment).slice(0, 500);
    const r = Number(rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return res.status(400).json({ message: 'Rating must be an integer from 1 to 5' });
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!booking.borrower.equals(req.user._id)) return res.status(403).json({ message: 'Only the borrower can review' });
    if (booking.status !== 'returned') return res.status(400).json({ message: 'You can review after the tool is returned' });
    if (booking.review && booking.review.rating) return res.status(409).json({ message: 'Already reviewed' });

    booking.review = { rating: r, comment, createdAt: new Date() };
    await booking.save();

    const agg = await Booking.aggregate([
      { $match: { tool: booking.tool, 'review.rating': { $exists: true } } },
      { $group: { _id: '$tool', avg: { $avg: '$review.rating' }, count: { $sum: 1 } } },
    ]);
    if (agg[0]) {
      await Tool.findByIdAndUpdate(booking.tool, {
        ratingAvg: Math.round(agg[0].avg * 10) / 10,
        ratingCount: agg[0].count,
      });
    }
    res.json({ booking });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
