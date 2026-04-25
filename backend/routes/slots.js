// filepath: backend/routes/slots.js
const express = require('express');
const router = express.Router();
const slotController = require('../controllers/slotController');
const { auth, adminAuth } = require('../middleware/auth');

// Public/User routes
router.get('/available', slotController.getAvailableSlots);
router.get('/recommend', slotController.getSlotRecommendation);
router.get('/availability', slotController.getSlotAvailability);

// Admin routes
router.get('/station/:stationId', adminAuth, slotController.getSlotsByStation);
router.put('/:id', adminAuth, slotController.updateSlotStatus);

module.exports = router;