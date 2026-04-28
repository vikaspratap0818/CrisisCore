import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';

const ICON = { fire:'ri-fire-line', medical:'ri-heart-pulse-line', security:'ri-shield-keyhole-line', gas:'ri-windy-line', earthquake:'ri-shake-hands-line', power:'ri-flashlight-line', flood:'ri-water-flash-line', structural:'ri-building-4-line', other:'ri-alert-line' };
const LABEL = { fire:'Fire / Smoke', medical:'Medical', security:'Security', gas:'Gas Leak', earthquake:'Earthquake', power:'Power Outage', flood:'Flood', structural:'Structural', other:'Other' };
const STATUS = { active:'Active', responding:'Responding', contained:'Contained', resolved:'Resolved', false_alarm:'False Alarm' };

export default function Dashboard() {
  const { incidents, staff, stats, fetchIncidents, updateIncident, user } = useApp();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const active = incidents.filter(i => i.status !== 'resolved' && i.status !== 'false_alarm');
  const typeCounts = incidents.reduce((a, i) => ({ ...a, [i.crisisType]: (a[i.crisisType] || 0) + 1 }), {});
  const maxType = Math.max(...Object.values(typeCounts), 1);

  const feed = incidents
    .flatMap(inc => (inc.timeline || []).map(t => ({ ...t, incidentId: inc.incidentId })))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 20);

  const handleStatus = async (id, status) => {
    await updateIncident(id, { status, timelineEntry: { actor: user?.name, actorRole: user?.role, action: `Status → ${status}`, type: 'update' } });
    setSelected(null);
  };

  return (
    <div>
      <div className="ph">
        <div className="ph-title">
          <div className="ph-icon"><i className="ri-dashboard-3-line"></i></div>
          <div><h2>Dashboard</h2><div className="ph-sub">Real-time incident monitoring</div></div>
        </div>
        <div className="ph-actions">
          <button className="btn btn-secondary btn-sm" onClick={fetchIncidents}><i className="ri-refresh-line"></i> Refresh</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/report')}><i className="ri-add-line"></i> New Incident</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis">
        {[
          { c: 'var(--red)', icon: 'ri-alarm-warning-fill', val: stats.critical, lbl: 'Critical' },
          { c: 'var(--orange)', icon: 'ri-error-warning-fill', val: stats.high, lbl: 'High' },
          { c: 'var(--amber)', icon: 'ri-alert-fill', val: stats.moderate, lbl: 'Moderate' },
          { c: 'var(--green)', icon: 'ri-checkbox-circle-fill', val: stats.resolved, lbl: 'Resolved' },
          { c: 'var(--blue)', icon: 'ri-team-fill', val: staff.filter(s => s.status !== 'off_duty').length, lbl: 'On Duty' },
          { c: 'var(--purple)', icon: 'ri-timer-line', val: '--', lbl: 'Avg Response' },
        ].map(k => (
          <div className="kpi" key={k.lbl} style={{ '--kpi-c': k.c }}>
            <div className="kpi-top">
              <i className={`kpi-icon ${k.icon}`}></i>
              {k.lbl === 'Critical' && stats.critical > 0 && <span className="tb-dot red"></span>}
            </div>
            <div className="kpi-val">{k.val}</div>
            <div className="kpi-label">{k.lbl}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Active incidents */}
        <div className="card">
          <div className="card-h">
            <h3><i className="ri-alarm-warning-line"></i> Active Incidents</h3>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/report')}><i className="ri-add-line"></i> Report</button>
          </div>
          <div className="inc-list">
            {active.length === 0 ? (
              <div className="empty"><i className="ri-checkbox-circle-line"></i><h4>No active incidents</h4><p>All clear</p></div>
            ) : active.map(inc => (
              <div key={inc._id || inc.incidentId} className="inc-row" onClick={() => setSelected(inc)}>
                <div className="inc-icon"><i className={ICON[inc.crisisType] || 'ri-alert-line'}></i></div>
                <div className="inc-body">
                  <div className="inc-id">{inc.incidentId}</div>
                  <div className="inc-name">{LABEL[inc.crisisType] || inc.crisisType}</div>
                  <div className="inc-loc"><i className="ri-map-pin-line"></i>{inc.location?.zone || `Floor ${inc.location?.floor || '?'}`}{inc.location?.room ? ` · Rm ${inc.location.room}` : ''}</div>
                </div>
                <div className="inc-end">
                  <span className={`badge b-${inc.severity}`}>{inc.severity}</span>
                  <span className={`badge b-${inc.status}`}>{STATUS[inc.status]}</span>
                  <span className="inc-time">{inc.createdAt ? formatDistanceToNow(new Date(inc.createdAt), { addSuffix: true }) : '--'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feed */}
        <div className="card">
          <div className="card-h">
            <h3><i className="ri-broadcast-line"></i> Activity Feed</h3>
            <div className="live"><span className="live-dot"></span>LIVE</div>
          </div>
          <div className="feed">
            {feed.length === 0 ? (
              <div className="empty"><i className="ri-broadcast-line"></i><h4>No activity yet</h4></div>
            ) : feed.map((item, i) => (
              <div key={i} className="feed-item">
                <span className="feed-time">{item.timestamp ? format(new Date(item.timestamp), 'HH:mm') : '--'}</span>
                <span className={`feed-dot ${item.type === 'resolve' ? 'green' : item.type === 'dispatch' ? 'red' : 'blue'}`}></span>
                <span className="feed-msg"><strong style={{ color: 'var(--text-4)', fontSize: 10 }}>[{item.incidentId}]</strong> {item.action}: {item.details?.slice(0, 80)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Type stats */}
        <div className="card">
          <div className="card-h"><h3><i className="ri-bar-chart-2-line"></i> By Type</h3></div>
          <div className="card-b">
            {[
              { key: 'fire', icon: 'ri-fire-line', lbl: 'Fire', c: 'var(--red)' },
              { key: 'medical', icon: 'ri-heart-pulse-line', lbl: 'Medical', c: 'var(--blue)' },
              { key: 'security', icon: 'ri-shield-keyhole-line', lbl: 'Security', c: 'var(--orange)' },
              { key: 'power', icon: 'ri-flashlight-line', lbl: 'Utility', c: 'var(--teal)' },
              { key: 'earthquake', icon: 'ri-shake-hands-line', lbl: 'Natural', c: 'var(--purple)' },
            ].map(s => (
              <div className="sbar" key={s.key}>
                <div className="sbar-top"><span><i className={s.icon}></i>{s.lbl}</span><span style={{ fontWeight: 700 }}>{typeCounts[s.key] || 0}</span></div>
                <div className="sbar-track"><div className="sbar-fill" style={{ width: `${((typeCounts[s.key] || 0) / maxType) * 100}%`, background: s.c }}></div></div>
              </div>
            ))}
          </div>
        </div>

        {/* Staff */}
        <div className="card">
          <div className="card-h">
            <h3><i className="ri-team-line"></i> Staff</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/coordination')}>View all</button>
          </div>
          <div className="resp-list">
            {staff.slice(0, 8).map(s => (
              <div className="resp-row" key={s.staffId}>
                <div className="resp-av" style={{ background: s.role === 'security' ? 'var(--orange)' : s.role === 'medical' ? 'var(--blue)' : s.role === 'manager' ? 'var(--red)' : 'var(--teal)' }}>
                  {s.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="resp-info">
                  <div className="resp-name">{s.name}</div>
                  <div className="resp-role">{s.role}</div>
                </div>
                <span className={`resp-st ${s.status}`}>{s.status === 'available' ? '● Available' : s.status === 'responding' ? '● Responding' : '○ Off Duty'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div className="modal-bg" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title"><i className={ICON[selected.crisisType]}></i>{LABEL[selected.crisisType]} — {selected.incidentId}</div>
              <button className="modal-close" onClick={() => setSelected(null)}><i className="ri-close-line"></i></button>
            </div>
            <div className="modal-body">
              <div className="info-grid">
                {[['ID', selected.incidentId], ['Status', STATUS[selected.status]], ['Severity', selected.severity],
                  ['Location', `${selected.location?.zone || ''} ${selected.location?.room ? 'Rm ' + selected.location.room : ''}`.trim() || '--'],
                  ['Reported By', selected.reportedBy], ['People', selected.peopleAffected || 0]
                ].map(([l, v]) => (
                  <div className="info-cell" key={l}><div className="info-cell-l">{l}</div><div className="info-cell-v">{v}</div></div>
                ))}
              </div>
              <div className="fg"><label className="fl">Description</label><div style={{ background: 'var(--bg-3)', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: 'var(--text-2)' }}>{selected.description}</div></div>
              {selected.timeline?.length > 0 && (
                <div className="fg">
                  <label className="fl">Timeline</label>
                  <div style={{ background: 'var(--bg-3)', borderRadius: 6, maxHeight: 180, overflowY: 'auto' }}>
                    {selected.timeline.map((t, i) => (
                      <div key={i} className="log-row"><span className="log-ts">{t.timestamp ? format(new Date(t.timestamp), 'HH:mm:ss') : '--'}</span><span className="log-actor">{t.actor || 'SYSTEM'}</span><span className="log-msg">{t.action}: {t.details}</span></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-foot">
              <button className="btn btn-secondary btn-sm" onClick={() => handleStatus(selected.incidentId, 'responding')}><i className="ri-run-line"></i> Responding</button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleStatus(selected.incidentId, 'contained')}><i className="ri-shield-check-line"></i> Contained</button>
              <button className="btn btn-green btn-sm" onClick={() => handleStatus(selected.incidentId, 'resolved')}><i className="ri-checkbox-circle-line"></i> Resolved</button>
              <button className="btn btn-ghost btn-sm" onClick={() => handleStatus(selected.incidentId, 'false_alarm')}><i className="ri-close-circle-line"></i> False Alarm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
