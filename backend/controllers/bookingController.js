// filepath: backend/controllers/bookingController.js
const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const Station = require('../models/Station');
const Payment = require('../models/Payment');

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const { stationId, slotId, startTime, endTime, vehicleNumber, vehicleType, notes } = req.body;
    
    // Validate slot availability
    const slot = await Slot.findById(slotId);
    if (!slot || slot.status !== 'available') {
      return res.status(400).json({ message: 'Slot is not available.' });
    }

    // Check time conflicts
    const conflictingBooking = await Booking.findOne({
      slot: slotId,
      status: { $in: ['pending', 'confirmed', 'in-progress'] },
      $or: [
        { startTime: { $lt: new Date(endTime) }, endTime: { $gt: new Date(startTime) } }
      ]
    });

    if (conflictingBooking) {
      return res.status(400).json({ message: 'Slot is already booked for this time.' });
    }

    // Calculate duration and amount
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = (end - start) / (1000 * 60 * 60); // hours
    
    const station = await Station.findById(stationId);
    const totalAmount = duration * station.pricePerHour;

    // Create booking
    const booking = new Booking({
      user: req.user._id,
      station: stationId,
      slot: slotId,
      startTime: start,
      endTime: end,
      duration: duration.toFixed(2),
      totalAmount: Math.round(totalAmount * 100) / 100,
      vehicleNumber,
      vehicleType,
      notes,
      status: 'pending'
    });

    await booking.save();

    // Update slot status
    slot.status = 'reserved';
    slot.isAvailable = false;
    await slot.save();

    // Update station available slots
    station.availableSlots = Math.max(0, station.availableSlots - 1);
    await station.save();

    res.status(201).json({ message: 'Booking created.', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Get user's bookings
exports.getMyBookings = async (req, res) => {
  try {
    const { status } = req.query;
    let query = { user: req.user._id };
    
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('station', 'name address pricePerHour')
      .populate('slot', 'slotNumber connectorType')
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Get single booking
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('station')
      .populate('slot')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Check ownership (user or admin)
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json({ booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Check ownership
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Check if can be cancelled
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ message: 'Booking cannot be cancelled.' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Release slot
    const slot = await Slot.findById(booking.slot);
    if (slot) {
      slot.status = 'available';
      slot.isAvailable = true;
      await slot.save();
    }

    // Update station available slots
    const station = await Station.findById(booking.station);
    if (station) {
      station.availableSlots += 1;
      await station.save();
    }

    res.json({ message: 'Booking cancelled.', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Start charging (admin or user at station)
exports.startCharging = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'Booking must be confirmed to start charging.' });
    }

    booking.status = 'in-progress';
    await booking.save();

    // Update slot status
    const slot = await Slot.findById(booking.slot);
    if (slot) {
      slot.status = 'occupied';
      await slot.save();
    }

    res.json({ message: 'Charging started.', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Complete charging (admin)
exports.completeCharging = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (booking.status !== 'in-progress') {
      return res.status(400).json({ message: 'Booking is not in progress.' });
    }

    booking.status = 'completed';
    await booking.save();

    // Release slot
    const slot = await Slot.findById(booking.slot);
    if (slot) {
      slot.status = 'available';
      slot.isAvailable = true;
      await slot.save();
    }

    res.json({ message: 'Charging completed.', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Get all bookings (admin)
exports.getAllBookings = async (req, res) => {
  try {
    const { status, stationId, date } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (stationId) query.station = stationId;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate('station', 'name address')
      .populate('slot', 'slotNumber')
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Confirm booking (admin)
exports.confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    booking.status = 'confirmed';
    await booking.save();

    res.json({ message: 'Booking confirmed.', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};