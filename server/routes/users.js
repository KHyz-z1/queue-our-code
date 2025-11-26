// server/routes/users.js
const express = require('express');
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');

const router = express.Router();

/**
 * GET /api/users/:id/stub
 * Protected route — staff/admin only.
 * Returns a minimal "stub" payload the frontend can use to print a ticket.
 */
router.get('/:id/stub', auth, async (req, res) => {
  try {
    // Only staff or admin allowed
    if (!['staff', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ msg: 'Forbidden: staff only' });
    }

    const u = await User.findById(req.params.id).lean();
    if (!u) return res.status(404).json({ msg: 'User not found' });

    // Compose stub payload. If the user has been verified, vtok will be null.
    const stub = {
      id: u._id.toString(),
      name: u.name || 'Guest',
      verified: !!u.verified,
      // Provide the QR payload representing the current activation token (if any).
      // Frontend can JSON.stringify() this and render as QR
      qrPayload: u.verificationToken ? { uid: u._id.toString(), vtok: u.verificationToken } : { uid: u._id.toString() }
    };

    // You may include other fields later: createdAt, subscriptionType, etc.
    return res.json({ stub });
  } catch (err) {
    console.error('GET /api/users/:id/stub error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
