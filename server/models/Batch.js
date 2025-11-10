// server/models/Batch.js
const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({
  ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
  capacity: { type: Number, required: true },
  status: { type: String, enum: ['active','completed','cancelled'], default: 'active' },
  startedAt: { type: Date, default: Date.now },
  expectedEndAt: { type: Date, default: null },
  endedAt: { type: Date, default: null },
  startedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  endedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Batch', BatchSchema);
