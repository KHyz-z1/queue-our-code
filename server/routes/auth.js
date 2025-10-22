const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Utility functions (register handler)
const { generateShortToken } = require('../utils/token');

router.post('/register', async (req, res) => {
  const { name } = req.body;
  try {
    // create user as unverified
    const vTok = generateShortToken(8);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const user = new User({ name, verified: false, verificationToken: vTok, verificationTokenExpires: expires });
    await user.save();

    // QR payload to encode for user (frontend will turn this into QR string)
    const qrPayload = { uid: user._id.toString(), vtok: vTok };

    // Issue token (optional limited token — we issue same JWT but queue endpoints must check verified)
    const jwtToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });

    res.json({
      token: jwtToken,
      user: { id: user._id, name: user.name, verified: user.verified },
      qrPayload
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { starPassCode } = req.body;
  if (!starPassCode) return res.status(400).json({ msg: 'StarPass code required' });

  try {
    const user = await User.findOne({ starPassCode });
    if (!user) return res.status(400).json({ msg: 'Invalid StarPass code' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user._id, starPassCode: user.starPassCode, name: user.name, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/auth/verify  (staff-only)
router.post('/verify', require('../middleware/authMiddleware'), async (req, res) => {
  try {
    // ensure staff/admin
    if (!['staff','admin'].includes(req.user.role)) {
      return res.status(403).json({ msg: 'Forbidden: staff only' });
    }

    const { uid, vtok } = req.body;
    if (!uid || !vtok) return res.status(400).json({ msg: 'Missing uid or vtok' });

    const user = await User.findById(uid);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (user.verified) return res.status(400).json({ msg: 'Already verified' });

    if (user.verificationToken !== vtok) return res.status(400).json({ msg: 'Invalid token' });
    if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
      return res.status(400).json({ msg: 'Token expired' });
    }

    user.verified = true;
    user.verifiedAt = new Date();
    user.verifiedBy = req.user.id;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    res.json({ msg: 'User verified', user: { id: user._id, verified: user.verified } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// --- safe /api/auth/activate (token re-issue only) ---
/**
 * POST /api/auth/activate
 * Body: { uid: "<userId>" }
 * Behavior:
 *  - If user.verified === true => issue short-lived token (1h)
 *  - If user.verified === false => return 403 advising staff verification
 */
router.post('/activate', async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ msg: 'uid required' });

    const user = await User.findById(uid);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Only issue tokens if the account is already verified by staff
    if (!user.verified) {
      return res.status(403).json({ msg: 'Account not verified. Please have a staff member verify at the gate.' });
    }

    // Issue a short-lived token for convenience (refresh / lost session)
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token, user: { id: user._id, name: user.name, verified: true } });
  } catch (err) {
    console.error('POST /api/auth/activate error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});



module.exports = router;
