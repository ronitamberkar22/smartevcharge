// filepath: backend/models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  station: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station',
    required: true
  },
  slot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Slot',
    default: null
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in hours
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  vehicleNumber: {
    type: String,
    trim: true
  },
  vehicleType: {
    type: String,
    enum: ['car', 'bike', 'scooter'],
    default: 'car'
  },
  notes: {
    type: String,
    trim: true
  },
  chargerType: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for querying bookings
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ station: 1, status: 1 });
bookingSchema.index({ startTime: 1, endTime: 1 });

module.exports = mongoose.model('Booking', bookingSchema);