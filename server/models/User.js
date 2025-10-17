// server/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  starPassCode: { type: String, unique: true, sparse: true }, // may be null for public reg
  name: { type: String, default: '' },
  role: { type: String, enum: ['guest','staff','admin'], default: 'guest' },
  subscriptionType: { type: String, default: '' },

  // verification fields (for gate verification flow)
  verified: { type: Boolean, default: false },
  verificationToken: { type: String, default: null },
  verificationTokenExpires: { type: Date, default: null },
  verifiedAt: { type: Date },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
