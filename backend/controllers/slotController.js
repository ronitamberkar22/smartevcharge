// filepath: backend/controllers/slotController.js
const Slot = require('../models/Slot');
const Station = require('../models/Station');
const Booking = require('../models/Booking');

// Get available slots for a station on a specific date
exports.getAvailableSlots = async (req, res) => {
  try {
    const { stationId, date, startTime, endTime } = req.query;

    if (!stationId) {
      return res.status(400).json({ message: 'stationId is required.' });
    }

    // Build date range for the query date (or today if not provided)
    const queryDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find all bookings for this station on this date that are not cancelled
    const bookedBookings = await Booking.find({
      station: stationId,
      status: { $in: ['pending', 'confirmed', 'in-progress', 'completed'] },
      startTime: { $gte: startOfDay, $lte: endOfDay }
    }).select('startTime endTime');

    // Extract booked start times in HH:MM format
    const bookedSlots = bookedBookings.map(b => {
      const t = new Date(b.startTime);
      return `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`;
    });

    // If time range provided (legacy support), also filter by availability
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);

      const conflictBookings = await Booking.find({
        station: stationId,
        status: { $in: ['pending', 'confirmed', 'in-progress'] },
        $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }]
      }).select('slot');

      const bookedSlotIds = conflictBookings.map(b => b.slot?.toString());
      const slots = await Slot.find({ station: stationId, isAvailable: true, status: 'available' });
      const availableSlots = slots.filter(s => !bookedSlotIds.includes(s._id.toString()));

      return res.json({ slots: availableSlots, bookedSlots });
    }

    res.json({ bookedSlots, slots: [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Get slot recommendation using greedy algorithm
exports.getSlotRecommendation = async (req, res) => {
  try {
    const { stationId, startTime, endTime, vehicleType } = req.query;
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = (end - start) / (1000 * 60 * 60); // hours
    
    // Get all slots for the station
    const slots = await Slot.find({ station: stationId, isAvailable: true });
    const station = await Station.findById(stationId);
    
    if (!slots.length) {
      return res.status(404).json({ message: 'No slots available at this station.' });
    }
    
    // Find booked slots for the time range
    const bookedSlots = await Booking.find({
      station: stationId,
      status: { $in: ['pending', 'confirmed', 'in-progress'] },
      $or: [
        { startTime: { $lt: end }, endTime: { $gt: start } }
      ]
    }).select('slot');
    
    const bookedSlotIds = bookedSlots.map(b => b.slot.toString());
    
    // Filter available slots
    const availableSlots = slots.filter(s => !bookedSlotIds.includes(s._id.toString()));
    
    if (!availableSlots.length) {
      return res.status(404).json({ message: 'No slots available for the selected time.' });
    }
    
    // GREEDY ALGORITHM for slot recommendation
    // Priority factors (in order of importance):
    // 1. Charging speed match (faster is better for short duration)
    // 2. Power efficiency (higher power / price ratio)
    // 3. Connector type compatibility
    
    const recommendations = availableSlots.map(slot => {
      let score = 0;
      
      // Factor 1: Charging speed score
      // For short durations, faster charging is more valuable
      const speedScore = {
        'super-fast': 100,
        'fast': 60,
        'slow': 30
      };
      
      // Adjust based on duration - for short bookings, prioritize fast charging
      if (duration <= 1) {
        score += speedScore[station.chargingSpeed] || 50;
      } else if (duration <= 3) {
        score += (speedScore[station.chargingSpeed] || 50) * 0.8;
      } else {
        score += (speedScore[station.chargingSpeed] || 50) * 0.6;
      }
      
      // Factor 2: Power efficiency (kW per dollar)
      const powerEfficiency = slot.maxPower / station.pricePerHour;
      score += Math.min(powerEfficiency * 2, 40); // Cap at 40 points
      
      // Factor 3: Connector type bonus
      const preferredConnectors = ['CCS', 'Tesla', 'Type2'];
      if (preferredConnectors.includes(slot.connectorType)) {
        score += 20;
      }
      
      // Factor 4: Slot number preference (lower numbers often have better positions)
      if (slot.slotNumber <= 3) score += 10;
      else if (slot.slotNumber <= 5) score += 5;
      
      return { slot, score };
    });
    
    // Sort by score (greedy selection - pick highest score)
    recommendations.sort((a, b) => b.score - a.score);
    
    // Get top 3 recommendations
    const topRecommendations = recommendations.slice(0, 3).map(r => ({
      ...r.slot.toObject(),
      recommendationScore: r.score,
      estimatedCost: Math.round(duration * station.pricePerHour * 100) / 100,
      chargingSpeed: station.chargingSpeed
    }));
    
    res.json({ 
      recommendations: topRecommendations,
      algorithm: 'greedy',
      factors: ['charging_speed', 'power_efficiency', 'connector_compatibility', 'slot_position']
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Get slots by station (admin)
exports.getSlotsByStation = async (req, res) => {
  try {
    const slots = await Slot.find({ station: req.params.stationId })
      .populate('station', 'name');
    
    res.json({ slots });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Update slot status (admin)
exports.updateSlotStatus = async (req, res) => {
  try {
    const { status, isAvailable } = req.body;
    
    const slot = await Slot.findByIdAndUpdate(
      req.params.id,
      { status, isAvailable },
      { new: true }
    );
    
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found.' });
    }
    
    res.json({ message: 'Slot updated.', slot });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Get slot availability for date range (for calendar view)
exports.getSlotAvailability = async (req, res) => {
  try {
    const { stationId, startDate, endDate } = req.query;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Get all bookings for the station in the date range
    const bookings = await Booking.find({
      station: stationId,
      status: { $in: ['pending', 'confirmed', 'in-progress'] },
      startTime: { $gte: start },
      endTime: { $lte: end }
    }).populate('slot', 'slotNumber');
    
    // Get all slots
    const slots = await Slot.find({ station: stationId });
    
    // Create availability map
    const availability = slots.map(slot => {
      const slotBookings = bookings.filter(b => b.slot.toString() === slot._id.toString());
      return {
        slotId: slot._id,
        slotNumber: slot.slotNumber,
        connectorType: slot.connectorType,
        maxPower: slot.maxPower,
        status: slot.status,
        bookings: slotBookings.map(b => ({
          id: b._id,
          startTime: b.startTime,
          endTime: b.endTime,
          status: b.status
        }))
      };
    });
    
    res.json({ availability });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};