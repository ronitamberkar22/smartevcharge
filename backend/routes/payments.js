// filepath: backend/routes/payments.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { auth, adminAuth } = require('../middleware/auth');

// User routes
router.post('/', auth, paymentController.createPayment);
router.get('/my', auth, paymentController.getMyPayments);
router.get('/:id', auth, paymentController.getPayment);

// Admin routes
router.get('/', adminAuth, paymentController.getAllPayments);
router.put('/:id/refund', adminAuth, paymentController.refundPayment);
router.get('/stats', adminAuth, paymentController.getPaymentStats);

module.exports = router;