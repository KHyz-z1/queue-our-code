const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');
const RegistrationLog = require('../models/RegistrationLog');



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

    // QR payload to encode for user 
    const qrPayload = { uid: user._id.toString(), vtok: vTok };

    // Issue token (optional limited token — we issue same JWT but queue endpoints must check verified)
    const jwtToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token: jwtToken,
      user: { id: user._id, name: user.name, verified: user.verified },
      qrPayload
    });
  } catch (err) {
     if (err.code === 11000) {
    return res.status(400).json({ msg: "Name already registered." });
    }
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

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
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

    const { uid, vtok, snowAccess } = req.body;
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

    // If staff sent snowAccess (boolean) prefer that; otherwise keep whatever was stored (or default false)
    if (typeof snowAccess !== 'undefined') {
      user.snowAccess = !!snowAccess;
    }

    user.verificationToken = null;
    user.verificationTokenExpires = null;
    user.expiresAt = null;
    await user.save();

    await RegistrationLog.create({
  userId: user._id,
  name: user.name || '',
  createdAt: user.createdAt || new Date(),
  meta: { source: 'public-register' }
});


    res.json({ msg: 'User verified', user: { id: user._id, verified: user.verified, snowAccess: user.snowAccess } });
  } catch (err) {
    console.error('POST /api/auth/verify error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});



// --- safe /api/auth/activate (token re-issue only) ---
/**
 * POST /api/auth/activate
 * Body: { uid: "<userId>" }
 * Behavior:
 *  - If user.verified === true => issue token
 *  - If user.verified === false => return 403 advising staff verification
 */

router.post("/activate", async (req, res) => {
  try {
    let { uid, name } = req.body;

    if (uid && typeof uid === "object") {
      if (uid.$oid) uid = uid.$oid;
      else if (uid._id && uid._id.$oid) uid = uid._id.$oid;
      else if (uid._id) uid = String(uid._id);
      else uid = String(uid);
    }

    if (!uid && !name) {
      return res.status(400).json({ msg: "UID or name required" });
    }

    if (uid && !mongoose.Types.ObjectId.isValid(uid)) {
      return res.status(400).json({ msg: "Invalid uid format" });
    }

    const user = uid ? await User.findById(uid) : await User.findOne({ name });

    if (!user) return res.status(404).json({ msg: "User not found" });
    if (!user.verified) return res.status(403).json({ msg: "User not verified yet" });

    // issue JWT
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    return res.json({
      msg: "Reactivated successfully",
      token,
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("POST /auth/activate error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
});


/**
 * GET /api/auth/me
 * Protected: returns basic user info decoded from JWT
 */
router.get('/me', auth, async (req, res) => {
  try {
    const id = req.user.id;

    // include snowAccess in the selected fields
    const user = await User.findById(id)
      .select('name role verified verificationToken verificationTokenExpires createdAt snowAccess');

    if (!user) return res.status(404).json({ msg: 'User not found' });

    return res.json({ user: {
      id: user._id,
      name: user.name,
      role: user.role,
      verified: user.verified,
      verificationToken: user.verificationToken || null,
      verificationTokenExpires: user.verificationTokenExpires || null,
      createdAt: user.createdAt,
      // now this will reflect the DB value (true/false)
      snowAccess: !!user.snowAccess
    }});
  } catch (err) {
    console.error('GET /api/auth/me error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});





module.exports = router;
