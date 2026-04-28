import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ICON = { fire:'ri-fire-line', medical:'ri-heart-pulse-line', security:'ri-shield-keyhole-line', gas:'ri-windy-line', earthquake:'ri-shake-hands-line', power:'ri-flashlight-line', other:'ri-alert-line' };

export default function Coordination() {
  const { incidents, staff, updateIncident, user } = useApp();
  const [logMsg, setLogMsg] = useState('');
  const active = incidents.filter(i => i.status !== 'resolved' && i.status !== 'false_alarm');
  const tasks = active.flatMap(inc => (inc.assignedResponders||[]).map(r => ({ ...r, incidentId:inc.incidentId, crisisType:inc.crisisType })));
  const logs = active.flatMap(inc => (inc.timeline||[]).map(t => ({ ...t, incidentId:inc.incidentId }))).sort((a,b) => new Date(b.timestamp)-new Date(a.timestamp)).slice(0,40);

  const updateTask = async (incidentId, staffId, status) => {
    const inc = incidents.find(i => i.incidentId === incidentId);
    if (!inc) return;
    await updateIncident(incidentId, {
      assignedResponders: inc.assignedResponders.map(r => r.staffId === staffId ? { ...r, taskStatus: status } : r),
      timelineEntry: { actor: user?.name, actorRole: user?.role, action: 'Task updated', details: `${staffId} → ${status}`, type: 'update' },
    });
    toast.success(`Updated: ${status}`);
  };

  const addLog = async () => {
    if (!logMsg.trim() || !active.length) return;
    await updateIncident(active[0].incidentId, { timelineEntry: { actor: user?.name, actorRole: user?.role, action: 'Log', details: logMsg, type: 'log' } });
    setLogMsg(''); toast.success('Logged');
  };

  return (
    <div>
      <div className="ph">
        <div className="ph-title"><div className="ph-icon"><i className="ri-team-line"></i></div><div><h2>Coordination</h2><div className="ph-sub">Tasks, staff status & action log</div></div></div>
        <span className="badge b-info">{active.length} Active</span>
      </div>
      <div className="coord">
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {/* Tasks */}
          <div className="card">
            <div className="card-h"><h3><i className="ri-task-line"></i> Tasks</h3><span style={{fontSize:11,color:'var(--text-4)'}}>{tasks.length}</span></div>
            <div>
              {tasks.length === 0 ? <div className="empty"><i className="ri-task-line"></i><h4>No tasks</h4><p>Auto-assigned when incidents dispatch</p></div> :
              tasks.map((t,i) => (
                <div className="task-row" key={i}>
                  <div className="task-icon"><i className={ICON[t.crisisType]||'ri-alert-line'} style={{color:'var(--red)'}}></i></div>
                  <div className="task-body">
                    <div className="task-name">{t.task}</div>
                    <div className="task-assignee">{t.name} ({t.role})</div>
                    <div className="task-ref">{t.incidentId}</div>
                  </div>
                  <span className={`task-badge tb-${t.taskStatus}`}>{t.taskStatus?.replace('_',' ')}</span>
                  <div className="task-actions">
                    {t.taskStatus !== 'en_route' && <button className="btn btn-ghost btn-sm" onClick={()=>updateTask(t.incidentId,t.staffId,'en_route')} title="En Route"><i className="ri-route-line"></i></button>}
                    {t.taskStatus !== 'on_scene' && <button className="btn btn-ghost btn-sm" onClick={()=>updateTask(t.incidentId,t.staffId,'on_scene')} title="On Scene"><i className="ri-map-pin-line"></i></button>}
                    {t.taskStatus !== 'completed' && <button className="btn btn-green btn-sm" onClick={()=>updateTask(t.incidentId,t.staffId,'completed')} title="Done"><i className="ri-check-line"></i></button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Log */}
          <div className="card">
            <div className="card-h"><h3><i className="ri-history-line"></i> Action Log</h3><div className="live"><span className="live-dot"></span>LIVE</div></div>
            <div className="log-list">
              {logs.length === 0 ? <div className="log-row"><span className="log-ts">--</span><span className="log-actor">SYSTEM</span><span className="log-msg">Coordination initialized</span></div> :
              logs.map((e,i) => (
                <div key={i} className="log-row"><span className="log-ts">{e.timestamp ? format(new Date(e.timestamp),'HH:mm:ss') : '--'}</span><span className="log-actor">{e.actor||'SYSTEM'}</span><span className="log-msg">[{e.incidentId}] {e.action}: {e.details}</span></div>
              ))}
            </div>
            <div style={{padding:'8px 16px',borderTop:'1px solid var(--border)',display:'flex',gap:6}}>
              <input className="fi" value={logMsg} onChange={e=>setLogMsg(e.target.value)} placeholder="Add log..." onKeyDown={e=>e.key==='Enter'&&addLog()} style={{flex:1,fontSize:12,padding:'6px 10px'}} />
              <button className="btn btn-secondary btn-sm" onClick={addLog}><i className="ri-add-line"></i></button>
            </div>
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {/* Staff */}
          <div className="card">
            <div className="card-h"><h3><i className="ri-user-star-line"></i> Staff Board</h3></div>
            <div className="staff-grid">
              {staff.map(s => (
                <div key={s.staffId} className={`staff-card ${s.status}`}>
                  <div className="sc-name">{s.name}</div>
                  <div className="sc-role">{s.role}</div>
                  <div className={`sc-st resp-st ${s.status}`}>{s.status === 'available' ? '● Available' : s.status === 'responding' ? '● Responding' : '○ Off Duty'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
