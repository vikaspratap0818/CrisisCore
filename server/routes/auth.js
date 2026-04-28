const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const auth = require('../middleware/auth');

const SECRET = process.env.JWT_SECRET || 'fallback_secret';

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

// ─── REGISTER ───────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, department, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, password and role are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    if (!isDbConnected()) {
      // Demo mode — just return a token
      const staffId = role.slice(0, 3).toUpperCase() + String(Date.now()).slice(-3);
      const token = jwt.sign({ staffId, role, name, id: staffId }, SECRET, { expiresIn: '12h' });
      return res.status(201).json({
        success: true, token,
        user: { staffId, name, role, department: department || role, email },
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const staffId = role.slice(0, 3).toUpperCase() + String(Date.now()).slice(-3);

    const user = await User.create({
      staffId,
      name,
      email,
      password: hashed,
      role,
      department: department || role,
      phone: phone || '',
      status: 'available',
    });

    const token = jwt.sign(
      { id: user._id, staffId: user.staffId, role: user.role, name: user.name },
      SECRET,
      { expiresIn: '12h' }
    );

    res.status(201).json({
      success: true, token,
      user: {
        id: user._id, staffId: user.staffId, name: user.name,
        role: user.role, department: user.department, email: user.email,
      },
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ success: false, message: 'Registration failed. Try again.' });
  }
});

// ─── LOGIN ──────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { staffId, email, password, role } = req.body;

    if (!isDbConnected()) {
      const demoToken = jwt.sign(
        { staffId: staffId || 'DEMO001', role: role || 'manager', name: getDemoName(role), id: staffId || 'DEMO001' },
        SECRET,
        { expiresIn: '12h' }
      );
      return res.json({
        success: true, token: demoToken,
        user: { staffId: staffId || 'DEMO001', name: getDemoName(role), role: role || 'manager', department: getDemoDept(role) },
      });
    }

    // Find by staffId or email
    const query = email ? { email } : { staffId };
    const user = await User.findOne(query).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Account not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    const token = jwt.sign(
      { id: user._id, staffId: user.staffId, role: user.role, name: user.name },
      SECRET,
      { expiresIn: '12h' }
    );

    await User.findByIdAndUpdate(user._id, { lastActive: new Date(), isOnline: true });

    res.json({
      success: true, token,
      user: {
        id: user._id, staffId: user.staffId, name: user.name,
        role: user.role, department: user.department, phone: user.phone, email: user.email,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    // Fallback demo mode
    const { staffId, role } = req.body;
    const demoToken = jwt.sign(
      { staffId: staffId || 'DEMO001', role: role || 'manager', name: getDemoName(role), id: staffId || 'DEMO001' },
      SECRET,
      { expiresIn: '12h' }
    );
    res.json({
      success: true, token: demoToken,
      user: { staffId, name: getDemoName(role), role, department: getDemoDept(role) },
    });
  }
});

// ─── GUEST LOGIN ────────────────────────────────────────
router.post('/guest-login', (req, res) => {
  const { roomNumber, bookingRef } = req.body;
  if (!roomNumber) {
    return res.status(400).json({ success: false, message: 'Room number required' });
  }

  const token = jwt.sign(
    { role: 'guest', roomNumber, bookingRef, name: `Guest — Room ${roomNumber}` },
    SECRET,
    { expiresIn: '24h' }
  );
  res.json({
    success: true, token,
    user: { role: 'guest', name: `Guest — Room ${roomNumber}`, roomNumber, bookingRef },
  });
});

// ─── GET CURRENT USER ───────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    if (isDbConnected() && req.user.id && req.user.role !== 'guest') {
      const user = await User.findById(req.user.id).select('-password');
      if (user) return res.json({ success: true, user });
    }
    res.json({ success: true, user: req.user });
  } catch (err) {
    res.json({ success: true, user: req.user });
  }
});

// ─── CHANGE PASSWORD ────────────────────────────────────
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both passwords required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    if (!isDbConnected()) {
      return res.json({ success: true, message: 'Password updated (demo mode)' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── LOGOUT ─────────────────────────────────────────────
router.post('/logout', auth, async (req, res) => {
  try {
    if (isDbConnected() && req.user.id && req.user.role !== 'guest') {
      await User.findByIdAndUpdate(req.user.id, { isOnline: false, lastActive: new Date() });
    }
  } catch (err) { /* silent */ }
  res.json({ success: true, message: 'Logged out' });
});

// ─── HELPERS ────────────────────────────────────────────
function getDemoName(role) {
  const names = {
    manager: 'Sarah Chen', security: 'James Okafor', medical: 'Dr. Ahmed Hassan',
    frontdesk: 'Lisa Park', housekeeping: 'Priya Patel', engineering: 'Robert Kim',
  };
  return names[role] || 'Staff Member';
}

function getDemoDept(role) {
  const depts = {
    manager: 'Management', security: 'Security', medical: 'Medical',
    frontdesk: 'Front Desk', housekeeping: 'Housekeeping', engineering: 'Engineering',
  };
  return depts[role] || 'General';
}

module.exports = router;
