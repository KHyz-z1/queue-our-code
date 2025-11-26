const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  scope: { type: String, enum: ['day','week','month','range'], default: 'day' },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  generatedAt: { type: Date, default: Date.now },
    archived: { type: Boolean, default: false },
  payload: { type: mongoose.Schema.Types.Mixed } // store the aggregated JSON
});

module.exports = mongoose.model('Report', reportSchema);
