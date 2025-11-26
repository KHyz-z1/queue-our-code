// server/routes/print.js
const express = require('express');
const auth = require('../middleware/authMiddleware');
const QueueEntry = require('../models/QueueEntry');
const Ride = require('../models/Ride');
const User = require('../models/User');

const router = express.Router();

/**
 * GET /api/print/stub/:entryId?format=html
 * Protected: staff or admin only
 * Returns an HTML page suitable for printing (window.print()).
 */
router.get('/stub/:entryId', auth, async (req, res) => {
  try {
    const callerRole = req.user.role;
    if (!['staff','admin'].includes(callerRole)) {
      return res.status(403).send('Forbidden: staff only');
    }

    const { entryId } = req.params;
    const format = (req.query.format || 'html').toLowerCase();

    const entry = await QueueEntry.findById(entryId).populate('ride').populate('user','name');
    if (!entry) return res.status(404).json({ msg: 'Queue entry not found' });

    // compute ETA
    const ride = entry.ride;
    const durationSec = ride && ride.estimatedDurationSeconds ? ride.estimatedDurationSeconds : 300; // default 5 min
    const capacity = ride && ride.capacity ? ride.capacity : 1;
    // capacity-aware ETA: number ng batches before ma-reach current position
    const batches = Math.ceil(entry.position / capacity);
    const etaMs = Date.now() + batches * durationSec * 1000;
    const eta = new Date(etaMs);

    // qr payload (same logic as mobile)
    const qrPayload = entry.user && entry.user._id ? { uid: String(entry.user._id) } : { uid: '' };

    const stub = {
      guestName: entry.user && entry.user.name ? entry.user.name : 'Guest',
      guestId: String(entry.user._id),
      rideName: ride ? ride.name : 'Unknown Ride',
      position: entry.position,
      eta: eta.toISOString(),
      etaDisplay: eta.toLocaleString(), // for printing
      qrPayload
    };

    if (format === 'json') {
      return res.json({ stub });
    }

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Queue Stub</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 6px; }
          .ticket { width: 280px; border: 1px dashed #333; padding: 8px; }
          .title { font-size: 14px; font-weight: bold; margin-bottom: 6px; text-align:center; }
          .line { display:flex; justify-content:space-between; margin:4px 0; }
          .qr { text-align:center; margin-top:8px; }
          .small { font-size:12px; color:#333; }
        </style>
      </head>
      <body onload="window.print();">
        <div class="ticket">
          <div class="title">Star Parks - Queue Stub</div>
          <div class="line"><div class="small">Guest:</div><div>${stub.guestName}</div></div>
          <div class="line"><div class="small">Guest ID:</div><div>${stub.guestId}</div></div>
          <div class="line"><div class="small">Ride:</div><div>${stub.rideName}</div></div>
          <div class="line"><div class="small">Position:</div><div>${stub.position}</div></div>
          <div class="line"><div class="small">Estimated Return:</div><div>${stub.etaDisplay}</div></div>
          <div class="qr">
            <!-- We render a simple QR using a data URI via Google Chart as fallback -->
            <img src="https://chart.googleapis.com/chart?cht=qr&chs=150x150&chl=${encodeURIComponent(JSON.stringify(stub.qrPayload))}" alt="qr"/>
          </div>
          <div style="text-align:center; font-size:11px; margin-top:6px;">Show this ticket to staff at ride entrance</div>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);

  } catch (err) {
    console.error('GET /api/print/stub/:entryId error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// For registration stub printing
router.get('/registration/:userId', auth, async (req, res) => {
  try {
    const callerRole = req.user.role;
    if (!['staff','admin'].includes(callerRole)) {
      return res.status(403).send('Forbidden: staff only');
    }

    const { userId } = req.params;
    const format = (req.query.format || 'html').toLowerCase();

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Include snowAccess always
    const qrPayload = {
      uid: String(user._id),
      vtok: user.verificationToken || null,
      snowAccess: !!user.snowAccess
    };

    const stub = {
      guestName: user.name || 'Guest',
      guestId: String(user._id),
      qrPayload,
      createdAt: user.createdAt,
      snowAccess: user.snowAccess === true
    };

    if (format === 'json') return res.json({ stub });

    const html = `
      <!doctype html>
      <html>
      <head><meta charset="utf-8"><title>Registration Stub</title>
        <style>
          body { font-family: Arial; margin: 6px; }
          .ticket { width: 280px; border: 1px dashed #333; padding: 8px; }
          .title { font-weight: 700; text-align: center; margin-bottom: 8px; }
          .line { display: flex; justify-content: space-between; margin: 4px 0; }
          .qr { text-align: center; margin-top: 8px; }
          .small { font-size: 12px; color: #333; }
        </style>
      </head>
      <body onload="window.print()">
        <div class="ticket">
          <div class="title">Star Parks — Registration QR</div>

          <div class="line"><div class="small">Guest:</div><div>${stub.guestName}</div></div>
          <div class="line"><div class="small">Guest ID:</div><div>${stub.guestId}</div></div>

          <div class="line">
            <div class="small">Snow World Access:</div>
            <div style="font-weight:700;">${stub.snowAccess ? 'YES' : 'NO'}</div>
          </div>

          <div class="qr">
            <img src="https://chart.googleapis.com/chart?cht=qr&chs=180x180&chl=${encodeURIComponent(JSON.stringify(stub.qrPayload))}" alt="qr"/>
          </div>

          <div style="text-align:center;font-size:11px;margin-top:6px">
            Please fshow this QR to staff to be verified at gate
          </div>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);

  } catch (err) {
    console.error('GET /api/print/registration/:userId error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});



module.exports = router;
