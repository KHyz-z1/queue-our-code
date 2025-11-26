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
const ALLOWED_STATUS = ['open', 'closed', 'maintenance'];
const ALLOWED_CATEGORIES = ['Attractions', 'Kiddie Rides', 'Family Rides', 'Teen/Adult Rides', 'Extreme Rides'];


// GET /api/admin/rides
router.get('/rides', auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Forbidden: admin only' });
    }

    const rides = await Ride.find().sort({ createdAt: -1 });

    const out = rides.map(r => ({
      id: r._id,
      name: r.name,
      description: r.description || '',
      category: r.category || 'Attractions',
      status: r.status,
      capacity: r.capacity,
      duration: r.duration,
      image: r.image || null,
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

    const {
      name,
      description = '',
      category = 'Attractions',
      status = 'open',
      capacity = 1,
      duration = 5,
      location = null
    } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ msg: 'Ride name required' });
    }

    // Duplicate name check
    const existing = await Ride.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") }
    });
    if (existing) return res.status(400).json({ msg: "Ride name already exists" });

    // Validate category
    if (!ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({
        msg: `Invalid category. Allowed: ${ALLOWED_CATEGORIES.join(", ")}`
      });
    }

    // Validate status
    if (!ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({
        msg: `Invalid status. Allowed: ${ALLOWED_STATUS.join(", ")}`
      });
    }

    let parsedLocation = undefined;
if (location !== undefined && location !== null && location !== '') {
  if (typeof location === 'string') {
    try {
      parsedLocation = JSON.parse(location);
      // guard: ensure parsedLocation is an object with optional lat/lng
      if (typeof parsedLocation !== 'object' || Array.isArray(parsedLocation)) {
        parsedLocation = undefined;
      }
    } catch (e) {
      // not JSON -> ignore / treat as undefined
      parsedLocation = undefined;
    }
  } else if (typeof location === 'object') {
    parsedLocation = location;
  }
}

const rideData = {
  name: name.trim(),
  description: (description || '').trim(),
  category,
  status,
  capacity: Number(capacity) > 0 ? Number(capacity) : 1,
  duration: Number(duration) > 0 ? Number(duration) : 5,
  location: parsedLocation
};

    if (req.file) {
      rideData.image = `/uploads/${req.file.filename}`;
    }

    const ride = new Ride(rideData);
    await ride.save();

    return res.status(201).json({
      msg: 'Ride created',
      ride: {
        id: ride._id,
        name: ride.name,
        description: ride.description,
        category: ride.category,
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: 'Invalid ride id' });
    }

    const ride = await Ride.findById(id);
    if (!ride) return res.status(404).json({ msg: 'Ride not found' });

    const {
      name,
      description,
      category,
      status,
      capacity,
      duration,
      location
    } = req.body;

    // Duplicate name check
    if (name && typeof name === 'string') {
      const trimmedName = name.trim();
      const existing = await Ride.findOne({
        name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
        _id: { $ne: id }
      });
      if (existing) {
        return res.status(400).json({ msg: "Ride name already exists" });
      }
      ride.name = trimmedName;
    }

    if (description !== undefined) {
      ride.description = description.trim();
    }

    if (category !== undefined) {
      if (!ALLOWED_CATEGORIES.includes(category)) {
        return res.status(400).json({
          msg: `Invalid category. Allowed: ${ALLOWED_CATEGORIES.join(", ")}`
        });
      }
      ride.category = category;
    }

    if (status && ALLOWED_STATUS.includes(status)) {
      ride.status = status;
    }

    if (capacity !== undefined && Number(capacity) > 0) {
      ride.capacity = Number(capacity);
    }

    if (duration !== undefined && Number(duration) > 0) {
      ride.duration = Number(duration);
    }

   if (location !== undefined) {
  // parse location if client sent a JSON string (multipart/form-data)
  let parsedLocation = undefined;
  if (typeof location === 'string') {
    try {
      parsedLocation = JSON.parse(location);
      if (typeof parsedLocation !== 'object' || Array.isArray(parsedLocation)) parsedLocation = undefined;
    } catch (e) {
      parsedLocation = undefined;
    }
  } else if (typeof location === 'object') {
    parsedLocation = location;
  }
  if (parsedLocation !== undefined) {
    ride.location = parsedLocation;
  } else {
  }
}


    if (req.file) {
      ride.image = `/uploads/${req.file.filename}`;
    }

    await ride.save();

    return res.json({
      msg: 'Ride updated',
      ride: {
        id: ride._id,
        name: ride.name,
        description: ride.description,
        category: ride.category,
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: 'Invalid ride id' });
    }

    const ride = await Ride.findById(id);
    if (!ride) return res.status(404).json({ msg: 'Ride not found' });

    const hasActive = await QueueEntry.exists({
      ride: id,
      status: { $in: ['waiting', 'active'] }
    });

    if (hasActive) {
      return res.status(400).json({
        msg: 'Cannot delete ride with active or waiting queue entries'
      });
    }

    await Ride.deleteOne({ _id: id });

    return res.json({ msg: 'Ride deleted' });

  } catch (err) {
    console.error('DELETE /api/admin/rides/:id error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});



/**
 * GET /api/admin/guests
 * Admin-only: list guest users (minimal fields) and their active/waiting queues
 */
router.get('/guests', auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Forbidden: admin only' });
    }

    // Guests only; bring verifiedBy user name via populate
    const guests = await User.find({ role: { $in: ['guest', null, undefined] } })
      .select('_id name verified verifiedAt verifiedBy createdAt')
      .populate('verifiedBy', 'name role') // <-- get staff/admin name
      .sort({ createdAt: -1 })
      .lean();

    // Collect their ids
    const guestIds = guests.map(g => g._id);

    // Fetch active/waiting queue entries for these guests
    const entries = await QueueEntry.find({
      user: { $in: guestIds },
      status: { $in: ['waiting', 'active'] }
    })
      .select('user ride position status joinedAt') // <-- include user so we can group
      .populate('ride', 'name') // get ride name
      .lean();

    // Group by user id
    const byUser = {};
    for (const e of entries) {
      const uid = String(e.user);
      if (!byUser[uid]) byUser[uid] = [];
      byUser[uid].push({
        id: e._id,
        rideId: e.ride?._id || null,
        rideName: e.ride?.name || null,
        position: e.position,
        status: e.status,
        joinedAt: e.joinedAt
      });
    }

    const out = guests.map(g => ({
      id: g._id,                      // <-- explicit id
      name: g.name,
      verified: !!g.verified,
      verifiedAt: g.verifiedAt || null,
      verifiedBy: g.verifiedBy?._id || null,
      verifiedByName: g.verifiedBy?.name || null, // <-- staff name
      createdAt: g.createdAt,
      activeQueues: byUser[String(g._id)] || []
    }));

    return res.json({ guests: out });
  } catch (err) {
    console.error('GET /api/admin/guests error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});


/**
 * DELETE /api/admin/guests/:id
 * Admin-only: delete a guest record. Prevent deletion if they have active/waiting queues.
 */
router.delete('/guests/:id', auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Forbidden: admin only' });
    }

    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: 'Invalid user id' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (user.role && user.role !== 'guest') {
      return res.status(400).json({ msg: 'Can only delete guest users via this endpoint' });
    }

    // check for active/waiting queues
    const hasActive = await QueueEntry.exists({ user: id, status: { $in: ['waiting','active'] } });
    if (hasActive) {
      return res.status(400).json({ msg: 'Cannot delete guest with active/waiting queues. Cancel queues first.' });
    }

    // safe to delete
    await User.deleteOne({ _id: id });

    // await QueueEntry.deleteMany({ user: id });

    return res.json({ msg: 'Guest deleted' });
  } catch (err) {
    console.error('DELETE /api/admin/guests/:id error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/admin/rides/:id/pin
router.post('/rides/:id/pin', auth, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ msg: 'Unauthorized' });

    const { id } = req.params;
    if (!id || !require('mongoose').Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: 'Invalid ride id' });
    }

    const ride = await Ride.findById(id);
    if (!ride) return res.status(404).json({ msg: 'Ride not found' });

    const callerId = String(req.user.id);
    const bodyPinned = typeof req.body.pinned === 'boolean' ? req.body.pinned : null;

    if (bodyPinned === true) {
      await Ride.updateOne({ _id: id }, { $addToSet: { pinnedBy: callerId } });
    } else if (bodyPinned === false) {
      await Ride.updateOne({ _id: id }, { $pull: { pinnedBy: callerId } });
    } else {
      const isPinned = Array.isArray(ride.pinnedBy) && ride.pinnedBy.map(String).includes(callerId);
      if (isPinned) {
        await Ride.updateOne({ _id: id }, { $pull: { pinnedBy: callerId } });
      } else {
        await Ride.updateOne({ _id: id }, { $addToSet: { pinnedBy: callerId } });
      }
    }

    // return updated pinnedByIds
    const updated = await Ride.findById(id).select('pinnedBy');
    const pinnedByIds = (updated.pinnedBy || []).map(x => String(x));
    const pinnedNow = pinnedByIds.includes(callerId);

    return res.json({ msg: pinnedNow ? 'Pinned by you' : 'Unpinned', ride: { id, pinnedByIds } });
  } catch (err) {
    console.error('POST /api/admin/rides/:id/pin error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});



router.get('/reports/daily', auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ msg: 'Forbidden' });

    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);

    // 1) Registered guests today
    const guestsToday = await mongoose.model('User').countDocuments({
      createdAt: { $gte: start, $lte: end },
      role: 'guest'
    });

    // 2) Queue stats per ride (completed/cancelled by staff/cancelled by guest)
    const perRide = await QueueEntry.aggregate([
      { $match: {
         $or: [
           { endedAt: { $gte: start, $lte: end } },            // completed today
           { cancelledAt: { $gte: start, $lte: end } }         // cancelled today
         ]
      }},
      { $project: {
          ride: 1,
          isCompleted: { $cond: [{ $and: [ { $ifNull: ["$endedAt", false] }, { $gte: ["$endedAt", start] }, { $lte: ["$endedAt", end] } ] }, 1, 0] },
          cancelledByRole: 1,
          isCancelledToday: { $cond: [{ $and: [ { $ifNull: ["$cancelledAt", false] }, { $gte: ["$cancelledAt", start] }, { $lte: ["$cancelledAt", end] } ] }, 1, 0] }
      }},
      { $group: {
          _id: '$ride',
          completed_count: { $sum: '$isCompleted' },
          cancelled_total: { $sum: '$isCancelledToday' },
          cancelled_by_staff: { $sum: { $cond: [{ $and: ['$isCancelledToday', { $eq: ['$cancelledByRole','staff'] }] }, 1, 0] } },
          cancelled_by_guest: { $sum: { $cond: [{ $and: ['$isCancelledToday', { $eq: ['$cancelledByRole','guest'] }] }, 1, 0] } }
      }},
      { $lookup: { from: 'rides', localField: '_id', foreignField: '_id', as: 'ride' } },
      { $unwind: { path: '$ride', preserveNullAndEmptyArrays: true } },
      { $project: {
          rideId: '$_id',
          rideName: '$ride.name',
          completed_count: 1,
          cancelled_total: 1,
          cancelled_by_staff: 1,
          cancelled_by_guest: 1
      }}
    ]);

    // Also compute totals across all rides for the day
    const totals = perRide.reduce((acc, r) => {
      acc.completed += r.completed_count || 0;
      acc.cancelled_total += r.cancelled_total || 0;
      acc.cancelled_by_staff += r.cancelled_by_staff || 0;
      acc.cancelled_by_guest += r.cancelled_by_guest || 0;
      return acc;
    }, { completed: 0, cancelled_total: 0, cancelled_by_staff: 0, cancelled_by_guest: 0 });

    return res.json({
      guestsToday,
      perRide,
      totals
    });

  } catch (err) {
    console.error('GET /api/admin/reports/daily error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});






module.exports = router;
