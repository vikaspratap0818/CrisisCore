/**
 * AI Crisis Classification Engine
 * Classifies emergency input text into crisis types and severity levels
 */

const CRISIS_PATTERNS = {
  fire: {
    keywords: ['fire', 'smoke', 'flame', 'burning', 'blaze', 'ignite', 'heat', 'ash', 'charred', 'smells like burning'],
    severity: 'critical',
    defaultSeverity: 'critical',
    emergencyServices: ['fire department', 'ambulance'],
    evacuate: true,
  },
  medical: {
    keywords: ['collapsed', 'unresponsive', 'unconscious', 'heart attack', 'stroke', 'seizure', 'bleeding', 'injured', 'not breathing', 'chest pain', 'medical', 'ambulance', 'hurt', 'pain', 'fainted', 'dizzy', 'fall'],
    severity: 'critical',
    defaultSeverity: 'critical',
    emergencyServices: ['ambulance'],
    evacuate: false,
  },
  security: {
    keywords: ['threat', 'threatening', 'weapon', 'gun', 'knife', 'attack', 'assault', 'robbery', 'stealing', 'suspicious', 'intruder', 'violence', 'fight', 'aggressive', 'dangerous person'],
    severity: 'critical',
    defaultSeverity: 'high',
    emergencyServices: ['police'],
    evacuate: false,
  },
  gas: {
    keywords: ['gas', 'leak', 'smell', 'fumes', 'chemical', 'odor', 'carbon monoxide', 'CO', 'gas leak', 'propane', 'natural gas'],
    severity: 'critical',
    defaultSeverity: 'critical',
    emergencyServices: ['fire department'],
    evacuate: true,
  },
  earthquake: {
    keywords: ['earthquake', 'tremor', 'shaking', 'quaking', 'seismic', 'ground shaking', 'building shaking', 'panicking', 'collapse'],
    severity: 'critical',
    defaultSeverity: 'critical',
    emergencyServices: ['fire department', 'police', 'ambulance'],
    evacuate: true,
  },
  power: {
    keywords: ['power', 'electricity', 'blackout', 'outage', 'lights out', 'no power', 'generator', 'electrical', 'dark'],
    severity: 'moderate',
    defaultSeverity: 'moderate',
    emergencyServices: [],
    evacuate: false,
  },
  flood: {
    keywords: ['flood', 'flooding', 'water damage', 'pipe burst', 'leaking', 'overflow', 'water gushing', 'sewage'],
    severity: 'high',
    defaultSeverity: 'high',
    emergencyServices: [],
    evacuate: false,
  },
  structural: {
    keywords: ['structural', 'collapse', 'ceiling', 'wall crack', 'foundation', 'sinkhole', 'building damage', 'unstable'],
    severity: 'critical',
    defaultSeverity: 'critical',
    emergencyServices: ['fire department'],
    evacuate: true,
  },
};

const LOCATION_PATTERNS = {
  room: /room\s*#?\s*(\d+)/i,
  floor: /floor\s*(\d+|basement|ground|lobby|rooftop|pool|restaurant|parking)/i,
  lobby: /lobby|reception|entrance|main hall/i,
  pool: /pool|spa|jacuzzi|outdoor/i,
  restaurant: /restaurant|kitchen|dining|bar|café/i,
  parking: /parking|garage|lot/i,
};

const SEVERITY_MODIFIERS = {
  increase: ['multiple', 'many', 'several', 'fast', 'quickly', 'spreading', 'panic', 'everyone', 'all floors', 'unresponsive', 'not breathing'],
  decrease: ['small', 'minor', 'contained', 'slight', 'possible', 'maybe', 'not sure'],
};

/**
 * Main AI Classification Function
 */
function classifyIncident(text) {
  if (!text || typeof text !== 'string') return { crisisType: 'other', severity: 'moderate', confidence: 0.5 };

  const lowText = text.toLowerCase();
  const scores = {};

  // Score each crisis type
  for (const [type, config] of Object.entries(CRISIS_PATTERNS)) {
    scores[type] = 0;
    for (const keyword of config.keywords) {
      if (lowText.includes(keyword.toLowerCase())) {
        scores[type] += keyword.length > 5 ? 2 : 1;
      }
    }
  }

  // Find highest score
  const topType = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  const crisisType = topType[1] > 0 ? topType[0] : 'other';
  const topScore = topType[1];
  const totalPossible = CRISIS_PATTERNS[crisisType]?.keywords.length || 10;
  const confidence = Math.min(0.95, 0.5 + (topScore / totalPossible) * 0.45);

  // Determine severity
  let severity = (CRISIS_PATTERNS[crisisType]?.defaultSeverity) || 'moderate';
  for (const mod of SEVERITY_MODIFIERS.increase) {
    if (lowText.includes(mod)) { severity = upgradeSeverity(severity); break; }
  }
  for (const mod of SEVERITY_MODIFIERS.decrease) {
    if (lowText.includes(mod)) { severity = downgradeSeverity(severity); break; }
  }

  // Extract location
  const location = extractLocation(text);

  // Extract keywords found
  const foundKeywords = CRISIS_PATTERNS[crisisType]?.keywords.filter(k => lowText.includes(k.toLowerCase())) || [];

  // Generate guest instructions
  const guestInstructions = generateGuestInstructions(crisisType, location);

  // Generate staff protocol
  const staffProtocol = generateStaffProtocol(crisisType, severity);

  return {
    crisisType,
    severity,
    confidence: Math.round(confidence * 100) / 100,
    location,
    keywords: foundKeywords,
    guestInstructions,
    staffProtocol,
    shouldEvacuate: CRISIS_PATTERNS[crisisType]?.evacuate || false,
    emergencyServices: CRISIS_PATTERNS[crisisType]?.emergencyServices || [],
    suggestedActions: getSuggestedActions(crisisType, severity),
  };
}

function extractLocation(text) {
  const location = {};
  const roomMatch = text.match(LOCATION_PATTERNS.room);
  if (roomMatch) location.room = roomMatch[1];
  const floorMatch = text.match(LOCATION_PATTERNS.floor);
  if (floorMatch) location.floor = floorMatch[1];
  if (LOCATION_PATTERNS.lobby.test(text)) location.zone = 'Lobby';
  if (LOCATION_PATTERNS.pool.test(text)) location.zone = 'Pool & Spa Area';
  if (LOCATION_PATTERNS.restaurant.test(text)) location.zone = 'Restaurant & Kitchen';
  if (LOCATION_PATTERNS.parking.test(text)) location.zone = 'Parking Garage';
  return location;
}

function upgradeSeverity(severity) {
  const levels = ['low', 'moderate', 'high', 'critical'];
  const idx = levels.indexOf(severity);
  return idx < levels.length - 1 ? levels[idx + 1] : severity;
}

function downgradeSeverity(severity) {
  const levels = ['low', 'moderate', 'high', 'critical'];
  const idx = levels.indexOf(severity);
  return idx > 0 ? levels[idx - 1] : severity;
}

function generateGuestInstructions(crisisType, location) {
  const instructions = {
    fire: ['Remain calm. Do not panic.', 'Leave your room immediately. Close the door behind you.', 'Do NOT use the elevators. Use the nearest stairwell.', 'Proceed to the main entrance (North side) assembly point.', 'If you cannot leave, signal from your window.', 'Hotel staff are guiding evacuation now.'],
    medical: ['Stay calm and do not move the person.', 'Keep the area clear for medical staff.', 'Our trained medical team is on the way — ETA under 3 minutes.', 'If the person stops breathing, call out for anyone trained in CPR.'],
    security: ['Remain in your room and lock your door.', 'Do not open the door for anyone you do not know.', 'Stay away from windows and corridors.', 'Await all-clear from hotel security before leaving your room.'],
    gas: ['Leave the affected area immediately.', 'Do NOT use light switches or create sparks.', 'Move to the open air or to an adjacent building wing.', 'Do not re-enter until hotel staff give the all-clear.'],
    earthquake: ['Drop, Cover, and Hold On until shaking stops.', 'Stay away from windows, shelves, and heavy objects.', 'Once shaking stops, check for injuries.', 'Do NOT use elevators. Await staff instructions before evacuating.'],
    power: ['Remain calm — this is a power outage.', 'Emergency lighting is active throughout the hotel.', 'Do not use candles. Stay in your room if safe to do so.', 'Staff will provide updates every 10 minutes.'],
  };
  return instructions[crisisType] || ['Remain calm and await further instructions from hotel staff.', 'Do not leave your room unless instructed by hotel personnel.'];
}

function generateStaffProtocol(crisisType, severity) {
  const protocols = {
    fire: ['Activate fire alarm immediately', 'Initiate floor evacuation starting from affected floor', 'Shut down HVAC to prevent smoke spread', 'Contact Fire Department — provide floor, room, and extent', 'Set up assembly point at North Entrance', 'Assign staff to elevator lobbies to redirect guests to stairs'],
    medical: ['Dispatch Dr. Hassan to location immediately', 'Clear a 3-meter radius around patient', 'Retrieve AED from nearest storage (every 3rd floor)', 'Contact ambulance — provide exact location and patient condition', 'Do NOT move patient unless in immediate danger'],
    security: ['Dispatch two security officers immediately', 'Lock down affected zone — prevent entry/exit', 'Contact Police — provide description of threat', 'Activate CCTV on affected area', 'Keep other guests away from zone'],
    gas: ['Evacuate the affected zone immediately — no delays', 'Locate and shut main gas supply valve', 'Open all windows and ventilate', 'No open flames or electrical switches in zone', 'Contact Fire Department and Gas Company'],
    earthquake: ['Wait for shaking to stop — do not run', 'Check all staff are safe', 'Assess structural damage before allowing re-entry', 'Set up triage at main entrance', 'All staff report to assembly point for headcount'],
    power: ['Activate backup generator — Engineering team', 'Check all emergency lighting is functional', 'Assign staff to stairwells with flashlights', 'Communicate status to all guests via radio/phone', 'Estimate restoration time and update every 10 minutes'],
  };
  return protocols[crisisType] || ['Assess the situation', 'Contact relevant department heads', 'Document all actions with timestamps'];
}

function getSuggestedActions(crisisType, severity) {
  return {
    immediate: generateStaffProtocol(crisisType, severity).slice(0, 3),
    guestComms: generateGuestInstructions(crisisType, {}),
    escalation: severity === 'critical' ? 'Escalate to senior management and external emergency services immediately.' : 'Monitor situation and escalate if condition worsens.',
  };
}

/**
 * Generate dispatch alerts list
 */
function generateDispatchAlerts(crisisType, severity, location) {
  const alerts = [];
  const ts = new Date();
  const locStr = location ? `${location.zone || ''} ${location.floor ? 'Floor ' + location.floor : ''} ${location.room ? 'Room ' + location.room : ''}`.trim() : 'Unknown';

  const staffAlerts = {
    fire: ['Security Team', 'Engineering', 'Front Desk', 'Management', 'All Staff'],
    medical: ['Medical Staff', 'Security Team', 'Front Desk', 'Management'],
    security: ['Security Team', 'Management', 'Front Desk'],
    gas: ['Engineering', 'Security Team', 'Medical Staff', 'Management', 'All Staff'],
    earthquake: ['All Staff', 'Medical Staff', 'Security Team', 'Management'],
    power: ['Engineering', 'Front Desk', 'Management'],
    flood: ['Engineering', 'Housekeeping', 'Front Desk', 'Management'],
  };

  const recipients = staffAlerts[crisisType] || ['Management', 'Security Team'];
  for (const r of recipients) {
    alerts.push({ recipient: r, recipientType: 'staff', channel: 'in-app', message: `[${severity.toUpperCase()}] ${crisisType.toUpperCase()} at ${locStr}. Report to position immediately.`, sentAt: ts, status: 'sent' });
  }

  const services = CRISIS_PATTERNS[crisisType]?.emergencyServices || [];
  for (const s of services) {
    alerts.push({ recipient: s, recipientType: 'emergency_service', channel: 'phone', message: `Emergency at Grand Horizon Hotel. Type: ${crisisType}. Location: ${locStr}. Severity: ${severity}.`, sentAt: ts, status: 'sent' });
  }

  if (severity === 'critical' || crisisType === 'fire' || crisisType === 'gas' || crisisType === 'earthquake') {
    alerts.push({ recipient: 'All Hotel Guests', recipientType: 'guests', channel: 'intercom', message: generateGuestInstructions(crisisType, {})[0], sentAt: ts, status: 'sent' });
  }

  return alerts;
}

/**
 * Generate Post-Incident Report
 */
function generatePostIncidentReport(incident) {
  const duration = incident.resolutionTime || 0;
  const recommendations = getRecommendations(incident.crisisType);
  return {
    summary: `${incident.crisisType.toUpperCase()} incident at ${incident.location?.zone || incident.location?.floor || 'unknown location'}. Incident lasted ${duration} minutes with ${incident.assignedResponders?.length || 0} responders. ${incident.peopleAffected || 0} people affected.`,
    recommendations,
    generatedAt: new Date(),
  };
}

function getRecommendations(crisisType) {
  const recs = {
    fire: ['Conduct monthly fire drill for all staff', 'Inspect all fire suppression systems quarterly', 'Ensure all exit signs and emergency lighting are functional', 'Review fire prevention protocols in kitchen and laundry'],
    medical: ['Ensure AED devices are serviced and accessible on all floors', 'Conduct annual CPR & first aid training for all guest-facing staff', 'Review medical response time targets (target: <3 min)'],
    security: ['Review CCTV coverage and add cameras to identified blind spots', 'Conduct quarterly security awareness training', 'Review staff ID protocols and access control'],
    gas: ['Inspect all gas lines and connections monthly', 'Install additional CO/gas detectors in kitchen and basement', 'Train kitchen staff on gas safety protocols'],
    earthquake: ['Review earthquake response protocol with all staff', 'Inspect structural integrity certification annually', 'Stock emergency supplies on each floor'],
    power: ['Service backup generators monthly', 'Install UPS systems for critical-path systems', 'Review emergency lighting battery life quarterly'],
  };
  return recs[crisisType] || ['Review incident response procedures', 'Train staff on similar scenarios', 'Update emergency protocols based on lessons learned'];
}

module.exports = { classifyIncident, generateDispatchAlerts, generatePostIncidentReport };
