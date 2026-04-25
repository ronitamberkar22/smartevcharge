// filepath: backend/routes/stations.js
const express = require('express');
const router = express.Router();
const stationController = require('../controllers/stationController');
const { auth, adminAuth } = require('../middleware/auth');

// Public routes
router.get('/', stationController.getAllStations);
router.get('/nearby', stationController.getNearbyStations);
router.post('/find-or-create', auth, stationController.findOrCreateStation);
router.get('/:id', stationController.getStation);

// Admin routes
router.post('/', adminAuth, stationController.createStation);
router.put('/:id', adminAuth, stationController.updateStation);
router.delete('/:id', adminAuth, stationController.deleteStation);

module.exports = router;