const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  starPassCode: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  role: { type: String, enum: ['guest','staff','admin'], default: 'guest' },
  subscriptionType: { type: String, default: '' }, // e.g., one-day, annual
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
