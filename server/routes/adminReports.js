const express = require('express');
const router = express.Router();
const QueueEntry = require('../models/QueueEntry');
const Ride = require('../models/Ride');
const User = require('../models/User');
const Report = require('../models/Report'); // Assuming you renamed your Report model to SavedReport, but keeping the original name based on the POST route logic
const SavedReport = require('../models/Report'); // Use this if you have a separate model for saved reports, otherwise, just use Report
const mongoose = require('mongoose');
const auth = require('../middleware/authMiddleware'); 
// Ensure your requireAdmin middleware is defined or imported correctly
// If you are using an imported requireAdmin, use that. Otherwise, keep the local definition.
const requireAdmin = async (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ msg: 'Forbidden: admin only' });
  next();
};


function parseDate(s) {
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

// Helper: compute start/end from preset
function presetRange(preset, dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  // normalize to local midnight (start)
  const start = new Date(d);
  start.setHours(0,0,0,0);

  if (preset === 'day') {
    const end = new Date(start);
    end.setHours(23,59,59,999);
    return { start, end, scope: 'day' };
  }

  if (preset === 'week') {
    // assume week starts Monday (adjust if you prefer Sunday)
    const day = start.getDay(); // 0 Sun .. 6 Sat
    const diffToMon = (day + 6) % 7; // 0->6 => Monday offset
    const monday = new Date(start);
    monday.setDate(start.getDate() - diffToMon);
    monday.setHours(0,0,0,0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);
    return { start: monday, end: sunday, scope: 'week' };
  }

  if (preset === 'month') {
    const first = new Date(start.getFullYear(), start.getMonth(), 1);
    const last = new Date(start.getFullYear(), start.getMonth()+1, 0);
    last.setHours(23,59,59,999);
    return { start: first, end: last, scope: 'month' };
  }

  return null;
}

// --- Report Generation Route ---

/**
 * GET /api/admin/reports
 * Generates an on-demand report based on query parameters.
 */
router.get('/', auth, requireAdmin, async (req, res) => {
  try {
    const { start: startQ, end: endQ, preset, date } = req.query;
    let start, end, scope = 'range';

    if (preset) {
      const p = presetRange(preset, date);
      if (!p) return res.status(400).json({ msg: 'Invalid preset' });
      ({ start, end, scope } = p);
    } else if (startQ && endQ) {
      start = parseDate(startQ);
      end = parseDate(endQ);
      if (!start || !end) return res.status(400).json({ msg: 'Invalid start/end' });
      // normalize
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
      scope = 'range';
    } else {
      // default: today
      const p = presetRange('day', date);
      ({ start, end, scope } = p);
    }

    // compute guests registered in range
    const guestsToday = await User.countDocuments({ createdAt: { $gte: start, $lte: end } });

    // Aggregation per ride
    const perRideAgg = await QueueEntry.aggregate([
      { $match: { joinedAt: { $gte: start, $lte: end } } }, // entries created in range
      {
        $group: {
          _id: '$ride',
          completed_count: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelled_total: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          cancelled_by_staff: { $sum: { $cond: [{ $eq: ['$cancelledByRole', 'staff'] }, 1, 0] } },
          cancelled_by_guest: { $sum: { $cond: [{ $eq: ['$cancelledByRole', 'guest'] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'rides',
          localField: '_id',
          foreignField: '_id',
          as: 'ride'
        }
      },
      { $unwind: { path: '$ride', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          rideId: { $toString: '$_id' },
          rideName: '$ride.name',
          completed_count: 1,
          cancelled_total: 1,
          cancelled_by_staff: 1,
          cancelled_by_guest: 1
        }
      }
    ]);

    // totals
    const totals = perRideAgg.reduce((acc, r) => {
      acc.completed += r.completed_count || 0;
      acc.cancelled_total += r.cancelled_total || 0;
      acc.cancelled_by_staff += r.cancelled_by_staff || 0;
      acc.cancelled_by_guest += r.cancelled_by_guest || 0;
      return acc;
    }, { completed: 0, cancelled_total: 0, cancelled_by_staff: 0, cancelled_by_guest: 0 });

    return res.json({
      guestsToday,
      perRide: perRideAgg,
      totals,
      range: { start: start.toISOString(), end: end.toISOString(), scope }
    });
  } catch (err) {
    console.error('GET /api/admin/reports error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// --- Report Saving Route ---

/**
 * POST /api/admin/reports/save
 * Stores a copy of the report for later retrieval/export.
 */
router.post('/save', auth, requireAdmin, async (req, res) => {
  try {
    const { title = '', start, end, scope = 'range', payload } = req.body;
    if (!start || !end || !payload) return res.status(400).json({ msg: 'start,end,payload required' });

    // Using Report model as provided in your initial code
    const rep = new Report({
      title,
      start: new Date(start),
      end: new Date(end),
      scope,
      generatedBy: req.user.id,
      payload,
      archived: false // Explicitly set to not archived upon creation
    });
    await rep.save();
    return res.status(201).json({ msg: 'Saved', reportId: rep._id });
  } catch (err) {
    console.error('POST /api/admin/reports/save error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// --- Saved Report Management Routes (UPDATED) ---

/**
 * GET /api/admin/reports/saved
 * Lists saved (non-archived) reports.
 */
router.get('/saved', auth, requireAdmin, async (req, res) => {
  try {
    // Find only reports that are NOT archived
    const list = await Report.find({ archived: { $ne: true } }).sort({ generatedAt: -1 }).limit(100).lean();
    
    // Clean up response data structure
    const out = list.map(r => ({
      id: r._id.toString(),
      title: r.title,
      start: r.start,
      end: r.end,
      scope: r.scope,
      generatedAt: r.generatedAt,
      generatedBy: r.generatedBy
    }));
    return res.json({ reports: out });
  } catch (err) {
    console.error('GET /api/admin/reports/saved error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * GET /api/admin/reports/saved/:id
 * Return a single saved report (including payload).
 */
router.get('/saved/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ msg: 'Invalid id' });
    const r = await Report.findById(id).lean();
    if (!r) return res.status(404).json({ msg: 'Saved report not found' });
    return res.json({ report: r });
  } catch (err) {
    console.error('GET /api/admin/reports/saved/:id error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * DELETE /api/admin/reports/saved/:id
 * Archive (soft-delete) a saved report by setting 'archived' to true.
 */
router.delete('/saved/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ msg: 'Invalid id' });
    
    // Find and update the document to set archived: true
    const s = await Report.findById(id);
    if (!s) return res.status(404).json({ msg: 'Saved report not found' });
    
    s.archived = true;
    await s.save();
    
    return res.json({ msg: 'Report archived' });
  } catch (err) {
    console.error('DELETE /api/admin/reports/saved/:id error', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;