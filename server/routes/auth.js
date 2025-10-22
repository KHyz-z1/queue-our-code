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


router.post('/activate', async (req, res) => {
  try {
    const { uid, vtok } = req.body;
    if (!uid) return res.status(400).json({ msg: 'uid required' });

    const user = await User.findById(uid);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // If not verified -> require vtok and validate
    if (!user.verified) {
      if (!vtok) return res.status(400).json({ msg: 'vtok required for activation' });
      if (user.verificationToken !== vtok) return res.status(400).json({ msg: 'Invalid verification token' });
      if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
        return res.status(400).json({ msg: 'Verification token expired' });
      }

      // Mark user verified and clear token fields
      user.verified = true;
      user.verificationToken = null;
      user.verificationTokenExpires = null;
      user.verifiedAt = new Date();
      await user.save();

      // Issue normal JWT (longer-ish lifetime if you like)
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
      return res.json({ token, user: { id: user._id, name: user.name, verified: user.verified } });
    }

    // If already verified -> issue a short-lived token (safer)
    const shortToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token: shortToken, user: { id: user._id, name: user.name, verified: user.verified } });
  } catch (err) {
    console.error('POST /api/auth/activate error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});


module.exports = router;
