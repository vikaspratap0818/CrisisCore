import React from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';




export default function CrisisBanner() {
  const { incidents } = useApp();
  const navigate = useNavigate();
  const criticals = incidents.filter(i => i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'false_alarm');
  if (!criticals.length) return null;
  const first = criticals[0];

  return (
    <div className="crisis-bar">
      <i className="ri-alarm-warning-fill"></i>
      <span className="crisis-bar-txt">
        {criticals.length === 1
          ? `CRITICAL: ${first.crisisType?.toUpperCase()} — ${first.location?.zone || first.location?.room || 'TBD'}`
          : `${criticals.length} CRITICAL INCIDENTS ACTIVE`}
      </span>
      <span className="crisis-bar-id">{first.incidentId}</span>
      <button className="crisis-bar-btn" onClick={() => navigate('/dashboard')}>View</button>
    </div>
  );
}
