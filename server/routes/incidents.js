const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { classifyIncident, generateDispatchAlerts, generatePostIncidentReport } = require('../utils/aiClassifier');

// In-memory fallback store (when MongoDB is unavailable)
let inMemoryIncidents = [];

const getModel = () => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) return require('../models/Incident');
  } catch (e) {}
  return null;
};

// GET /api/incidents - Get all incidents
router.get('/', auth, async (req, res) => {
  try {
    const { status, crisisType, severity, limit = 50 } = req.query;
    const Model = getModel();
    if (Model) {
      let query = {};
      if (status) query.status = status;
      if (crisisType) query.crisisType = crisisType;
      if (severity) query.severity = severity;
      const incidents = await Model.find(query).sort({ createdAt: -1 }).limit(parseInt(limit));
      return res.json({ success: true, data: incidents, count: incidents.length });
    }
    // In-memory fallback
    let data = [...inMemoryIncidents];
    if (status) data = data.filter(i => i.status === status);
    if (crisisType) data = data.filter(i => i.crisisType === crisisType);
    res.json({ success: true, data, count: data.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/incidents/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const Model = getModel();
    if (Model) {
      const incident = await Model.findOne({ incidentId: req.params.id });
      if (!incident) return res.status(404).json({ success: false, message: 'Incident not found' });
      return res.json({ success: true, data: incident });
    }
    const incident = inMemoryIncidents.find(i => i.incidentId === req.params.id);
    if (!incident) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: incident });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/incidents - Create new incident
router.post('/', auth, async (req, res) => {
  try {
    const { crisisType, severity, location, description, reportedBy, reportedByRole, peopleAffected, rawInput } = req.body;

    // AI Classification
    const aiResult = rawInput ? classifyIncident(rawInput) : { crisisType, severity, confidence: 1.0 };
    const finalType = crisisType || aiResult.crisisType || 'other';
    const finalSeverity = severity || aiResult.severity || 'moderate';

    // Generate dispatch alerts
    const alerts = generateDispatchAlerts(finalType, finalSeverity, location);

    const incidentData = {
      crisisType: finalType,
      severity: finalSeverity,
      location: location || {},
      description,
      reportedBy: reportedBy || req.user.name || req.user.staffId,
      reportedByRole: reportedByRole || req.user.role,
      peopleAffected: peopleAffected || 0,
      alertsSent: alerts,
      aiClassification: aiResult,
      assignedResponders: getDefaultResponders(finalType),
      timeline: [
        {
          timestamp: new Date(),
          actor: reportedBy || req.user.name,
          actorRole: 'system',
          action: 'Incident Created',
          details: `${finalType.toUpperCase()} incident reported. Severity: ${finalSeverity}. AI confidence: ${Math.round((aiResult.confidence || 1) * 100)}%`,
          type: 'report',
        },
        {
          timestamp: new Date(),
          actor: 'CrisisCore AI',
          actorRole: 'system',
          action: 'Alert Dispatch',
          details: `${alerts.length} alerts dispatched to relevant personnel and emergency services.`,
          type: 'dispatch',
        },
      ],
    };

    const Model = getModel();
    if (Model) {
      const incident = new Model(incidentData);
      await incident.save();
      req.io.emit('newIncident', { incident, alerts });
      req.io.to('staff').emit('alertDispatched', { incidentId: incident.incidentId, alerts, severity: finalSeverity });
      return res.status(201).json({ success: true, data: incident, alerts });
    }

    // In-memory fallback
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    incidentData.incidentId = `INC-${dateStr}-${String(inMemoryIncidents.length + 1).padStart(4, '0')}`;
    incidentData._id = incidentData.incidentId;
    incidentData.createdAt = new Date();
    incidentData.status = 'active';
    inMemoryIncidents.unshift(incidentData);
    req.io.emit('newIncident', { incident: incidentData, alerts });
    req.io.to('staff').emit('alertDispatched', { incidentId: incidentData.incidentId, alerts, severity: finalSeverity });
    res.status(201).json({ success: true, data: incidentData, alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/incidents/:id - Update incident
router.put('/:id', auth, async (req, res) => {
  try {
    const { status, timelineEntry, responderUpdate } = req.body;
    const Model = getModel();

    const updateData = { ...req.body };
    delete updateData.timelineEntry;
    delete updateData.responderUpdate;

    if (status === 'resolved') {
      const incident = Model ? await Model.findOne({ incidentId: req.params.id }) : inMemoryIncidents.find(i => i.incidentId === req.params.id);
      if (incident) {
        const created = new Date(incident.createdAt);
        updateData.resolvedAt = new Date();
        updateData.resolutionTime = Math.round((Date.now() - created.getTime()) / 60000);
        const report = generatePostIncidentReport(incident);
        updateData.postIncidentReport = report;
      }
    }

    if (Model) {
      const pushFields = {};
      if (timelineEntry) pushFields.timeline = { ...timelineEntry, timestamp: new Date() };
      if (responderUpdate) pushFields.assignedResponders = responderUpdate;
      const pushOps = Object.keys(pushFields).length > 0 ? { $push: pushFields } : {};
      const incident = await Model.findOneAndUpdate({ incidentId: req.params.id }, { ...updateData, ...pushOps }, { new: true });
      if (!incident) return res.status(404).json({ success: false, message: 'Not found' });
      req.io.emit('incidentUpdated', incident);
      return res.json({ success: true, data: incident });
    }

    const idx = inMemoryIncidents.findIndex(i => i.incidentId === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Not found' });
    if (timelineEntry) inMemoryIncidents[idx].timeline.push({ ...timelineEntry, timestamp: new Date() });
    Object.assign(inMemoryIncidents[idx], updateData);
    req.io.emit('incidentUpdated', inMemoryIncidents[idx]);
    res.json({ success: true, data: inMemoryIncidents[idx] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/incidents/:id - Delete incident
router.delete('/:id', auth, async (req, res) => {
  try {
    const Model = getModel();
    if (Model) {
      await Model.findOneAndDelete({ incidentId: req.params.id });
      return res.json({ success: true, message: 'Incident deleted' });
    }
    inMemoryIncidents = inMemoryIncidents.filter(i => i.incidentId !== req.params.id);
    res.json({ success: true, message: 'Incident deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/incidents/ai-classify - AI classify raw text
router.post('/ai-classify', auth, (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ success: false, message: 'Text required' });
  const result = classifyIncident(text);
  res.json({ success: true, data: result });
});

function getDefaultResponders(crisisType) {
  const responderMap = {
    fire: [
      { staffId: 'SEC001', name: 'James Okafor', role: 'security', task: 'Evacuate affected floor and secure perimeter', taskStatus: 'assigned' },
      { staffId: 'ENG001', name: 'Robert Kim', role: 'engineering', task: 'Shut down HVAC and utilities in affected zone', taskStatus: 'assigned' },
      { staffId: 'FD001', name: 'Lisa Park', role: 'frontdesk', task: 'Coordinate guest evacuation and assembly point', taskStatus: 'assigned' },
    ],
    medical: [
      { staffId: 'MED001', name: 'Dr. Ahmed Hassan', role: 'medical', task: 'Provide immediate medical assistance', taskStatus: 'assigned' },
      { staffId: 'SEC001', name: 'James Okafor', role: 'security', task: 'Clear the area and secure for medical team', taskStatus: 'assigned' },
      { staffId: 'FD001', name: 'Lisa Park', role: 'frontdesk', task: 'Contact ambulance and guide to location', taskStatus: 'assigned' },
    ],
    security: [
      { staffId: 'SEC001', name: 'James Okafor', role: 'security', task: 'Respond to and neutralize threat', taskStatus: 'assigned' },
      { staffId: 'SEC002', name: 'Maria Santos', role: 'security', task: 'Back up primary security and secure exits', taskStatus: 'assigned' },
      { staffId: 'MGR001', name: 'Sarah Chen', role: 'manager', task: 'Coordinate with police and manage communication', taskStatus: 'assigned' },
    ],
    gas: [
      { staffId: 'ENG001', name: 'Robert Kim', role: 'engineering', task: 'Locate and shut off gas supply', taskStatus: 'assigned' },
      { staffId: 'SEC001', name: 'James Okafor', role: 'security', task: 'Evacuate affected zones immediately', taskStatus: 'assigned' },
      { staffId: 'MED001', name: 'Dr. Ahmed Hassan', role: 'medical', task: 'Monitor for gas inhalation symptoms', taskStatus: 'assigned' },
    ],
    earthquake: [
      { staffId: 'MGR001', name: 'Sarah Chen', role: 'manager', task: 'Activate earthquake response protocol', taskStatus: 'assigned' },
      { staffId: 'MED001', name: 'Dr. Ahmed Hassan', role: 'medical', task: 'Set up triage point at main entrance', taskStatus: 'assigned' },
      { staffId: 'ENG001', name: 'Robert Kim', role: 'engineering', task: 'Assess structural integrity of all floors', taskStatus: 'assigned' },
      { staffId: 'SEC001', name: 'James Okafor', role: 'security', task: 'Manage evacuation and crowd control', taskStatus: 'assigned' },
    ],
    power: [
      { staffId: 'ENG001', name: 'Robert Kim', role: 'engineering', task: 'Activate backup generators and diagnose outage', taskStatus: 'assigned' },
      { staffId: 'FD001', name: 'Lisa Park', role: 'frontdesk', task: 'Communicate with guests about situation', taskStatus: 'assigned' },
    ],
  };
  return responderMap[crisisType] || [
    { staffId: 'MGR001', name: 'Sarah Chen', role: 'manager', task: 'Assess and coordinate response', taskStatus: 'assigned' },
  ];
}

module.exports = router;
