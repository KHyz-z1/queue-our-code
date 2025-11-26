// server/routes/rides.js
const express = require('express');
const Ride = require('../models/Ride');
const QueueEntry = require('../models/QueueEntry');
const mongoose = require('mongoose');

const router = express.Router();


// GET /api/rides
// Public: returns rides with waitingCount (so guest homepage can sort least->most congested)
// Supports query params: q, category, sort ('waiting'|'name'|'congestion'), page, limit
router.get('/', async (req, res) => {
  try {
    const { q = '', category, sort = 'waiting', page = 1, limit = 200 } = req.query;

    // CHANGE: Initialize filter with status: 'open'
    // Para sure na guests will NEVER see maintenance or closed rides
    const filter = { status: 'open' };

    if (q && typeof q === 'string' && q.trim()) {
      const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = { $regex: new RegExp(esc(q.trim()), 'i') };
    }
    if (category && typeof category === 'string' && category.trim()) {
      filter.category = category.trim();
    }

    // fetch rides that match filter
    const rides = await Ride.find(filter).lean();

    // Get waiting+active counts
    const counts = await QueueEntry.aggregate([
      { $match: { status: { $in: ['waiting', 'active'] } } },
      { $group: { _id: '$ride', count: { $sum: 1 } } }
    ]);

    const countsMap = counts.reduce((m, c) => {
      m[String(c._id)] = c.count;
      return m;
    }, {});

    const ridesWithCount = rides.map(r => ({
      id: r._id.toString(),
      name: r.name,
      status: r.status,
      capacity: r.capacity,
      duration: r.duration || null,
      image: r.image || null,
      waitingCount: countsMap[String(r._id)] || 0,
      description: r.description || '',
      category: r.category || ''
    }));

    // sorting
    if (sort === 'name') {
      ridesWithCount.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'congestion') {
      ridesWithCount.sort((a, b) => b.waitingCount - a.waitingCount);
    } else {
      ridesWithCount.sort((a, b) => a.waitingCount - b.waitingCount);
    }

    // pagination
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(200, Math.max(5, parseInt(limit, 10) || ridesWithCount.length));
    const start = (p - 1) * l;
    const pageSlice = ridesWithCount.slice(start, start + l);

    return res.json({
      rides: pageSlice,
      total: ridesWithCount.length,
      page: p,
      limit: l
    });
  } catch (err) {
    console.error('GET /api/rides error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});


/**
 * GET /api/rides/:rideId/visual
 * Public: returns ride info plus batches and waiting list useful for visual queue display
 *
 * Response:
 * {
 *   ride: { id, name, capacity, duration, status, image },
 *   currentBatch: [{ id, position, status, user: { id, name } }, ...],
 *   upcomingBatch: [...], // next capacity from waiting
 *   waiting: [ { id, position, status, user: { id, name }, joinedAt }, ... ] // full waiting list
 * }
 */
router.get('/:rideId/visual', async (req, res) => {
  try {
    const { rideId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(rideId)) {
      return res.status(400).json({ msg: 'Invalid rideId' });
    }

    const ride = await Ride.findById(rideId).lean();
    if (!ride) return res.status(404).json({ msg: 'Ride not found' });

    const capacity = Number(ride.capacity) || 1;

    // current active entries (those currently on the ride)
    const currentEntries = await QueueEntry.find({ ride: rideId, status: 'active' })
      .sort('joinedAt')
      .limit(capacity)
      .populate('user', 'name')
      .lean();

    // waiting entries (full waiting queue)
    const waitingEntries = await QueueEntry.find({ ride: rideId, status: 'waiting' })
      .sort('joinedAt')
      .populate('user', 'name')
      .lean();

    // upcoming batch – first `capacity` from waiting
    const upcomingEntries = waitingEntries.slice(0, capacity);

    // waiting (excluding upcoming batch)
    const remainingWaiting = waitingEntries.slice(capacity);

    // Format helper
    const fmt = (e) => ({
    id: e._id.toString(),
    position: e.position,
    status: e.status,
    joinedAt: e.joinedAt,
    user: e.user ? { id: e.user._id?.toString() || e.user.id || null, name: e.user.name || null } : null
    });

    return res.json({
    ride: {
        id: ride._id.toString(),
        name: ride.name,
        capacity: capacity,
        duration: ride.duration || null,
        status: ride.status,
        image: ride.image || null
    },
    currentBatch: currentEntries.map(fmt),
    upcomingBatch: upcomingEntries.map(fmt),
    waiting: remainingWaiting.map(fmt)  // ✔ FIXED
    });

  } catch (err) {
    console.error('GET /api/rides/:rideId/visual error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
