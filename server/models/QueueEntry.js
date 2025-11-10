// server/models/QueueEntry.js
const mongoose = require('mongoose');

const queueEntrySchema = new mongoose.Schema({
  ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['waiting','active','completed','cancelled'], default: 'waiting' },
  position: { type: Number }, // cached position in queue (optional)
  joinedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },
  startedAt: { type: Date, default: null },
  endedAt: { type: Date, default: null },

  // Audit fields for staff removals
  removedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  removedAt: { type: Date, default: null },

  // Estimated timing fields (computed on join / recompute)
  etaMinutes: { type: Number, default: null }, // estimated minutes until their batch starts
  estimatedReturnAt: { type: Date, default: null } // absolute timestamp guests should return
});

// ensure a user cannot have more than one active/waiting entry per ride
queueEntrySchema.index(
  { ride: 1, user: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['waiting', 'active'] } } }
);

queueEntrySchema.pre('save', function(next){
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('QueueEntry', queueEntrySchema);
