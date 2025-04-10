const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Find user
    const user = await User.findOne({ where: { id: decoded.id } });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

// Middleware to check if user is a farmer
const isFarmer = (req, res, next) => {
  if (req.user.type !== 'farmer') {
    return res.status(403).json({ error: 'Access denied. Farmers only.' });
  }
  next();
};

// Middleware to check if user is a buyer
const isBuyer = (req, res, next) => {
  if (req.user.type !== 'buyer') {
    return res.status(403).json({ error: 'Access denied. Buyers only.' });
  }
  next();
};

// Middleware to check if user is verified
const isVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({ error: 'Account not verified. Please verify your account.' });
  }
  next();
};

// Middleware to check if user is premium
const isPremium = (req, res, next) => {
  if (!req.user.isPremium) {
    return res.status(403).json({ error: 'Premium subscription required.' });
  }
  next();
};

module.exports = {
  auth,
  isFarmer,
  isBuyer,
  isVerified,
  isPremium
};
