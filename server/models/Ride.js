// server/models/Ride.js
const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' }, // short paragraph/description
  category: { type: String, enum: ['Easy','Moderate','Extreme'], default: 'Moderate' },
  status: { type: String, enum: ['open','closed','maintenance'], default: 'open' },
  capacity: { type: Number, default: 1 }, // batch size (number of seats per cycle)
  duration: { type: Number, default: 5 },  // duration of one ride batch in minutes
  image: { type: String, default: null },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ride', rideSchema);
