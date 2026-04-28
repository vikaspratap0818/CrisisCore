const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// POST /api/alerts/guest - Send guest notification
router.post('/guest', auth, async (req, res) => {
  try {
    const { zone, message, channels, incidentId } = req.body;
    const alert = {
      zone,
      message,
      channels: channels || ['sms', 'in-app'],
      incidentId,
      sentAt: new Date(),
      sentBy: req.user.name,
    };
    req.io.to('guests').emit('hotelAlert', alert);
    req.io.emit('guestAlertSent', alert);
    res.json({ success: true, data: alert, message: `Alert sent to ${zone}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/alerts/emergency-services - Send to emergency services
router.post('/emergency-services', auth, (req, res) => {
  const { incidentType, severity, location, incidentId } = req.body;
  const alerts = [];
  if (['fire', 'gas', 'earthquake', 'structural'].includes(incidentType)) {
    alerts.push({ service: 'Fire Department', number: '+1 (555) 911-0001', status: 'notified', method: 'Auto-dial + SMS' });
  }
  if (['medical', 'earthquake'].includes(incidentType)) {
    alerts.push({ service: 'Ambulance / EMS', number: '+1 (555) 911-0003', status: 'notified', method: 'Auto-dial + SMS' });
  }
  if (['security', 'earthquake'].includes(incidentType)) {
    alerts.push({ service: 'Police Department', number: '+1 (555) 911-0002', status: 'notified', method: 'Auto-dial + SMS' });
  }
  req.io.emit('emergencyServicesAlerted', { alerts, incidentId });
  res.json({ success: true, data: alerts });
});

// POST /api/alerts/distress - Guest distress signal
router.post('/distress', auth, (req, res) => {
  const { roomNumber, peopleCount, crisisType, message } = req.body;
  const distress = {
    roomNumber: roomNumber || req.user.roomNumber,
    peopleCount: peopleCount || 1,
    crisisType: crisisType || 'other',
    message,
    timestamp: new Date(),
    status: 'pending',
  };
  req.io.to('staff').emit('guestDistress', distress);
  req.io.emit('guestDistress', distress);
  res.json({ success: true, data: distress, message: 'Distress signal sent to hotel security' });
});

module.exports = router;
