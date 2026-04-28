const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

let inMemoryMessages = {};

const getModel = () => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) return require('../models/Message');
  } catch (e) {}
  return null;
};

// GET /api/messages/:channel
router.get('/:channel', auth, async (req, res) => {
  try {
    const { channel } = req.params;
    const { limit = 100 } = req.query;
    const Model = getModel();
    if (Model) {
      const messages = await Model.find({ channel }).sort({ createdAt: -1 }).limit(parseInt(limit));
      return res.json({ success: true, data: messages.reverse() });
    }
    const msgs = (inMemoryMessages[channel] || []).slice(-parseInt(limit));
    res.json({ success: true, data: msgs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/messages
router.post('/', auth, async (req, res) => {
  try {
    const { channel, content, priority, incidentRef, isSystemMsg } = req.body;
    const msgData = {
      channel: channel || 'all',
      sender: req.user.name || req.user.staffId || 'Unknown',
      senderRole: req.user.role,
      senderId: req.user.staffId || req.user.id,
      content,
      priority: priority || 'normal',
      incidentRef,
      isSystemMsg: isSystemMsg || false,
      createdAt: new Date(),
    };

    const Model = getModel();
    if (Model) {
      const msg = new Model(msgData);
      await msg.save();
      req.io.to(channel || 'staff').emit('newMessage', msg);
      return res.status(201).json({ success: true, data: msg });
    }

    msgData._id = Date.now().toString();
    if (!inMemoryMessages[channel]) inMemoryMessages[channel] = [];
    inMemoryMessages[channel].push(msgData);
    req.io.to(channel || 'staff').emit('newMessage', msgData);
    req.io.emit('newMessage', msgData);
    res.status(201).json({ success: true, data: msgData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
