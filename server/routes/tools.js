const express = require('express');
const mongoose = require('mongoose');
const Tool = require('../models/Tool');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');

const router = express.Router();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const EDITABLE = [
  'name',
  'description',
  'category',
  'subcategory',
  'condition',
  'locality',
  'city',
  'country',
  'lat',
  'lng',
  'imageUrl',
  'pricePerDay',
  'deposit',
  'instantBook',
  'available',
];
const pick = (obj, keys) =>
  keys.reduce((acc, k) => (obj[k] !== undefined ? { ...acc, [k]: obj[k] } : acc), {});

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function badgeFor(returnedCount) {
  if (returnedCount >= 5) return 'Super Lender';
  if (returnedCount >= 2) return 'Trusted Lender';
  return 'New Lender';
}

// Adds borrowsCount (completed loans of the tool) and owner badge to plain tool objects
async function decorate(tools) {
  if (tools.length === 0) return tools;
  const toolIds = tools.map((t) => t._id);
  const ownerIds = [...new Set(tools.map((t) => String(t.owner && t.owner._id ? t.owner._id : t.owner)))];

  const [byTool, byOwner] = await Promise.all([
    Booking.aggregate([
      { $match: { tool: { $in: toolIds }, status: 'returned' } },
      { $group: { _id: '$tool', n: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $match: { owner: { $in: ownerIds.map((id) => new mongoose.Types.ObjectId(id)) }, status: 'returned' } },
      { $group: { _id: '$owner', n: { $sum: 1 } } },
    ]),
  ]);
  const toolMap = Object.fromEntries(byTool.map((r) => [String(r._id), r.n]));
  const ownerMap = Object.fromEntries(byOwner.map((r) => [String(r._id), r.n]));

  return tools.map((t) => {
    const ownerId = String(t.owner && t.owner._id ? t.owner._id : t.owner);
    const owner = t.owner && t.owner._id ? { ...t.owner, badge: badgeFor(ownerMap[ownerId] || 0) } : t.owner;
    return { ...t, owner, borrowsCount: toolMap[String(t._id)] || 0 };
  });
}

// Browse / search. Optional: lat,lng (adds distanceKm and sorts by it), maxKm
router.get('/', async (req, res, next) => {
  try {
    const { q, category, city, locality, available, free } = req.query;
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const maxKm = parseFloat(req.query.maxKm);

    const filter = {};
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ name: rx }, { description: rx }, { subcategory: rx }, { locality: rx }];
    }
    if (category && category !== 'All' && category !== 'all') filter.category = category;
    if (city) filter.city = new RegExp(escapeRegex(city), 'i');
    if (locality) filter.locality = new RegExp(escapeRegex(locality), 'i');
    if (available === 'true') filter.available = true;
    if (free === 'true') filter.pricePerDay = 0;

    let tools = await Tool.find(filter)
      .populate('owner', 'name city locality createdAt')
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();

    const hasPoint = Number.isFinite(lat) && Number.isFinite(lng);
    if (hasPoint) {
      tools = tools.map((t) => ({
        ...t,
        distanceKm:
          Number.isFinite(t.lat) && Number.isFinite(t.lng)
            ? Math.round(haversineKm(lat, lng, t.lat, t.lng) * 10) / 10
            : null,
      }));
      if (Number.isFinite(maxKm)) tools = tools.filter((t) => t.distanceKm === null || t.distanceKm <= maxKm);
      tools.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
    }

    res.json({ tools: await decorate(tools) });
  } catch (err) {
    next(err);
  }
});

// Real numbers for the home page (must be before '/:id')
router.get('/stats/summary', async (req, res, next) => {
  try {
    const [tools, lenders, freeTools, completed] = await Promise.all([
      Tool.countDocuments({}),
      Tool.distinct('owner'),
      Tool.countDocuments({ pricePerDay: 0 }),
      Booking.countDocuments({ status: 'returned' }),
    ]);
    res.json({ tools, lenders: lenders.length, freeTools, completedLoans: completed });
  } catch (err) {
    next(err);
  }
});

// Tools owned by the logged-in user (must be before '/:id')
router.get('/mine/list', protect, async (req, res, next) => {
  try {
    const tools = await Tool.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json({ tools });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const tool = await Tool.findById(req.params.id).populate('owner', 'name city locality createdAt').lean();
    if (!tool) return res.status(404).json({ message: 'Tool not found' });
    const [decorated] = await decorate([tool]);
    res.json({ tool: decorated });
  } catch (err) {
    next(err);
  }
});

// Approved (blocked) date ranges so the UI can show availability
router.get('/:id/availability', async (req, res, next) => {
  try {
    const bookings = await Booking.find({ tool: req.params.id, status: 'approved' })
      .select('startDate endDate')
      .sort({ startDate: 1 });
    res.json({ booked: bookings });
  } catch (err) {
    next(err);
  }
});

// Reviews left by past borrowers
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const bookings = await Booking.find({ tool: req.params.id, 'review.rating': { $exists: true } })
      .populate('borrower', 'name')
      .sort({ 'review.createdAt': -1 })
      .limit(50);
    const reviews = bookings.map((b) => ({
      id: b._id,
      borrower: b.borrower ? b.borrower.name : 'Unknown',
      rating: b.review.rating,
      comment: b.review.comment,
      createdAt: b.review.createdAt,
    }));
    res.json({ reviews });
  } catch (err) {
    next(err);
  }
});

router.post('/', protect, async (req, res, next) => {
  try {
    const data = pick(req.body, EDITABLE);
    if (!data.country) data.country = req.user.country || 'India';
    const tool = await Tool.create({ ...data, owner: req.user._id });
    res.status(201).json({ tool });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', protect, async (req, res, next) => {
  try {
    const tool = await Tool.findById(req.params.id);
    if (!tool) return res.status(404).json({ message: 'Tool not found' });
    if (!tool.owner.equals(req.user._id)) return res.status(403).json({ message: 'Not your tool' });

    Object.assign(tool, pick(req.body, EDITABLE));
    await tool.save();
    res.json({ tool });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', protect, async (req, res, next) => {
  try {
    const tool = await Tool.findById(req.params.id);
    if (!tool) return res.status(404).json({ message: 'Tool not found' });
    if (!tool.owner.equals(req.user._id)) return res.status(403).json({ message: 'Not your tool' });

    const active = await Booking.countDocuments({ tool: tool._id, status: { $in: ['pending', 'approved'] } });
    if (active > 0) {
      return res.status(409).json({ message: 'Resolve pending/approved bookings before deleting this tool' });
    }
    await tool.deleteOne();
    res.json({ message: 'Tool deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
