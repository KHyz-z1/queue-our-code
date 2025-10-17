// server/routes/protected.js
const express = require('express');
const auth = require('../middleware/authMiddleware');
const router = express.Router();

// GET /api/protected/me
// Protected route example: returns the decoded user info from the token
router.get('/me', auth, async (req, res) => {
  // req.user was set by authMiddleware
  return res.json({ msg: 'Protected route accessed', user: req.user });
});

module.exports = router;
