// filepath: backend/controllers/stationController.js
const Station = require('../models/Station');
const Slot = require('../models/Slot');

// Get all stations (public)
exports.getAllStations = async (req, res) => {
  try {
    const { status, search, lat, lng, radius } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    } else {
      query.status = 'active';
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    const stations = await Station.find(query).sort({ createdAt: -1 });
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