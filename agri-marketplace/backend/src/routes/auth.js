const express = require('express');
const { User } = require('../models');
const { auth } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();

// User registration
router.post('/register', async (req, res) => {
  const { name, email, phone, aadhar, password, type } = req.body;

  try {
    const user = await User.create({ name, email, phone, aadhar, password, type });
    res.status(201).json({ message: 'User registered successfully', userId: user.id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: 'Registration failed' });
  }
});

// User login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, type: user.type }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, userId: user.id, type: user.type });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// OTP verification (mocked)
router.post('/verify-otp', auth, async (req, res) => {
  const { otp } = req.body;

  // Simulate OTP verification
  if (otp === '123456') {
    req.user.isVerified = true;
    await req.user.save();
    return res.json({ message: 'OTP verified successfully' });
  }

  res.status(400).json({ error: 'Invalid OTP' });
});

module.exports = router;
