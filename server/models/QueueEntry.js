// server/models/QueueEntry.js
const mongoose = require('mongoose');

const queueEntrySchema = new mongoose.Schema({
  ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['waiting','active','completed','cancelled'], default: 'waiting' },
  position: { type: Number }, // cached position in queue (optional)
  joinedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

queueEntrySchema.index({ ride: 1, user: 1 }, { unique: true }); // prevents same user joining same ride twice

queueEntrySchema.pre('save', function(next){
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('QueueEntry', queueEntrySchema);
