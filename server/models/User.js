// server/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  starPassCode: { type: String, unique: true, sparse: true }, // may be null for public reg
  name: { type: String, default: '', unique: true, trim: true },
  role: { type: String, enum: ['guest','staff','admin'], default: 'guest' },
  subscriptionType: { type: String, default: '' },

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
  default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from creation
  index: { expires: 0 }, // TTL index: delete after this time
},

});

module.exports = mongoose.model('User', userSchema);
