// filepath: backend/controllers/paymentController.js
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { v4: uuidv4 } = require('uuid');

// Create payment for booking
exports.createPayment = async (req, res) => {
  try {
    // Accept both 'bookingId' and 'booking' field names from frontend
    const bookingId = req.body.bookingId || req.body.booking;
    const paymentMethod = req.body.paymentMethod || req.body.method || 'upi';
    const providedAmount = req.body.amount;
    const providedTxnId = req.body.transactionId;
    const paymentDetails = req.body.paymentDetails || {};
    
    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }
    
    // Check ownership
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    
    // Check if already paid
    const existingPayment = await Payment.findOne({ booking: bookingId, status: 'completed' });
    if (existingPayment) {
      return res.status(400).json({ message: 'Booking is already paid.' });
    }
    
    // Create payment record
    const payment = new Payment({
      booking: bookingId,
      user: req.user._id,
      amount: providedAmount || booking.totalAmount,
      paymentMethod: paymentMethod || 'upi',
      transactionId: providedTxnId || `TXN-${uuidv4().substring(0, 8).toUpperCase()}`,
      currency: 'INR',
      status: 'completed',
      paymentDetails: {
        last4: paymentDetails?.cardNumber?.slice(-4),
        brand: paymentDetails?.cardBrand || 'Visa',
        email: paymentDetails?.email
      },
      paidAt: Date.now()
    });
    
    await payment.save();
    
    // Update booking status
    booking.status = 'confirmed';
    await booking.save();
    
    res.status(201).json({ 
      message: 'Payment successful.',
      payment,
      booking
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Get user's payments
exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate({
        path: 'booking',
        populate: [
          { path: 'station', select: 'name address' },
          { path: 'slot', select: 'slotNumber' }
        ]
      })
      .sort({ createdAt: -1 });
    
    res.json({ payments });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Get single payment
exports.getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate({
        path: 'booking',
        populate: [
          { path: 'station' },
          { path: 'slot' },
          { path: 'user', select: 'name email phone' }
        ]
      });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }
    
    // Check ownership
    if (payment.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }
    
    res.json({ payment });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Get all payments (admin)
exports.getAllPayments = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (startDate && endDate) {
      query.createdAt = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }
    
    const payments = await Payment.find(query)
      .populate('user', 'name email phone')
      .populate({
        path: 'booking',
        populate: [
          { path: 'station', select: 'name address' },
          { path: 'user', select: 'name email' }
        ]
      })
      .sort({ createdAt: -1 });
    
    // Calculate totals
    const totalAmount = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    
    res.json({ 
      payments,
      summary: {
        total: payments.length,
        completed: payments.filter(p => p.status === 'completed').length,
        pending: payments.filter(p => p.status === 'pending').length,
        failed: payments.filter(p => p.status === 'failed').length,
        totalAmount: Math.round(totalAmount * 100) / 100
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Refund payment (admin)
exports.refundPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }
    
    if (payment.status !== 'completed') {
      return res.status(400).json({ message: 'Can only refund completed payments.' });
    }
    
    payment.status = 'refunded';
    await payment.save();
    
    // Update booking status
    const booking = await Booking.findById(payment.booking);
    if (booking) {
      booking.status = 'cancelled';
      await booking.save();
    }
    
    res.json({ message: 'Payment refunded.', payment });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Get payment statistics (admin)
exports.getPaymentStats = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let startDate = new Date();
    if (period === 'day') {
      startDate.setDate(startDate.getDate() - 1);
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    
    const payments = await Payment.find({
      status: 'completed',
      createdAt: { $gte: startDate }
    });
    
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const avgAmount = payments.length ? totalAmount / payments.length : 0;
    
    // Group by payment method
    const byMethod = {};
    payments.forEach(p => {
      byMethod[p.paymentMethod] = (byMethod[p.paymentMethod] || 0) + p.amount;
    });
    
    res.json({
      period,
      totalTransactions: payments.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
      averageAmount: Math.round(avgAmount * 100) / 100,
      byMethod
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};