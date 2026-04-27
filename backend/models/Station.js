// filepath: backend/models/Station.js
const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  cityArea: {
    type: String,
    trim: true
  },
  operator: {
    type: String,
    trim: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  totalSlots: {
    type: Number,
    required: true,
    min: 1
  },
  availableSlots: {
    type: Number,
    default: function() { return this.totalSlots; }
  },
  pricePerHour: {
    type: Number,
    required: true,
    min: 0
  },
  priceAC: { type: Number, default: 8 },
  priceDC: { type: Number, default: 12 },
  priceSuperFast: { type: Number, default: 18 },
  openingHours: { type: String, default: 'Open 24/7' },
  chargingSpeed: {
    type: String,
    enum: ['slow', 'fast', 'super-fast'],
    default: 'fast'
  },
  connectorTypes: [{
    type: String,
    enum: ['Type1', 'Type2', 'CCS', 'CHAdeMO', 'Tesla']
  }],
  amenities: [{
    type: String,
    enum: ['wifi', 'parking', 'cafe', 'restroom', 'shopping']
  }],
  status: {
    type: String,
    enum: ['active', 'maintenance', 'offline'],
    default: 'active'
  },
  images: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update available slots before save
stationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Station', stationSchema);