const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { starPassCode, name, role } = req.body;
  if (!starPassCode) return res.status(400).json({ msg: 'StarPass code required' });

  try {
    let existing = await User.findOne({ starPassCode });
    if (existing) return res.status(400).json({ msg: 'StarPass already registered' });

    const user = new User({ starPassCode, name, role });
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user._id, starPassCode: user.starPassCode, name: user.name, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { starPassCode } = req.body;
  if (!starPassCode) return res.status(400).json({ msg: 'StarPass code required' });

  try {
    const user = await User.findOne({ starPassCode });
    if (!user) return res.status(400).json({ msg: 'Invalid StarPass code' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user._id, starPassCode: user.starPassCode, name: user.name, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
