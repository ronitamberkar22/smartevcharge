// filepath: backend/controllers/stationController.js
const Station = require('../models/Station');
const Slot = require('../models/Slot');

// Get all stations (public)
exports.getAllStations = async (req, res) => {
  try {
    const stations = await Station.find({}).sort({ createdAt: -1 });
    console.log(`[API] Returning ${stations.length} stations`);
    res.json({ stations });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Get single station
exports.getStation = async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) {
      return res.status(404).json({ message: 'Station not found.' });
    }
    
    // Get slots for this station
    const slots = await Slot.find({ station: station._id });
    
    res.json({ station, slots });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Create station (admin only)
exports.createStation = async (req, res) => {
  try {
    const station = new Station(req.body);
    await station.save();

    // Create slots for the station
    const slots = [];
    for (let i = 1; i <= station.totalSlots; i++) {
      slots.push({
        station: station._id,
        slotNumber: i,
        connectorType: req.body.connectorTypes ? req.body.connectorTypes[0] : 'Type2',
        maxPower: req.body.chargingSpeed === 'super-fast' ? 150 : req.body.chargingSpeed === 'fast' ? 50 : 22
      });
    }
    await Slot.insertMany(slots);

    res.status(201).json({ message: 'Station created.', station });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Update station (admin only)
exports.updateStation = async (req, res) => {
  try {
    const station = await Station.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!station) {
      return res.status(404).json({ message: 'Station not found.' });
    }

    res.json({ message: 'Station updated.', station });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Delete station (admin only)
exports.deleteStation = async (req, res) => {
  try {
    const station = await Station.findByIdAndDelete(req.params.id);
    if (!station) {
      return res.status(404).json({ message: 'Station not found.' });
    }

    // Delete associated slots
    await Slot.deleteMany({ station: req.params.id });

    res.json({ message: 'Station deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Get nearby stations
exports.getNearbyStations = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query; // radius in km
    
    // Simple distance calculation (for production, use geospatial queries)
    const stations = await Station.find({ status: 'active' });
    
    const nearbyStations = stations.filter(station => {
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        station.latitude,
        station.longitude
      );
      station.distance = distance.toFixed(2);
      return distance <= parseFloat(radius);
    }).sort((a, b) => a.distance - b.distance);

    res.json({ stations: nearbyStations });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Helper: Calculate distance between two points
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI/180);
}

// Find or create station (for OSM/OCM live stations booked by users)
exports.findOrCreateStation = async (req, res) => {
  try {
    const { name, address, latitude, longitude, pricePerHour, chargingSpeed, connectorTypes, source } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Station name is required.' });
    }

    // Try to find by name first (case-insensitive)
    let station = await Station.findOne({ name: { $regex: new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } });

    if (station) {
      return res.json({ station, created: false });
    }

    // Create new station from live data
    station = new Station({
      name: name.trim(),
      address: address || 'Live Station',
      latitude: latitude || 0,
      longitude: longitude || 0,
      totalSlots: 10,
      availableSlots: 10,
      pricePerHour: pricePerHour || 8,
      chargingSpeed: chargingSpeed || 'fast',
      connectorTypes: connectorTypes || ['CCS', 'Type2'],
      status: 'active'
    });

    await station.save();
    res.status(201).json({ station, created: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};