// filepath: backend/models/Slot.js
const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  station: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station',
    required: true
  },
  slotNumber: {
    type: Number,
    required: true
  },
  connectorType: {
    type: String,
    enum: ['Type1', 'Type2', 'CCS', 'CHAdeMO', 'Tesla'],
    required: true
  },
  maxPower: {
    type: Number, // in kW
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance', 'reserved'],
    default: 'available'
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for unique slot per station
slotSchema.index({ station: 1, slotNumber: 1 }, { unique: true });

module.exports = mongoose.model('Slot', slotSchema);