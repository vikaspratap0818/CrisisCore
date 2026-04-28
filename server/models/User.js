const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    staffId: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['manager', 'security', 'medical', 'frontdesk', 'housekeeping', 'engineering', 'guest'],
      required: true,
    },
    department: { type: String },
    phone: { type: String, default: '' },
    status: {
      type: String,
      enum: ['available', 'responding', 'off_duty', 'break'],
      default: 'available',
    },
    currentLocation: {
      floor: { type: String },
      zone: { type: String },
    },
    currentIncident: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident' },
    certifications: [{ type: String }],
    lastActive: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
