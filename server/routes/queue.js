// server/routes/queue.js
const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const Ride = require('../models/Ride');
const QueueEntry = require('../models/QueueEntry');

const router = express.Router();

// helper: recompute positions and ETA for waiting entries of a ride
async function recomputePositionsAndEta(rideId) {
  // load ride to access capacity & duration
  const ride = await Ride.findById(rideId);
  const capacity = ride?.capacity || 1;
  const duration = ride?.duration || 5; // minutes

  const waiting = await QueueEntry.find({ ride: rideId, status: 'waiting' }).sort('joinedAt');

  for (let i = 0; i < waiting.length; i++) {
    const position = i + 1;
    waiting[i].position = position;

    // compute batches ahead: which batch number will this entry be served in?
    const batchNumber = Math.ceil(position / capacity); // 1-based
    // estimated minutes until batch starts (batches before this one)
    const minutesUntilStart = (batchNumber - 1) * duration;

    waiting[i].etaMinutes = minutesUntilStart;
    waiting[i].estimatedReturnAt = new Date(Date.now() + minutesUntilStart * 60000);

    await waiting[i].save();
  }
}


/**
 * POST /api/queue/join
 * Body: { rideId: "<rideId>", guestId: "<guestId>" }
 * Requirements:
 *  - must be called by STAFF or ADMIN (role check)
 *  - guest must be verified
 *  - guest must not already be in this ride queue
 *  - guest must be in < 3 queue entries with status waiting/active
 */
router.post('/join', auth, async (req, res) => {
  try {
    const staffId = req.user.id;
    const staffRole = req.user.role;
    const { rideId, guestId } = req.body;

    if (!rideId || !guestId)
      return res.status(400).json({ msg: 'rideId and guestId are required' });

    // Check that caller is staff/admin
    if (!['staff', 'admin'].includes(staffRole)) {
      return res.status(403).json({ msg: 'Only staff can add guests to queues' });
    }

    // Verify guest account
    const guest = await User.findById(guestId);
    if (!guest) return res.status(404).json({ msg: 'Guest not found' });
    if (!guest.verified)
      return res
        .status(403)
        .json({ msg: 'Guest not verified. Please verify at the gate first.' });

    // Verify ride exists and is open
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ msg: 'Ride not found' });
    if (ride.status !== 'open')
      return res.status(400).json({ msg: `Ride is ${ride.status}` });

    // Check guest queue count (limit 3)
    const activeCount = await QueueEntry.countDocuments({
      user: guestId,
      status: { $in: ['waiting', 'active'] },
    });
    if (activeCount >= 3) {
      return res
        .status(400)
        .json({ msg: 'Guest has reached the queue limit (max 3 rides)' });
    }

    // Prevent duplicate for same ride
    const existing = await QueueEntry.findOne({
      ride: rideId,
      user: guestId,
      status: { $in: ['waiting', 'active'] },
    });
    if (existing)
      return res
        .status(400)
        .json({ msg: 'Guest is already in queue for this ride' });

    // Compute new position (count waiting entries for ride)
    const waitingCount = await QueueEntry.countDocuments({
      ride: rideId,
      status: 'waiting',
    });
    const position = waitingCount + 1;

    // compute ETA using ride.duration & capacity
    const capacity = ride.capacity || 1;
    const duration = ride.duration || 5; // minutes
    const batchNumber = Math.ceil(position / capacity);
    const minutesUntilStart = (batchNumber - 1) * duration;
    const etaMinutes = minutesUntilStart;
    const estimatedReturnAt = new Date(Date.now() + minutesUntilStart * 60000);

    // Create queue entry
    const entry = new QueueEntry({
      ride: rideId,
      user: guestId,
      status: 'waiting',
      position,
      etaMinutes,
      estimatedReturnAt
    });
    await entry.save();

    // respond with details (include ETA)
    return res.status(201).json({
      msg: 'Guest added to queue',
      entry: {
        id: entry._id,
        guest: { id: guest._id, name: guest.name },
        ride: { id: ride._id, name: ride.name },
        position,
        etaMinutes,
        estimatedReturnAt,
        addedBy: staffId,
      },
    });
  } catch (err) {
    console.error('POST /api/queue/join error:', err);
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ msg: 'Guest is already in queue for this ride (duplicate)' });
    }
    return res.status(500).json({ msg: 'Server error' });
  }
});


/**
 * POST /api/queue/cancel-by-staff
 * Body: { entryId: "<entryId>" } OR { rideId: "<rideId>", guestId: "<guestId>" }
 * Protected: staff or admin only
 * Marks entry as cancelled, sets removedBy/removedAt, and recomputes positions.
 */
router.post('/cancel-by-staff', auth, async (req, res) => {
  try {
    const callerId = req.user.id;
    const callerRole = req.user.role;

    // only staff/admin allowed
    if (!['staff','admin'].includes(callerRole)) {
      return res.status(403).json({ msg: 'Forbidden: staff only' });
    }

    const { entryId, rideId, guestId, reason } = req.body;
    if (!entryId && !(rideId && guestId)) {
      return res.status(400).json({ msg: 'entryId or (rideId and guestId) required' });
    }

    let entry;
    if (entryId) {
      entry = await QueueEntry.findById(entryId);
    } else {
      entry = await QueueEntry.findOne({ ride: rideId, user: guestId, status: { $in: ['waiting','active'] } });
    }

    if (!entry) return res.status(404).json({ msg: 'Queue entry not found' });

    // If already cancelled or completed, reject
    if (!['waiting','active'].includes(entry.status)) {
      return res.status(400).json({ msg: `Queue entry already ${entry.status} and cannot be cancelled` });
    }

    // mark cancelled and record who removed
    entry.status = 'cancelled';
    entry.removedBy = callerId;
    entry.removedAt = new Date();
    // optional: entry.reason = reason;
    await entry.save();


    // recompute positions for other waiting users
    await recomputePositionsAndEta(entry.ride);

    return res.json({
      msg: 'Guest removed from queue by staff',
      entryId: entry._id,
      removedBy: callerId,
      removedAt: entry.removedAt
    });
  } catch (err) {
    console.error('POST /api/queue/cancel-by-staff error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * POST /api/queue/leave
 * Body: { entryId: "<queueEntryId>" } or { rideId: "<rideId>" }
 * If rideId provided, remove user's waiting entry for that ride
 */
router.post('/leave', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { entryId, rideId } = req.body;

    if (!entryId && !rideId)
      return res.status(400).json({ msg: 'entryId or rideId required' });

    let entry;

    if (entryId) {
      entry = await QueueEntry.findOne({ _id: entryId, user: userId });
    } else {
      entry = await QueueEntry.findOne({ ride: rideId, user: userId, status: { $in: ['waiting','active'] } });
    }
    if (!entry) return res.status(404).json({ msg: 'Queue entry not found or not cancellable' });

// If entry is already cancelled/completed — reject instead of re-cancelling
    if (!['waiting','active'].includes(entry.status)) {
     return res.status(400).json({ msg: `Queue entry cannot be cancelled (status=${entry.status})` });
    }

// Mark cancelled (soft delete) so history remains
entry.status = 'cancelled';
entry.removedBy = userId; // guest cancelled themself
entry.removedAt = new Date();
await entry.save();


    // Recompute positions for remaining waiting users
   await recomputePositionsAndEta(entry.ride);


    return res.json({ msg: 'Left queue', entryId: entry._id });
  } catch (err) {
    console.error('POST /api/queue/leave error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * GET /api/queue/status/:rideId
 * Public endpoint: returns current waiting list count and next N users
 */
router.get('/status/:rideId', async (req, res) => {
  try {
    const { rideId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(rideId))
      return res.status(400).json({ msg: 'Invalid rideId' });

    const ride = await Ride.findById(rideId);
    if (!ride)
      return res.status(404).json({ msg: 'Ride not found' });

    const waitingCount = await QueueEntry.countDocuments({
      ride: rideId,
      status: 'waiting',
    });

    const nextInLine = await QueueEntry.find({
      ride: rideId,
      status: 'waiting',
    })
      .sort('joinedAt')
      .limit(10)
      .populate('user', 'name');

    return res.json({
      ride: {
        id: ride._id,
        name: ride.name,
        status: ride.status,
      },
      waitingCount,
      nextInLine: nextInLine.map(e => ({
        id: e._id,
        user: e.user,
        position: e.position,
      })),
    });
  } catch (err) {
    console.error('GET /api/queue/status error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * GET /api/queue/my-queues
 * Return current queues for logged-in user
 */
router.get('/my-queues', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const entries = await QueueEntry.find({
      user: userId,
      status: { $in: ['waiting', 'active'] },
    })
      .populate('ride')
      .sort('joinedAt');

    return res.json({
      queues: entries.map(e => ({
    id: e._id.toString(),
    ride: e.ride || null,
    position: e.position,
    status: e.status,
    joinedAt: e.joinedAt || e.createdAt || null, 
    createdAt: e.createdAt || null,
    rideName: e.ride?.name || null,
    rideDuration: e.ride?.duration || null,
    rideCapacity: e.ride?.capacity || null,
    user: e.user || null
  })),
    });
  } catch (err) {
    console.error('GET /api/queue/my-queues error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});


// append to server/routes/queue.js (near other routes)
// GET /api/queue/history
// Protected: returns user's past (completed/cancelled) queue entries (paginated optional)
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // find past entries for this user (completed/cancelled)
    const past = await QueueEntry.find({
      user: userId,
      status: { $in: ['completed', 'cancelled'] }
    })
      .sort({ joinedAt: -1 })
      .limit(200) // safety cap, change if needed
      .populate('ride', 'name');

    const formatted = past.map(e => ({
      id: e._id.toString(),
      ride: e.ride ? { id: e.ride._id.toString(), name: e.ride.name } : null,
      position: e.position,
      status: e.status,
      joinedAt: e.joinedAt,
      removedAt: e.removedAt || null,
      completedAt: e.completedAt || null,
      removedBy: e.removedBy || null // may be staff id
    }));

    return res.json({ history: formatted });
  } catch (err) {
    console.error('GET /api/queue/history error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});


module.exports = router;

