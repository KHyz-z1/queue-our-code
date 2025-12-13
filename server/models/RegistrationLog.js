// server/models/RegistrationLog.js
const mongoose = require('mongoose');

const registrationLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, 
  meta: { type: Object, default: {} } 
});

module.exports = mongoose.model('RegistrationLog', registrationLogSchema);
