// server/routes/admin.js
const express = require('express');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');

const router = express.Router();

/**
 * POST /api/admin/create-staff
 * Admin-only endpoint to create staff users.
 * Body: { name: string, starPassCode?: string }
 */
router.post('/create-staff', auth, async (req, res) => {
  try {
    // ensure the caller is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Forbidden: admin only' });
    }

    const { name, starPassCode } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ msg: 'Name is required' });
    }

    // If a starPassCode was provided, ensure it's unique
    if (starPassCode) {
      const existing = await User.findOne({ starPassCode });
      if (existing) {
        return res.status(400).json({ msg: 'starPassCode already in use' });
      }
    }

    // Create the staff user; mark verified true (staff are active)
    const userData = {
      name,
      role: 'staff',
      verified: true,
      subscriptionType: '',
    };
    if (starPassCode) userData.starPassCode = starPassCode;

    const staff = new User(userData);
    await staff.save();

    // Issue JWT for staff
    const token = jwt.sign({ id: staff._id, role: staff.role }, process.env.JWT_SECRET, { expiresIn: '8h' });

    // Return minimal info + token
    return res.status(201).json({
      token,
      user: { id: staff._id, name: staff.name, role: staff.role }
    });
  } catch (err) {
    console.error('POST /api/admin/create-staff error:', err);
    // duplicate key may still occur; handle w/ this
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Duplicate key error - maybe starPassCode already exists' });
    }
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
