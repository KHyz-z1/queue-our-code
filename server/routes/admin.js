// server/routes/admin.js
const express = require('express');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const Ride = require('../models/Ride');
const QueueEntry = require('../models/QueueEntry');
const multer = require('multer');
const path = require('path');

const router = express.Router();


// multer config: store uploads in server/uploads with timestamped filenames
const uploadDir = path.join(__dirname, '..', 'uploads');
// ensure folder exists (optional runtime check)
const fs = require('fs');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});

// accept only common image mime types & max 3MB
function fileFilter (req, file, cb) {
  if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files (jpeg/png/webp/gif) are allowed'), false);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 3 * 1024 * 1024 }});


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
      expiresAt: null,
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

/**
 * GET /api/admin/staffs
 * Admin-only. Return list of staff users (minimal fields).
 */
router.get('/staffs', auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Forbidden: admin only' });
    }

    // fetch staff users only, exclude sensitive fields
    const staffs = await User.find({ role: 'staff' })
      .select('_id name starPassCode role createdAt verified')
      .sort({ createdAt: -1 });

    // normalize id field for frontend convenience
    const out = staffs.map((s) => ({
      id: s._id,
      name: s.name,
      starPassCode: s.starPassCode || null,
      role: s.role,
      verified: s.verified,
      createdAt: s.createdAt,
    }));

    return res.json({ staffs: out });
  } catch (err) {
    console.error('GET /api/admin/staffs error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * DELETE /api/admin/staffs/:id
 * Admin-only. Delete a staff user by id.
 */
router.delete('/staffs/:id', auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Forbidden: admin only' });
    }

    const { id } = req.params;
    // validate ObjectId
    if (!id || !require('mongoose').Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: 'Invalid staff id' });
    }

    // ensure the user exists and is staff
    const staff = await User.findById(id);
    if (!staff) return res.status(404).json({ msg: 'Staff not found' });
    if (staff.role !== 'staff') return res.status(400).json({ msg: 'Target is not a staff user' });

    await User.deleteOne({ _id: id });
    return res.json({ msg: 'Staff deleted' });
  } catch (err) {
    console.error('DELETE /api/admin/staffs/:id error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});


/**
 * PUT /api/admin/staffs/:id
 * Admin-only. Edit a staff user's name and/or starPassCode.
 * Body: { name?: string, starPassCode?: string }
 */
router.put('/staffs/:id', auth, async (req, res) => {
  try {
    // admin-only
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Forbidden: admin only' });
    }

    const { id } = req.params;
    const { name, starPassCode } = req.body;
    const mongoose = require('mongoose');

    // Validate id
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: 'Invalid staff id' });
    }

    const staff = await User.findById(id);
    if (!staff) return res.status(404).json({ msg: 'Staff not found' });
    if (staff.role !== 'staff') return res.status(400).json({ msg: 'Target is not a staff user' });

    // If starPassCode provided, check uniqueness (allow if same as current)
    if (starPassCode && starPassCode !== staff.starPassCode) {
      const existing = await User.findOne({ starPassCode });
      if (existing) {
        return res.status(400).json({ msg: 'starPassCode already in use' });
      }
      staff.starPassCode = starPassCode;
    }

    // Update name if provided
    if (name && typeof name === 'string' && name.trim() !== '') {
      staff.name = name.trim();
    }

    await staff.save();

    return res.json({
      msg: 'Staff updated',
      staff: {
        id: staff._id,
        name: staff.name,
        starPassCode: staff.starPassCode || null,
        role: staff.role,
      },
    });
  } catch (err) {
    console.error('PUT /api/admin/staffs/:id error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Duplicate key error - maybe starPassCode already exists' });
    }
    return res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * Admin Ride CRUD
 * Routes:
 *  GET    /api/admin/rides        - list rides
 *  POST   /api/admin/rides        - create ride
 *  PUT    /api/admin/rides/:id    - update ride
 *  DELETE /api/admin/rides/:id    - delete ride
 *
 * All routes are admin-only (auth middleware + role check).
 */

const mongoose = require('mongoose');

// GET /api/admin/rides
router.get('/rides', auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Forbidden: admin only' });
    }

    const rides = await Ride.find().sort({ createdAt: -1 }).select('_id name status capacity duration location createdAt');
    // normalize id property
    const out = rides.map(r => ({
      id: r._id,
      name: r.name,
      status: r.status,
      capacity: r.capacity,
      duration: r.duration,
      location: r.location || null,
      createdAt: r.createdAt
    }));
    return res.json({ rides: out });
  } catch (err) {
    console.error('GET /api/admin/rides error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/admin/rides
router.post('/rides', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Forbidden: admin only' });
    }

    const { name, status = 'open', capacity = 1, duration = 5, location = null } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ msg: 'Ride name required' });
    }

    const rideData = {
      name: name.trim(),
      status: ['open','closed','maintenance'].includes(status) ? status : 'open',
      capacity: Number.isInteger(Number(capacity)) && Number(capacity) > 0 ? Number(capacity) : 1,
      duration: typeof duration === 'number' ? duration : Number(duration) || 5,
      location: location || undefined
    };

    if (req.file) {
      // store a public path for the frontend
      rideData.image = `/uploads/${req.file.filename}`;
    }

    const ride = new Ride(rideData);
    await ride.save();

    return res.status(201).json({
      msg: 'Ride created',
      ride: {
        id: ride._id,
        name: ride.name,
        status: ride.status,
        capacity: ride.capacity,
        duration: ride.duration,
        image: ride.image || null,
        location: ride.location
      }
    });
  } catch (err) {
    console.error('POST /api/admin/rides error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});


// PUT /api/admin/rides/:id
router.put('/rides/:id', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Forbidden: admin only' });
    }

    const { id } = req.params;
    if (!id || !require('mongoose').Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: 'Invalid ride id' });
    }

    const ride = await Ride.findById(id);
    if (!ride) return res.status(404).json({ msg: 'Ride not found' });

    const { name, status, capacity, duration, location } = req.body;

    if (name && typeof name === 'string') ride.name = name.trim();
    if (status && ['open','closed','maintenance'].includes(status)) ride.status = status;
    if (capacity !== undefined && Number.isInteger(Number(capacity)) && Number(capacity) > 0) ride.capacity = Number(capacity);
    if (duration !== undefined && !isNaN(Number(duration)) && Number(duration) > 0) ride.duration = Number(duration);
    if (location !== undefined) ride.location = location;

    if (req.file) {
      // remove previous file? (optional) - not automatic here
      ride.image = `/uploads/${req.file.filename}`;
    }

    await ride.save();

    return res.json({
      msg: 'Ride updated',
      ride: {
        id: ride._id,
        name: ride.name,
        status: ride.status,
        capacity: ride.capacity,
        duration: ride.duration,
        image: ride.image || null,
        location: ride.location
      }
    });
  } catch (err) {
    console.error('PUT /api/admin/rides/:id error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});


// DELETE /api/admin/rides/:id
router.delete('/rides/:id', auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Forbidden: admin only' });
    }

    const { id } = req.params;
    if (!id || !require('mongoose').Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: 'Invalid ride id' });
    }

    const ride = await Ride.findById(id);
    if (!ride) return res.status(404).json({ msg: 'Ride not found' });

    // Safety: prevent deletion if there are active/waiting entries
    const hasActive = await QueueEntry.exists({ ride: id, status: { $in: ['waiting','active'] } });
    if (hasActive) return res.status(400).json({ msg: 'Cannot delete ride with active or waiting queue entries' });

    // optionally remove image file from disk (not implemented here)
    await Ride.deleteOne({ _id: id });
    return res.json({ msg: 'Ride deleted' });
  } catch (err) {
    console.error('DELETE /api/admin/rides/:id error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});




module.exports = router;
