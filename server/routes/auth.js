const express = require('express');
const User = require('../models/User');
const { protect, signToken } = require('../middleware/auth');

const router = express.Router();

function publicUser(u) {
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    locality: u.locality,
    city: u.city,
    country: u.country,
    lat: u.lat,
    lng: u.lng,
  };
}

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, locality, city, country, lat, lng } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const exists = await User.findOne({ email: (email || '').toLowerCase() });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, locality, city, country: country || 'India', lat, lng });
    res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({ token: signToken(user._id), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/me', protect, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

module.exports = router;
