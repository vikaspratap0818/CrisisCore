import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { LogoFull } from '../components/Logo';

const SAFETY = [
  { icon:'ri-fire-line', title:'Fire', steps:['Pull nearest alarm','Use stairways only','Close doors behind you','Go to assembly point','Signal from window if trapped'] },
  { icon:'ri-heart-pulse-line', title:'Medical', steps:['Press SOS above','Don\'t move injured','Staff arrive in 3 min','AED every 3rd floor','Stay calm'] },
  { icon:'ri-shake-hands-line', title:'Earthquake', steps:['Drop, Cover, Hold','Stay from windows','No elevators after','Await instructions','Check yourself & others'] },
  { icon:'ri-shield-keyhole-line', title:'Security', steps:['Stay in room, lock door','Don\'t open to strangers','Away from windows','Use SOS button','Await all-clear'] },
];

export default function GuestPortal() {
  const { user, logout, sendDistressSignal, hotelAlerts } = useApp();
  const [sosSent, setSosSent] = useState(false);
  const [form, setForm] = useState({ type:'fire', desc:'', count:1 });
  const [reported, setReported] = useState(false);

  const sos = async () => {
    if (sosSent) return; setSosSent(true);
    await sendDistressSignal({ roomNumber: user?.roomNumber, message: `SOS from Room ${user?.roomNumber}` });
    toast.error(`SOS sent! Help coming to Room ${user?.roomNumber}`, { duration: 12000 });
    setTimeout(() => setSosSent(false), 30000);
  };

  const report = async () => {
    await sendDistressSignal({ roomNumber: user?.roomNumber, peopleCount: form.count, crisisType: form.type, message: form.desc });
    setReported(true); toast.success('Reported. Staff responding.');
  };

  return (
    <div className="guest">
      <div className="guest-top">
        <div className="guest-brand"><LogoFull height={32} /></div>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          <div className="guest-room"><i className="ri-hotel-bed-line"></i>Room {user?.roomNumber}</div>
          <button className="btn btn-ghost btn-sm" onClick={logout}><i className="ri-logout-box-r-line"></i></button>
        </div>
      </div>

      <div className="guest-body">
        {/* SOS */}
        <div className="sos-section">
          <div className="sos-title">Emergency Assistance</div>
          <div className="sos-sub">Tap to alert hotel security for Room {user?.roomNumber}</div>
          <div className="sos-wrap">
            {!sosSent && <><div className="sos-ring"></div><div className="sos-ring r2"></div></>}
            <button className={`sos-big${sosSent?' sent':''}`} onClick={sos} disabled={sosSent}>
              <i className={sosSent?'ri-checkbox-circle-line':'ri-alarm-warning-fill'}></i>
              <span>{sosSent?'SENT':'SOS'}</span>
            </button>
          </div>
          <p className="sos-hint">{sosSent ? 'Signal sent. Security is responding.' : 'One tap — connects directly to security.'}</p>
        </div>

        {/* Alerts */}
        <div className="gsection">
          <div className="gsection-h"><i className="ri-broadcast-line"></i>Hotel Alerts{hotelAlerts.length > 0 && <span className="sb-badge" style={{marginLeft:6}}>{hotelAlerts.length}</span>}</div>
          <div className="gsection-b">
            {hotelAlerts.length === 0 ? (
              <div style={{textAlign:'center',padding:'16px',color:'var(--text-4)',fontSize:13}}><i className="ri-checkbox-circle-line" style={{fontSize:20,color:'var(--green)',display:'block',marginBottom:4}}></i>No active alerts. Hotel operating normally.</div>
            ) : hotelAlerts.map((a,i) => (
              <div key={i} style={{padding:10,background:'var(--red-soft)',border:'1px solid rgba(239,68,68,.2)',borderRadius:6,marginBottom:6}}>
                <div style={{fontSize:11,color:'var(--red)',fontWeight:700,marginBottom:3}}><i className="ri-alarm-warning-fill"></i> ALERT</div>
                <div style={{fontSize:13}}>{a.message}</div>
                <div style={{fontSize:10,color:'var(--text-4)',marginTop:3}}>{a.sentAt?format(new Date(a.sentAt),'HH:mm'):'--'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Report */}
        <div className="gsection">
          <div className="gsection-h"><i className="ri-alarm-warning-line"></i>Report Emergency</div>
          <div className="gsection-b">
            {reported ? (
              <div style={{textAlign:'center',padding:20}}>
                <i className="ri-checkbox-circle-fill" style={{fontSize:32,color:'var(--green)',display:'block',marginBottom:8}}></i>
                <div style={{fontWeight:700,marginBottom:6}}>Reported</div>
                <p style={{fontSize:13,color:'var(--text-3)'}}>Staff responding. Stay calm.</p>
                <button className="btn btn-secondary btn-sm" style={{marginTop:10}} onClick={()=>setReported(false)}><i className="ri-add-line"></i> Another</button>
              </div>
            ) : (
              <>
                <div className="fg"><label className="fl">Type</label><select className="fi" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}><option value="fire">Fire / Smoke</option><option value="medical">Medical</option><option value="security">Security</option><option value="gas">Gas Smell</option><option value="other">Other</option></select></div>
                <div className="fg"><label className="fl">Description</label><textarea className="fi" value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} placeholder="What happened?" rows="3" /></div>
                <div className="fg"><label className="fl">People needing help</label><input className="fi" type="number" value={form.count} onChange={e=>setForm(f=>({...f,count:parseInt(e.target.value)||1}))} min="1" /></div>
                <button className="btn btn-primary btn-full" onClick={report}><i className="ri-send-plane-fill"></i> Report</button>
              </>
            )}
          </div>
        </div>

        {/* Safety */}
        <div className="gsection">
          <div className="gsection-h"><i className="ri-shield-check-line"></i>Safety Guide</div>
          <div className="gsection-b">
            <div className="safety-grid">
              {SAFETY.map(c => (
                <div className="safety-card" key={c.title}>
                  <div className="safety-head"><div className="safety-icon"><i className={c.icon}></i></div><div className="safety-title">{c.title}</div></div>
                  <ul>{c.steps.map((s,i) => <li key={i}>{s}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
