// server/routes/queue.js
const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const Ride = require('../models/Ride');
const QueueEntry = require('../models/QueueEntry');

const router = express.Router();

/**
 * POST /api/queue/join
 * Body: { rideId: "<rideId>" }
 * Requirements:
 *  - user must be verified
 *  - user must not already be in this ride queue
 *  - user must be in < 3 queue entries with status waiting/active
 */
router.post('/join', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { rideId } = req.body;
    if (!rideId) return res.status(400).json({ msg: 'rideId required' });

    // ensure user exists and is verified
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (!user.verified) return res.status(403).json({ msg: 'Account not verified at gate' });

    // ensure ride exists and is open
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ msg: 'Ride not found' });
    if (ride.status !== 'open') return res.status(400).json({ msg: `Ride is ${ride.status}` });

    // check how many active/waiting queues the user has (limit 3)
    const activeCount = await QueueEntry.countDocuments({
      user: userId,
      status: { $in: ['waiting','active'] }
    });
    if (activeCount >= 3) {
      return res.status(400).json({ msg: 'Queue limit reached (max 3)' });
    }

    // check duplicate for same ride (because of compound unique index this will also fail)
    const existing = await QueueEntry.findOne({ ride: rideId, user: userId, status: { $in: ['waiting','active'] } });
    if (existing) return res.status(400).json({ msg: 'Already in queue for this ride' });

    // compute position (count waiting entries for ride) and create entry
    const waitingCount = await QueueEntry.countDocuments({ ride: rideId, status: 'waiting' });
    const position = waitingCount + 1;

    const entry = new QueueEntry({ ride: rideId, user: userId, status: 'waiting', position });
    await entry.save();

    return res.status(201).json({ msg: 'Joined queue', entry: { id: entry._id, ride: rideId, position } });
  } catch (err) {
    console.error('POST /api/queue/join error:', err);
    // duplicate key collision fallback
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Already in queue for this ride (duplicate)' });
    }
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
    if (!entryId && !rideId) return res.status(400).json({ msg: 'entryId or rideId required' });

    let entry;
    if (entryId) {
      entry = await QueueEntry.findOne({ _id: entryId, user: userId });
    } else {
      entry = await QueueEntry.findOne({ ride: rideId, user: userId, status: { $in: ['waiting','active'] } });
    }
    if (!entry) return res.status(404).json({ msg: 'Queue entry not found' });

    // Mark cancelled (soft delete) so history remains
    entry.status = 'cancelled';
    await entry.save();

    // Optional: recompute positions for remaining waiting users (simple approach)
    const waiting = await QueueEntry.find({ ride: entry.ride, status: 'waiting' }).sort('joinedAt');
    for (let i = 0; i < waiting.length; i++) {
      waiting[i].position = i + 1;
      await waiting[i].save();
    }

    return res.json({ msg: 'Left queue', entryId: entry._id });
  } catch (err) {
    console.error('POST /api/queue/leave error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * GET /api/queue/status/:rideId
 * Public endpoint: returns current waiting list count and a short list of next N users (IDs)
 */
router.get('/status/:rideId', async (req, res) => {
  try {
    const { rideId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(rideId)) return res.status(400).json({ msg: 'Invalid rideId' });

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ msg: 'Ride not found' });

    const waitingCount = await QueueEntry.countDocuments({ ride: rideId, status: 'waiting' });
    const nextInLine = await QueueEntry.find({ ride: rideId, status: 'waiting' })
      .sort('joinedAt')
      .limit(10)
      .populate('user','name');

    return res.json({
      ride: { id: ride._id, name: ride.name, status: ride.status },
      waitingCount,
      nextInLine: nextInLine.map(e => ({ id: e._id, user: e.user, position: e.position }))
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
    const entries = await QueueEntry.find({ user: userId, status: { $in: ['waiting','active'] } })
      .populate('ride','name status')
      .sort('joinedAt');

    return res.json({ queues: entries.map(e => ({ id: e._id, ride: e.ride, position: e.position, status: e.status })) });
  } catch (err) {
    console.error('GET /api/queue/my-queues error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
