// filepath: backend/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth, adminAuth } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', auth, authController.getMe);
router.put('/profile', auth, authController.updateProfile);
router.put('/password', auth, authController.changePassword);

// Admin routes
router.get('/users', adminAuth, authController.getAllUsers);
router.put('/users/:id/toggle', adminAuth, authController.toggleUserStatus);

module.exports = router;