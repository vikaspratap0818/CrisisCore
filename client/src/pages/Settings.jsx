import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';
import { LogoIcon, LogoFull } from '../components/Logo';

const PROTOCOLS = [
  { icon:'ri-fire-line', title:'Fire', steps:['Activate alarm','Evacuate floor','Shut HVAC','Contact Fire Dept','Assembly point'] },
  { icon:'ri-heart-pulse-line', title:'Medical', steps:['Dispatch medical','Clear area','Call ambulance','Get AED','Await paramedics'] },
  { icon:'ri-shield-keyhole-line', title:'Security', steps:['Dispatch security','Lock zone','Contact police','Activate CCTV','Separate guests'] },
  { icon:'ri-windy-line', title:'Gas Leak', steps:['Evacuate zone','Shut gas','No ignition','Ventilate','Contact utility'] },
  { icon:'ri-shake-hands-line', title:'Earthquake', steps:['Drop, Cover, Hold','Wait for shaking','Check injuries','Assess structure','Evac decision'] },
  { icon:'ri-flashlight-line', title:'Power Out', steps:['Activate generator','Check lighting','Staff stairwells','Guest comms','Contact utility'] },
];

export default function Settings() {
  const { user, changePassword } = useApp();
  const [settings, setSettings] = useState({
    audioAlerts: true, desktopNotifs: true, autoEscalate: true,
    aiClassify: true, aiRecommend: true, gdpr: true,
    venueName: 'Grand Horizon Hotel & Resort',
    fireDept: '+1 (555) 911-0001', police: '+1 (555) 911-0002', ambulance: '+1 (555) 911-0003',
    aiSensitivity: 'medium', retention: '90days',
  });
  const [pw, setPw] = useState({ current: '', next: '' });
  const toggle = k => setSettings(s => ({ ...s, [k]: !s[k] }));

  const savePw = async () => {
    if (!pw.current || !pw.next) { toast.error('Fill both fields'); return; }
    const r = await changePassword(pw.current, pw.next);
    if (r?.success) setPw({ current: '', next: '' });
  };

  const GROUPS = [
    { title:'Alerts', icon:'ri-notification-3-line', cls:'', items:[
      { key:'audioAlerts', label:'Audio Alerts', desc:'Play sound on critical incidents' },
      { key:'desktopNotifs', label:'Desktop Notifications', desc:'Browser push' },
      { key:'autoEscalate', label:'Auto-Escalation', desc:'Escalate if no response in 5 min' },
    ]},
    { title:'AI', icon:'ri-robot-line', cls:'blue', items:[
      { key:'aiClassify', label:'Auto-Classification', desc:'AI classifies crisis type' },
      { key:'aiRecommend', label:'AI Recommendations', desc:'Suggest protocols' },
    ], extras:[{ label:'Sensitivity', key:'aiSensitivity', options:[{value:'high',label:'High'},{value:'medium',label:'Medium'},{value:'low',label:'Low'}] }] },
    { title:'Compliance', icon:'ri-shield-check-line', cls:'green', items:[
      { key:'gdpr', label:'GDPR Logging', desc:'Anonymize PII after 30 days' },
    ], extras:[{ label:'Data Retention', key:'retention', options:[{value:'30days',label:'30 days'},{value:'90days',label:'90 days'},{value:'1year',label:'1 year'}] }] },
  ];

  return (
    <div>
      <div className="ph">
        <div className="ph-title"><div className="ph-icon"><i className="ri-settings-4-line"></i></div><div><h2>Settings</h2><div className="ph-sub">Platform config, compliance & protocols</div></div></div>
        <div className="ph-actions">
          <button className="btn btn-primary btn-sm" onClick={()=>toast.success('Settings saved')}><i className="ri-save-line"></i> Save</button>
        </div>
      </div>

      <div className="settings">
        {/* Venue */}
        <div className="set-card">
          <div className="set-head"><div className="set-icon"><i className="ri-building-2-line"></i></div><h3>Venue</h3></div>
          <div className="set-body">
            {[['Hotel Name','venueName','text'],['Fire Dept','fireDept','tel'],['Police','police','tel'],['Ambulance','ambulance','tel']].map(([l,k,t])=>(
              <div className="fg" key={k}><label className="fl">{l}</label><input className="fi" type={t} value={settings[k]} onChange={e=>setSettings(s=>({...s,[k]:e.target.value}))} /></div>
            ))}
          </div>
        </div>

        {/* Profile / Password */}
        <div className="set-card">
          <div className="set-head"><div className="set-icon purple"><i className="ri-user-settings-line"></i></div><h3>Profile</h3></div>
          <div className="set-body">
            <div className="set-row"><div><div className="set-label">Name</div></div><span style={{fontWeight:600}}>{user?.name}</span></div>
            <div className="set-row"><div><div className="set-label">Role</div></div><span style={{textTransform:'capitalize'}}>{user?.role}</span></div>
            <div className="set-row"><div><div className="set-label">Staff ID</div></div><span style={{fontFamily:'JetBrains Mono',fontSize:12}}>{user?.staffId}</span></div>
            <div style={{borderTop:'1px solid var(--border)',paddingTop:12,marginTop:8}}>
              <div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Change Password</div>
              <div className="fg"><input className="fi" type="password" placeholder="Current password" value={pw.current} onChange={e=>setPw(p=>({...p,current:e.target.value}))} /></div>
              <div className="fg"><input className="fi" type="password" placeholder="New password (min 6)" value={pw.next} onChange={e=>setPw(p=>({...p,next:e.target.value}))} /></div>
              <button className="btn btn-secondary btn-sm" onClick={savePw}><i className="ri-lock-2-line"></i> Update Password</button>
            </div>
          </div>
        </div>

        {/* Toggle groups */}
        {GROUPS.map(g => (
          <div className="set-card" key={g.title}>
            <div className="set-head"><div className={`set-icon ${g.cls}`}><i className={g.icon}></i></div><h3>{g.title}</h3></div>
            <div className="set-body">
              {g.items.map(item => (
                <div className="set-row" key={item.key}>
                  <div><div className="set-label">{item.label}</div><div className="set-desc">{item.desc}</div></div>
                  <label className="toggle"><input type="checkbox" checked={settings[item.key]} onChange={()=>toggle(item.key)} /><span className="toggle-slider"></span></label>
                </div>
              ))}
              {g.extras?.map(ex => (
                <div className="fg" key={ex.key} style={{marginTop:10}}><label className="fl">{ex.label}</label><select className="fi" value={settings[ex.key]} onChange={e=>setSettings(s=>({...s,[ex.key]:e.target.value}))}>{ex.options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
              ))}
            </div>
          </div>
        ))}

        {/* System Info */}
        <div className="set-card">
          <div className="set-head">
            <LogoIcon size={28} />
            <h3>System Info</h3>
          </div>
          <div className="set-body">
            {[['Platform','CrisisCore v1.0'],['AI Engine','CrisisCore Classifier v2'],['Real-time','Socket.IO v4.7'],['Database','MongoDB'],['Auth','JWT + bcrypt'],['Compliance','GDPR Ready']].map(([l,v])=>(
              <div className="set-row" key={l}><span style={{fontSize:12,color:'var(--text-4)'}}>{l}</span><span style={{fontSize:12,fontWeight:600}}>{v}</span></div>
            ))}
          </div>
        </div>
      </div>

      {/* Protocols */}
      <div className="card" style={{marginTop:16}}>
        <div className="card-h"><h3><i className="ri-first-aid-kit-line"></i> Emergency Protocols</h3></div>
        <div style={{padding:14,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:10}}>
          {PROTOCOLS.map(p => (
            <div key={p.title} style={{background:'var(--bg-3)',borderRadius:6,padding:12,border:'1px solid var(--border)'}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                <div className="safety-icon"><i className={p.icon}></i></div>
                <span style={{fontWeight:700,fontSize:12}}>{p.title}</span>
              </div>
              {p.steps.map((s,i)=><div key={i} style={{fontSize:11,color:'var(--text-3)',marginBottom:3,display:'flex',gap:4}}><span style={{color:'var(--red)',fontWeight:700}}>{i+1}.</span>{s}</div>)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
