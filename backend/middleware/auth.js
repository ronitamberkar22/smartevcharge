// filepath: backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'smartevcharge_secret_key_2024';

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Auth middleware for protected routes
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated.' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error in authentication.' });
  }
};

// Admin middleware
const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
      }
      next();
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error in admin authentication.' });
  }
};

// User middleware (non-admin)
const userAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role === 'admin') {
        return res.status(403).json({ message: 'Access denied. Users only.' });
      }
      next();
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error in user authentication.' });
  }
};

module.exports = {
  generateToken,
  verifyToken,
  auth,
  adminAuth,
  userAuth
};