import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogoIcon } from '../components/Logo';

const DISPATCH = { fire:['Security','Engineering','Front Desk','Fire Dept'], medical:['Medical','Security','Front Desk','EMS'], security:['Security','Management','Police'], gas:['Engineering','Security','Medical','Fire Dept'], earthquake:['All Staff','Medical','Security','Fire Dept','Police','EMS'], power:['Engineering','Front Desk'], other:['Management','Security'] };
const DEPT_ICON = { Security:'ri-shield-user-line', Engineering:'ri-tools-line', 'Front Desk':'ri-customer-service-2-line', Management:'ri-briefcase-line', 'All Staff':'ri-team-line', 'Fire Dept':'ri-fire-line', Medical:'ri-heart-pulse-line', EMS:'ri-hospital-line', Police:'ri-police-car-line' };

const QUICK = {
  fire:{ text:'Smoke from Room 412 on 4th floor. Fire alarm triggered.', room:'412', floor:'4', zone:'Floor 4 - Wing B' },
  medical:{ text:'Guest collapsed in lobby, unresponsive. Approx 60yo.', room:'', floor:'G', zone:'Main Lobby' },
  security:{ text:'Aggressive individual threatening guests near pool area.', room:'', floor:'G', zone:'Pool Area' },
  gas:{ text:'Gas leak in kitchen. Strong gas smell.', room:'', floor:'B1', zone:'Kitchen' },
  earthquake:{ text:'Earthquake. Guests panicking on multiple floors.', room:'', floor:'ALL', zone:'Entire Venue' },
  power:{ text:'Complete power outage. Backup generator not activating.', room:'', floor:'ALL', zone:'Entire Venue' },
};

export default function ReportIncident() {
  const { createIncident, classifyWithAI, user } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [dispatched, setDispatched] = useState(null);
  const [form, setForm] = useState({ crisisType:'', severity:'critical', floor:'G', room:'', zone:'', description:'', reportedBy:user?.name||'', peopleAffected:'' });

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleAI = async () => {
    if(!aiText.trim()){ toast.error('Describe the emergency'); return; }
    setAiLoading(true);
    const r = await classifyWithAI(aiText);
    setAiLoading(false);
    if(r){ setAiResult(r); set('crisisType',r.crisisType||''); set('severity',r.severity||'critical'); set('description',aiText);
      if(r.location){ set('floor',r.location.floor||form.floor); set('room',r.location.room||''); set('zone',r.location.zone||''); }
      toast.success(`AI: ${r.crisisType?.toUpperCase()} · ${Math.round((r.confidence||0)*100)}%`); }
  };

  const quick = type => { const s=QUICK[type]; if(!s)return; setAiText(s.text); set('crisisType',type); set('severity','critical'); set('floor',s.floor); set('room',s.room); set('zone',s.zone); set('description',s.text); };

  const handleDispatch = async () => {
    if(!form.crisisType){ toast.error('Select crisis type'); return; }
    if(!form.description){ toast.error('Add description'); return; }
    setLoading(true);
    const r = await createIncident({ crisisType:form.crisisType, severity:form.severity, location:{ floor:form.floor, room:form.room, zone:form.zone }, description:form.description, reportedBy:form.reportedBy||user?.name, reportedByRole:user?.role, peopleAffected:parseInt(form.peopleAffected)||0, rawInput:aiText||undefined });
    setLoading(false);
    if(r?.success){ setDispatched(r); toast.success(`Dispatched: ${r.data.incidentId}`); }
  };

  if(dispatched) return (
    <div>
      <div className="ph">
        <div className="ph-title"><div className="ph-icon" style={{background:'var(--green-soft)'}}><i className="ri-checkbox-circle-line" style={{color:'var(--green)'}}></i></div><div><h2>Dispatched</h2><div className="ph-sub">Incident created & responders notified</div></div></div>
      </div>
      <div className="card" style={{maxWidth:640,margin:'0 auto'}}>
        <div className="card-h"><h3><i className="ri-alarm-warning-fill"></i>{dispatched.data.incidentId}</h3><span className={`badge b-${dispatched.data.severity}`}>{dispatched.data.severity}</span></div>
        <div className="card-b">
          <div className="info-grid" style={{gridTemplateColumns:'1fr 1fr'}}>
            {[['Type',dispatched.data.crisisType?.toUpperCase()],['Location',`${dispatched.data.location?.zone||''} ${dispatched.data.location?.room?'Rm '+dispatched.data.location.room:''}`.trim()||'--'],['Reporter',dispatched.data.reportedBy],['Responders',dispatched.data.assignedResponders?.length||0]].map(([l,v])=>(
              <div className="info-cell" key={l}><div className="info-cell-l">{l}</div><div className="info-cell-v">{v}</div></div>
            ))}
          </div>
          <div style={{display:'flex',gap:8,marginTop:16}}>
            <button className="btn btn-primary" onClick={()=>navigate('/dashboard')}><i className="ri-dashboard-3-line"></i> Dashboard</button>
            <button className="btn btn-secondary" onClick={()=>navigate('/coordination')}><i className="ri-team-line"></i> Coordination</button>
            <button className="btn btn-ghost" onClick={()=>{setDispatched(null);setAiText('');setAiResult(null);setForm({crisisType:'',severity:'critical',floor:'G',room:'',zone:'',description:'',reportedBy:user?.name||'',peopleAffected:''});}}><i className="ri-add-line"></i> New</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="ph">
        <div className="ph-title"><div className="ph-icon"><i className="ri-alarm-warning-line"></i></div><div><h2>Report Emergency</h2><div className="ph-sub">AI classification · Instant dispatch</div></div></div>
        <span className="badge b-info"><i className="ri-robot-line"></i> AI Active</span>
      </div>

      {/* AI */}
      <div className="ai-card">
        <div className="ai-head">
          <LogoIcon size={40} />
          <div><div className="ai-title">CrisisCore AI Detection</div><div className="ai-sub">Describe in plain language — AI classifies instantly</div></div>
        </div>
        <div className="ai-input">
          <textarea className="fi" value={aiText} onChange={e=>setAiText(e.target.value)} placeholder="e.g. 'Smoke from Room 412' or 'Guest collapsed in lobby'..." rows="3" onKeyDown={e=>{if(e.ctrlKey&&e.key==='Enter')handleAI();}} />
          <button className="btn btn-blue" onClick={handleAI} disabled={aiLoading} style={{alignSelf:'stretch',minWidth:100}}>
            {aiLoading?<><span className="spinner"></span> ...</>:<><i className="ri-flashlight-line"></i> Analyze</>}
          </button>
        </div>
        <div className="ai-triggers">
          {[['fire','ri-fire-line','Fire','t-fire'],['medical','ri-heart-pulse-line','Medical','t-medical'],['security','ri-shield-keyhole-line','Security','t-security'],['gas','ri-windy-line','Gas','t-gas'],['earthquake','ri-shake-hands-line','Earthquake','t-quake'],['power','ri-flashlight-line','Power','t-power']].map(([t,ic,lb,cls])=>(
            <button key={t} className={`trigger ${cls}`} onClick={()=>quick(t)}><i className={ic}></i>{lb}</button>
          ))}
        </div>
        {aiResult && (
          <div className="ai-result fade-in">
            <div className="ai-result-head">
              <span className="ai-result-label"><i className="ri-robot-line"></i> AI Result</span>
              <span className="ai-conf">{Math.round(aiResult.confidence*100)}%</span>
            </div>
            <div className="ai-grid">
              <div><label>Type</label><div className="val" style={{color:'var(--red)'}}>{aiResult.crisisType}</div></div>
              <div><label>Severity</label><div className="val"><span className={`badge b-${aiResult.severity}`}>{aiResult.severity}</span></div></div>
              <div><label>Evacuate</label><div className="val" style={{color:aiResult.shouldEvacuate?'var(--red)':'var(--green)'}}>{aiResult.shouldEvacuate?'Yes':'No'}</div></div>
            </div>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="card">
        <div className="card-h"><h3><i className="ri-file-list-3-line"></i> Details</h3></div>
        <div className="card-b">
          <div className="form-row">
            <div className="fg"><label className="fl">Crisis Type *</label><select className="fi" value={form.crisisType} onChange={e=>set('crisisType',e.target.value)}><option value="">Select</option><option value="fire">Fire / Smoke</option><option value="medical">Medical</option><option value="security">Security</option><option value="gas">Gas Leak</option><option value="earthquake">Earthquake</option><option value="power">Power Out</option><option value="flood">Flood</option><option value="structural">Structural</option><option value="other">Other</option></select></div>
            <div className="fg"><label className="fl">Severity *</label><select className="fi" value={form.severity} onChange={e=>set('severity',e.target.value)}><option value="critical">Critical</option><option value="high">High</option><option value="moderate">Moderate</option><option value="low">Low</option></select></div>
            <div className="fg"><label className="fl">Floor</label><select className="fi" value={form.floor} onChange={e=>set('floor',e.target.value)}>{['B1','G','1','2','3','4','5','6','7','8','9','10','11','12','ALL'].map(f=><option key={f} value={f}>{f==='B1'?'Basement':f==='G'?'Ground':f==='ALL'?'All':`Floor ${f}`}</option>)}</select></div>
            <div className="fg"><label className="fl">Room / Area</label><input className="fi" value={form.room} onChange={e=>set('room',e.target.value)} placeholder="412, Lobby..." /></div>
            <div className="fg form-full"><label className="fl">Zone</label><input className="fi" value={form.zone} onChange={e=>set('zone',e.target.value)} placeholder="East Wing, Pool Area..." /></div>
            <div className="fg form-full"><label className="fl">Description *</label><textarea className="fi" value={form.description} onChange={e=>set('description',e.target.value)} rows="3" placeholder="What happened..." /></div>
            <div className="fg"><label className="fl">Reported By</label><input className="fi" value={form.reportedBy} onChange={e=>set('reportedBy',e.target.value)} /></div>
            <div className="fg"><label className="fl">People Affected</label><input className="fi" type="number" value={form.peopleAffected} onChange={e=>set('peopleAffected',e.target.value)} min="0" placeholder="0" /></div>
          </div>
          {form.crisisType && (
            <div style={{marginTop:12,padding:'10px 12px',background:'var(--bg-3)',borderRadius:6}}>
              <div style={{fontSize:11,color:'var(--text-4)',marginBottom:6,display:'flex',alignItems:'center',gap:4}}><i className="ri-send-plane-line" style={{color:'var(--red)'}}></i> Auto-dispatching to:</div>
              <div className="tags">{(DISPATCH[form.crisisType]||DISPATCH.other).map(p=><span className="tag" key={p}><i className={DEPT_ICON[p]||'ri-team-line'}></i>{p}</span>)}</div>
            </div>
          )}
          <div style={{display:'flex',gap:8,marginTop:16}}>
            <button className="dispatch" onClick={handleDispatch} disabled={loading}>
              {loading?<><span className="spinner"></span> Dispatching...</>:<><i className="ri-alarm-warning-fill"></i> DISPATCH ALERT</>}
            </button>
            <button className="btn btn-ghost" onClick={()=>navigate('/dashboard')}><i className="ri-arrow-left-line"></i> Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
