const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      enum: ['all', 'security', 'medical', 'management', 'guests', 'emergency-services'],
      required: true,
    },
    sender: { type: String, required: true },
    senderRole: { type: String },
    senderId: { type: String },
    content: { type: String, required: true },
    priority: {
      type: String,
      enum: ['normal', 'urgent', 'critical'],
      default: 'normal',
    },
    incidentRef: { type: String }, // Incident ID reference
    isSystemMsg: { type: Boolean, default: false },
    readBy: [{ type: String }],
    attachments: [
      {
        type: { type: String },
        url: { type: String },
        name: { type: String },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
