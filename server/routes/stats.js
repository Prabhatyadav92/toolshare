const express = require('express');
const User = require('../models/User');
const Tool = require('../models/Tool');
const Booking = require('../models/Booking');

const router = express.Router();

// Real, live numbers for the home page (no made-up marketing stats)
router.get('/', async (req, res, next) => {
  try {
    const [members, tools, borrows, cities] = await Promise.all([
      User.countDocuments(),
      Tool.countDocuments(),
      Booking.countDocuments({ status: { $in: ['approved', 'returned'] } }),
      Tool.distinct('city'),
    ]);
    res.json({ members, tools, borrows, cities: cities.length });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
