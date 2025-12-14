const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');
const { sendAdminEmail } = require('../utils/mailer');


router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    const admin = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
      role: 'admin'
    });

    if (!admin) {
      return res.status(400).json({ msg: 'Invalid or expired token' });
    }

    admin.emailVerified = true;
    admin.emailVerificationToken = null;
    admin.emailVerificationExpires = null;
    await admin.save();

    res.json({ msg: 'Admin email verified successfully' });
  } catch (err) {
    console.error('VERIFY EMAIL ERROR:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * Admin guard middleware
 */
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Admin access only' });
  }
  next();
}

router.get('/profile', auth, requireAdmin, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id).select(
      'name starPassCode email emailVerified'
    );
    res.json({ admin });
  } catch (err) {
    console.error('GET PROFILE ERROR:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});


router.put('/profile', auth, requireAdmin, async (req, res) => {
  try {
    const { name, email, starPassCode} = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ msg: 'Admin not found' });

    let emailChanged = false;

    if (name) user.name = name;

    if (starPassCode && starPassCode !== user.starPassCode) {
      user.starPassCode = starPassCode;
    }

    if (email && email !== user.email) {
      user.email = email;
      user.emailVerified = false;
      user.emailVerificationToken = crypto.randomBytes(32).toString('hex');
      user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
      emailChanged = true;
    }

    await user.save();

    if (emailChanged) {
      await sendAdminEmail({
        to: user.email,
        subject: "Verify your Star City Admin Email",
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h3>Email Verification</h3>
            <p>You have updated your admin email. Please click the link below to verify it:</p>
            <a href="${process.env.CLIENT_URL}/admin/verify-email?token=${user.emailVerificationToken}" 
               style="background: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">
               Verify Email
            </a>
            <p style="margin-top: 20px; font-size: 0.8em; color: #666;">
              This link will expire in 24 hours.
            </p>
          </div>
        `
      });

      return res.json({
        msg: 'Profile updated. A verification link has been sent to your new email.'
      });
    }

    res.json({ msg: 'Profile updated successfully.' });

  } catch (err) {
    console.error('ADMIN PROFILE ERROR:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;