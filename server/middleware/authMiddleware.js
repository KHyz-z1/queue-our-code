// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// Purpose: verify incoming requests carry a valid JWT and expose the decoded payload on req.user
module.exports = function (req, res, next) {
  // 1) Read authorization header
  const authHeader = req.header('Authorization') || req.header('authorization');
  if (!authHeader) return res.status(401).json({ msg: 'No token, authorization denied' });

  // Expect header format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ msg: 'Invalid authorization format' });
  }

  const token = parts[1];

  try {
    // 2) Verify token using the same secret in .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 3) Attach decoded payload (e.g., { id, role, iat, exp }) to req.user
    req.user = decoded;
    next(); // allow request to proceed
  } catch (err) {
    console.error('JWT verify error:', err.message);
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};
