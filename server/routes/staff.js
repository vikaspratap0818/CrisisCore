const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const DEMO_STAFF = [
  { staffId: 'MGR001', name: 'Sarah Chen', role: 'manager', department: 'Management', phone: '+1-555-0101', status: 'available', isOnline: true, currentLocation: { floor: 'G', zone: 'Office' } },
  { staffId: 'SEC001', name: 'James Okafor', role: 'security', department: 'Security', phone: '+1-555-0102', status: 'available', isOnline: true, currentLocation: { floor: 'G', zone: 'Security Desk' } },
  { staffId: 'SEC002', name: 'Maria Santos', role: 'security', department: 'Security', phone: '+1-555-0103', status: 'available', isOnline: true, currentLocation: { floor: '3', zone: 'Patrol' } },
  { staffId: 'MED001', name: 'Dr. Ahmed Hassan', role: 'medical', department: 'Medical', phone: '+1-555-0104', status: 'available', isOnline: true, currentLocation: { floor: '1', zone: 'Medical Room' } },
  { staffId: 'FD001', name: 'Lisa Park', role: 'frontdesk', department: 'Front Desk', phone: '+1-555-0105', status: 'available', isOnline: true, currentLocation: { floor: 'G', zone: 'Front Desk' } },
  { staffId: 'FD002', name: 'Carlos Rivera', role: 'frontdesk', department: 'Front Desk', phone: '+1-555-0106', status: 'available', isOnline: false, currentLocation: { floor: 'G', zone: 'Concierge' } },
  { staffId: 'HK001', name: 'Priya Patel', role: 'housekeeping', department: 'Housekeeping', phone: '+1-555-0107', status: 'available', isOnline: true, currentLocation: { floor: '5', zone: 'Round' } },
  { staffId: 'ENG001', name: 'Robert Kim', role: 'engineering', department: 'Engineering', phone: '+1-555-0108', status: 'available', isOnline: true, currentLocation: { floor: 'B1', zone: 'Utilities' } },
];

// GET /api/staff - Get all staff
router.get('/', auth, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      const User = require('../models/User');
      const staff = await User.find({ role: { $ne: 'guest' } }).select('-password');
      return res.json({ success: true, data: staff });
    }
    res.json({ success: true, data: DEMO_STAFF });
  } catch (err) {
    res.json({ success: true, data: DEMO_STAFF });
  }
});

// PUT /api/staff/:staffId/status - Update staff status
router.put('/:staffId/status', auth, async (req, res) => {
  try {
    const { status, currentLocation } = req.body;
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      const User = require('../models/User');
      const user = await User.findOneAndUpdate({ staffId: req.params.staffId }, { status, currentLocation }, { new: true }).select('-password');
      req.io.emit('staffStatusUpdate', { staffId: req.params.staffId, status, currentLocation });
      return res.json({ success: true, data: user });
    }
    const staff = DEMO_STAFF.find(s => s.staffId === req.params.staffId);
    if (staff) { staff.status = status; if (currentLocation) staff.currentLocation = currentLocation; }
    req.io.emit('staffStatusUpdate', { staffId: req.params.staffId, status, currentLocation });
    res.json({ success: true, data: staff });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
