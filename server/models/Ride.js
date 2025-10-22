// server/models/Ride.js
const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, enum: ['open','closed','maintenance'], default: 'open' },
  capacity: { type: Number, default: 1 }, // batch size (not used yet)
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ride', rideSchema);
