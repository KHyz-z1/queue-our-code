// server/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  starPassCode: { type: String, unique: true, sparse: true }, // may be null for public reg
  name: { type: String, default: '', unique: true, trim: true },
  role: { type: String, enum: ['guest','staff','admin'], default: 'guest' },
  subscriptionType: { type: String, default: '' },

  email: {
  type: String,
  lowercase: true,
  trim: true,
  sparse: true
},

emailVerified: {
  type: Boolean,
  default: false
},

emailVerificationToken: {
  type: String,
  default: null
},

emailVerificationExpires: {
  type: Date,
  default: null
},

  // verification fields (for gate verification flow)
  verified: { type: Boolean, default: false },
  verificationToken: { type: String, default: null },
  verificationTokenExpires: { type: Date, default: null },
  verifiedAt: { type: Date },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  snowAccess: { type: Boolean, default: false },


  createdAt: { type: Date, default: Date.now },
  expiresAt: {
  type: Date,
  default: function () {
    return this.role === 'guest'
      ? new Date(Date.now() + 10 * 60 * 1000) // guests
      : null; // admin & staff never expire
  },
  index: { expires: 0 }
},


// Admin email verification fields

starpassResetToken: String,
starpassResetExpires: Date,


});

module.exports = mongoose.model('User', userSchema);
