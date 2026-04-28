const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: String,
      unique: true,
      required: true,
    },
    crisisType: {
      type: String,
      enum: ['fire', 'medical', 'security', 'gas', 'earthquake', 'power', 'flood', 'structural', 'other'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['critical', 'high', 'moderate', 'low'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'responding', 'contained', 'resolved', 'false_alarm'],
      default: 'active',
    },
    location: {
      floor: { type: String },
      room: { type: String },
      zone: { type: String },
      description: { type: String },
    },
    description: { type: String, required: true },
    reportedBy: { type: String },
    reportedByRole: { type: String },
    peopleAffected: { type: Number, default: 0 },
    assignedResponders: [
      {
        staffId: { type: String },
        name: { type: String },
        role: { type: String },
        assignedAt: { type: Date, default: Date.now },
        taskStatus: {
          type: String,
          enum: ['assigned', 'en_route', 'on_scene', 'completed'],
          default: 'assigned',
        },
        task: { type: String },
      },
    ],
    timeline: [
      {
        timestamp: { type: Date, default: Date.now },
        actor: { type: String },
        actorRole: { type: String },
        action: { type: String },
        details: { type: String },
        type: {
          type: String,
          enum: ['report', 'dispatch', 'update', 'escalate', 'resolve', 'log', 'guest'],
          default: 'log',
        },
      },
    ],
    alertsSent: [
      {
        recipient: { type: String },
        recipientType: { type: String },
        channel: { type: String },
        message: { type: String },
        sentAt: { type: Date, default: Date.now },
        status: { type: String, enum: ['sent', 'queued', 'failed'], default: 'sent' },
      },
    ],
    guestNotifications: [
      {
        zone: { type: String },
        message: { type: String },
        channels: [{ type: String }],
        sentAt: { type: Date, default: Date.now },
      },
    ],
    resolvedAt: { type: Date },
    resolutionTime: { type: Number }, // in minutes
    postIncidentReport: {
      summary: { type: String },
      recommendations: [{ type: String }],
      generatedAt: { type: Date },
    },
    aiClassification: {
      confidence: { type: Number },
      suggestedType: { type: String },
      suggestedSeverity: { type: String },
      keywords: [{ type: String }],
    },
  },
  { timestamps: true }
);

incidentSchema.pre('validate', async function (next) {
  if (!this.incidentId) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await mongoose.model('Incident').countDocuments();
    this.incidentId = `INC-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Incident', incidentSchema);