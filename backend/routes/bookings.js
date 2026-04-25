// filepath: backend/routes/bookings.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { auth, adminAuth } = require('../middleware/auth');

// User routes
router.post('/', auth, bookingController.createBooking);
router.get('/my', auth, bookingController.getMyBookings);
router.get('/:id', auth, bookingController.getBooking);
router.put('/:id/cancel', auth, bookingController.cancelBooking);
router.put('/:id/start', auth, bookingController.startCharging);

// Admin routes
router.get('/', adminAuth, bookingController.getAllBookings);
router.put('/:id/confirm', adminAuth, bookingController.confirmBooking);
router.put('/:id/complete', adminAuth, bookingController.completeCharging);

module.exports = router;