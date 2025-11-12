// server/routes/staff.js
const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/authMiddleware'); // expects req.user
const Ride = require('../models/Ride');
const QueueEntry = require('../models/QueueEntry');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { generateShortToken } = require('../utils/token'); // adjust path if different
const Batch = require('../models/Batch');


const router = express.Router();

/**
 * Helper: only allow staff/admin
 */
function requireStaff(req, res, next) {
  if (!req.user || !['staff','admin'].includes(req.user.role)) {
    return res.status(403).json({ msg: 'Forbidden: staff only' });
  }
  next();
}

/**
 * GET /api/staff/rides
 * Returns list of rides with counts of waiting+active queue entries
 * Sorted by congestion desc (most entries first)
 */
router.get('/rides', auth, requireStaff, async (req, res) => {
  try {
    // fetch rides
    const rides = await Ride.find().lean();

    // fetch counts for all rides in one query (aggregation)
    const counts = await QueueEntry.aggregate([
      { $match: { status: { $in: ['waiting','active'] } } },
      { $group: { _id: '$ride', count: { $sum: 1 } } }
    ]);

    const countsMap = counts.reduce((acc, c) => {
      acc[String(c._id)] = c.count;
      return acc;
    }, {});

    const out = rides.map(r => ({
      id: r._id,
      name: r.name,
      status: r.status,
      capacity: r.capacity,
      duration: r.duration,
      image: r.image || null,
      location: r.location || null,
      queueCount: countsMap[String(r._id)] || 0,
      createdAt: r.createdAt
    }));

    out.sort((a,b) => b.queueCount - a.queueCount); // most -> least
    return res.json({ rides: out });
  } catch (err) {
    console.error('GET /api/staff/rides error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * GET /api/staff/ride/:id/queue
 * Return waiting list for given ride (detailed)
 */
router.get('/ride/:id/queue', auth, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ msg: 'Invalid ride id' });

    const ride = await Ride.findById(id);
    if (!ride) return res.status(404).json({ msg: 'Ride not found' });

    const waiting = await QueueEntry.find({ ride: id, status: 'waiting' })
      .sort('joinedAt')
      .populate('user','name')
      .lean();

    const out = waiting.map(e => ({
      id: e._id,
      user: { id: e.user?._id || e.user, name: e.user?.name || null },
      position: e.position,
      status: e.status,
      joinedAt: e.joinedAt
    }));

    return res.json({ ride: { id: ride._id, name: ride.name, capacity: ride.capacity, duration: ride.duration }, waiting: out });
  } catch (err) {
    console.error('GET /api/staff/ride/:id/queue error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * POST /api/staff/queue/join
 * Body: { rideId, uid? , name? }
 * Staff will add guest to queue by scanning QRs or manual uid/name.
 * When adding, we set addedBy: req.user.id
 */
router.post('/queue/join', auth, requireStaff, async (req, res) => {
  try {
    const staffId = req.user.id;
    const { rideId, uid, name } = req.body;
    if (!rideId) return res.status(400).json({ msg: 'rideId required' });
    if (!uid && !name) return res.status(400).json({ msg: 'uid or name required' });

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ msg: 'Ride not found' });
    if (ride.status !== 'open') return res.status(400).json({ msg: `Ride is ${ride.status}` });

    // Resolve user by uid or name
    let user;
    if (uid) user = await User.findById(uid);
    else user = await User.findOne({ name });

    if (!user) return res.status(404).json({ msg: 'Guest not found' });
    if (!user.verified) return res.status(403).json({ msg: 'Guest not verified at gate' });

    // limit check: max 3 waiting/active
    const activeCount = await QueueEntry.countDocuments({ user: user._id, status: { $in: ['waiting','active'] }});
    if (activeCount >= 3) return res.status(400).json({ msg: 'Queue limit reached (max 3)' });

    // duplicate check
    const duplicate = await QueueEntry.findOne({ ride: rideId, user: user._id, status: { $in: ['waiting','active'] }});
    if (duplicate) return res.status(400).json({ msg: 'Already in queue for this ride' });

    // compute position
    const waitingCount = await QueueEntry.countDocuments({ ride: rideId, status: 'waiting' });
    const position = waitingCount + 1;

    const entry = new QueueEntry({ ride: rideId, user: user._id, status: 'waiting', position, addedBy: staffId });
    await entry.save();

    return res.status(201).json({
      msg: 'Guest added to queue',
      entry: {
        id: entry._id,
        guest: { id: user._id, name: user.name },
        ride: { id: ride._id, name: ride.name },
        position,
        addedBy: staffId
      }
    });
  } catch (err) {
    console.error('POST /api/staff/queue/join error:', err);
    if (err.code === 11000) return res.status(400).json({ msg: 'Already in queue (duplicate)' });
    return res.status(500).json({ msg: 'Server error' });
  }
});


/**
 * POST /api/staff/queue/remove
 * Body: { entryId }
 * Staff cancels a waiting or active entry.
 */
router.post('/queue/remove', auth, requireStaff, async (req, res) => {
  try {
    const staffId = req.user.id;
    const { entryId } = req.body;
    if (!entryId || !mongoose.Types.ObjectId.isValid(entryId)) return res.status(400).json({ msg: 'Invalid entryId' });

    const entry = await QueueEntry.findById(entryId);
    if (!entry) return res.status(404).json({ msg: 'Queue entry not found' });

    if (!['waiting','active'].includes(entry.status)) {
      return res.status(400).json({ msg: `Cannot remove entry with status ${entry.status}` });
    }

    entry.status = 'cancelled';
    entry.removedBy = staffId;
    entry.removedAt = new Date();
    await entry.save();

    // recompute positions (reuse your helper if present)
    // If no helper, recompute here:
    const waiting = await QueueEntry.find({ ride: entry.ride, status: 'waiting' }).sort('joinedAt');
    for (let i = 0; i < waiting.length; i++) {
      waiting[i].position = i + 1;
      await waiting[i].save();
    }

    return res.json({ msg: 'Guest removed from queue by staff', entryId: entry._id, removedBy: staffId, removedAt: entry.removedAt });
  } catch (err) {
    console.error('POST /api/staff/queue/remove error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * POST /api/staff/queue/start-batch
 * Body: { rideId }
 * Moves the first `capacity` waiting entries to `active`. Returns the moved entries.
 */
// POST /api/staff/queue/start-batch
router.post('/queue/start-batch', auth, requireStaff, async (req, res) => {
  try {
    const staffId = req.user.id;
    const { rideId, force } = req.body;
    if (!rideId || !mongoose.Types.ObjectId.isValid(rideId)) return res.status(400).json({ msg: 'Invalid ride id' });

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ msg: 'Ride not found' });
    if (ride.status !== 'open') return res.status(400).json({ msg: `Ride is ${ride.status}` });

    // Check for existing active batch
    const existing = await Batch.findOne({ ride: rideId, status: 'active' });
    if (existing && !force) {
      return res.status(400).json({ msg: 'An active batch already exists for this ride. End it before starting a new one.' });
    }

    // If force, optionally end existing batch first
    if (existing && force) {
      // mark existing as cancelled (or complete) and its entries back to waiting or completed depending on policy
      existing.status = 'cancelled';
      existing.endedAt = new Date();
      existing.endedBy = staffId;
      await existing.save();
      // set entries in that batch to 'cancelled' 
      await QueueEntry.updateMany({ batch: existing._id }, { $set: { status: 'cancelled', removedAt: new Date(), removedBy: staffId, batch: null } });
      // re-compute positions for waiting entries below (done later)
    }

    const capacity = Math.max(1, Number(ride.capacity) || 1);

    // select first capacity waiting entries
    const waitingDocs = await QueueEntry.find({ ride: rideId, status: 'waiting' }).sort('joinedAt').limit(capacity);

    if (!waitingDocs || waitingDocs.length === 0) {
      return res.status(400).json({ msg: 'No waiting entries to start' });
    }

    // Create new Batch
    const now = new Date();
    const expectedEnd = new Date(now.getTime() + (Number(ride.duration || 0) * 60 * 1000)); // minutes -> ms
    const batch = new Batch({ ride: rideId, capacity, startedBy: staffId, expectedEndAt: expectedEnd });
    await batch.save();

    // Move waiting entries into batch
    const moved = [];
    for (const e of waitingDocs) {
      e.status = 'active';
      e.batch = batch._id;
      e.startedAt = now;
      await e.save();
      moved.push({ id: e._id, user: e.user, position: e.position });
    }

    // recompute positions for remaining waiting entries
    const remaining = await QueueEntry.find({ ride: rideId, status: 'waiting' }).sort('joinedAt');
    for (let i = 0; i < remaining.length; i++) {
      remaining[i].position = i + 1;
      await remaining[i].save();
    }

    // schedule auto-end (best-effort; not reliable across restarts)
    const delay = Math.max(0, expectedEnd.getTime() - Date.now());
    setTimeout(async () => {
      try {
        // find batch still active
        const b = await Batch.findById(batch._id);
        if (b && b.status === 'active') {
          // mark completed:
          b.status = 'completed';
          b.endedAt = new Date();
          await b.save();
          // mark entries in batch as completed
          await QueueEntry.updateMany({ batch: b._id }, { $set: { status: 'completed', endedAt: new Date() } });
        }
      } catch (e) {
        console.error('auto-end-batch error', e);
      }
    }, delay);

    return res.json({ msg: 'Batch started', batchId: batch._id, movedCount: moved.length, moved });
  } catch (err) {
    console.error('POST /api/staff/queue/start-batch error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});



// POST /api/staff/queue/end-batch
router.post('/queue/end-batch', auth, requireStaff, async (req, res) => {
  try {
    const staffId = req.user.id;
    const { batchId } = req.body;
    if (!batchId || !mongoose.Types.ObjectId.isValid(batchId)) return res.status(400).json({ msg: 'Invalid batch id' });

    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ msg: 'Batch not found' });
    if (batch.status !== 'active') return res.status(400).json({ msg: 'Batch is not active' });

    batch.status = 'completed';
    batch.endedAt = new Date();
    batch.endedBy = staffId;
    await batch.save();

    // mark entries in batch as completed
    await QueueEntry.updateMany({ batch: batch._id }, { $set: { status: 'completed', endedAt: new Date(), batch: null } });

    // recompute waiting positions
    const remaining = await QueueEntry.find({ ride: batch.ride, status: 'waiting' }).sort('joinedAt');
    for (let i = 0; i < remaining.length; i++) {
      remaining[i].position = i + 1;
      await remaining[i].save();
    }

    return res.json({ msg: 'Batch ended', batchId: batch._id });
  } catch (err) {
    console.error('POST /api/staff/queue/end-batch error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});


// POST /api/staff/queue/pushback
router.post('/queue/pushback', auth, requireStaff, async (req, res) => {
  try {
    const { entryId } = req.body;
    if (!entryId || !mongoose.Types.ObjectId.isValid(entryId)) return res.status(400).json({ msg: 'Invalid entry id' });

    const entry = await QueueEntry.findById(entryId);
    if (!entry) return res.status(404).json({ msg: 'Queue entry not found' });
    if (entry.status !== 'waiting') return res.status(400).json({ msg: 'Only waiting entries can be pushed back' });

    const rideId = entry.ride;
    // get current waiting count (excluding this entry)
    const waitingCount = await QueueEntry.countDocuments({ ride: rideId, status: 'waiting', _id: { $ne: entry._id } });
    // set this entry's position to waitingCount + 1 (end)
    entry.position = waitingCount + 1;
    // update joinedAt so it's considered last (optional)
    entry.joinedAt = new Date();
    await entry.save();

    // recompute positions for other waiting entries (ordered by joinedAt)
    const waiting = await QueueEntry.find({ ride: rideId, status: 'waiting' }).sort('joinedAt');
    for (let i = 0; i < waiting.length; i++) {
      waiting[i].position = i + 1;
      await waiting[i].save();
    }

    return res.json({ msg: 'Moved to end of line', entryId: entry._id });
  } catch (err) {
    console.error('POST /api/staff/queue/pushback error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});


// GET /api/staff/ride/:id/active-batch
router.get('/ride/:id/active-batch', auth, requireStaff, async (req, res) => {
  const { id } = req.params;
  // find active batch for ride
  const batch = await Batch.findOne({ ride: id, status: 'active' }).lean();
  if (!batch) return res.json({ batch: null });
  // get entries belonging to batch with user names
  const entries = await QueueEntry.find({ batch: batch._id }).populate('user','name').lean();
  return res.json({ batch, entries });
});



// POST /api/staff/create-guest   (staff-only registration for guests without phones)
router.post('/create-guest', auth, requireStaff, async (req, res) => {
  try {
    const staffId = req.user.id;
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ msg: 'Name is required' });
    }

    const exists = await User.findOne({ name });
    if (exists) {
      return res.status(400).json({ msg: 'Guest name already exists' });
    }

    // create user: role guest, verified true (since staff registers at gate)
    const verificationToken = generateShortToken(8);
    const expiresAt = null; // no expiry since verified immediately
    const userData = {
      name,
      role: 'guest',
      verified: true,
      verificationToken,           // may keep for QR payload (vtok)
      verificationTokenExpires: null,
      verifiedAt: new Date(),
      verifiedBy: staffId
    };

    const user = new User(userData);
    await user.save();

    // create a small payload that will be encoded to the QR used on printed stub
    const qrPayload = { uid: user._id.toString(), vtok: verificationToken };

    // Return the created user and qrPayload so the client can print stub
    return res.status(201).json({
      msg: 'Guest created and activated',
      user: { id: user._id, name: user.name, verified: user.verified },
      qrPayload
    });
  } catch (err) {
    console.error('POST /api/staff/create-guest error:', err);
    if (err.code === 11000) return res.status(400).json({ msg: 'Duplicate key error' });
    return res.status(500).json({ msg: 'Server error' });
  }
});




module.exports = router;
