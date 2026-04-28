import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const CHANNELS = [
  { id:'all', icon:'ri-broadcast-line', label:'All Staff' },
  { id:'security', icon:'ri-shield-user-line', label:'Security' },
  { id:'medical', icon:'ri-heart-pulse-line', label:'Medical' },
  { id:'management', icon:'ri-briefcase-line', label:'Management' },
  { id:'guests', icon:'ri-hotel-line', label:'Guests' },
  { id:'emergency-services', icon:'ri-alarm-warning-line', label:'Emergency Svc' },
];

const TEMPLATES = {
  evacuation: { icon:'ri-run-line', label:'Evacuation', text:'EVACUATION IN PROGRESS. Proceed via nearest stairwell. Do NOT use elevators.' },
  shelter: { icon:'ri-home-line', label:'Shelter In Place', text:'SHELTER IN PLACE. Remain in your room. Lock door. Await all-clear.' },
  allclear: { icon:'ri-checkbox-circle-line', label:'All Clear', text:'ALL CLEAR. Emergency resolved. Normal operations resumed.' },
  lockdown: { icon:'ri-lock-2-line', label:'Lockdown', text:'LOCKDOWN. Stay in current location. Lock doors. Await instructions.' },
};

export default function Communications() {
  const { messages, sendMessage, sendGuestAlert, guestDistressSignals, user } = useApp();
  const [ch, setCh] = useState('all');
  const [msg, setMsg] = useState('');
  const [priority, setPriority] = useState('normal');
  const [guestZone, setGuestZone] = useState('All Guests');
  const [guestMsg, setGuestMsg] = useState('');
  const endRef = useRef(null);
  const channelMsgs = messages[ch] || [];
  const chInfo = CHANNELS.find(c => c.id === ch);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [channelMsgs]);

  const send = async () => { if (!msg.trim()) return; await sendMessage({ channel: ch, content: msg, priority }); setMsg(''); };
  const sendGuest = async () => { if (!guestMsg.trim()) { toast.error('Enter message'); return; } await sendGuestAlert({ zone: guestZone, message: guestMsg, channels: ['sms','in-app'] }); toast.success('Sent'); setGuestMsg(''); };

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 56px - 80px)'}}>
      <div className="ph">
        <div className="ph-title"><div className="ph-icon"><i className="ri-message-3-line"></i></div><div><h2>Communications</h2><div className="ph-sub">Multi-channel messaging</div></div></div>
      </div>
      <div className="comms" style={{flex:1}}>
        {/* Sidebar */}
        <div className="comms-sb">
          <div className="ch-label">Channels</div>
          {CHANNELS.map(c => (
            <button key={c.id} className={`ch-btn${ch===c.id?' active':''}`} onClick={()=>setCh(c.id)}>
              <i className={c.icon}></i><span className="ch-name">{c.label}</span>
              {(messages[c.id]?.length||0)>0 && <span className="ch-count">{messages[c.id].length}</span>}
            </button>
          ))}
          <div className="ch-label" style={{marginTop:12}}>Templates</div>
          {Object.entries(TEMPLATES).map(([k,t]) => (
            <button key={k} className="tpl-btn" onClick={()=>{setMsg(t.text);if(k!=='allclear')setPriority('urgent');}}><i className={t.icon}></i>{t.label}</button>
          ))}
        </div>

        {/* Chat */}
        <div className="chat">
          <div className="chat-head">
            <div className="chat-name"><i className={chInfo?.icon}></i>{chInfo?.label}</div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}><div className="live"><span className="live-dot"></span>LIVE</div><span style={{fontSize:11,color:'var(--text-4)'}}>{channelMsgs.length} msgs</span></div>
          </div>
          <div className="chat-msgs">
            <div className="msg sys"><div className="msg-bubble">Messages are logged in the audit trail.</div></div>
            {channelMsgs.map((m,i) => {
              const me = m.senderId===user?.staffId||m.sender===user?.name;
              return (
                <div key={m._id||i} className={`msg ${me?'me':m.isSystemMsg?'sys':'them'}`}>
                  {!me&&!m.isSystemMsg&&<div className="msg-meta"><span className="msg-sender">{m.sender}</span><span>{m.senderRole}</span><span>{m.createdAt?format(new Date(m.createdAt),'HH:mm'):'--'}</span></div>}
                  <div className="msg-bubble">{m.content}</div>
                  {me&&<div className="msg-meta" style={{justifyContent:'flex-end'}}><span>{m.createdAt?format(new Date(m.createdAt),'HH:mm'):'--'}</span></div>}
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          <div className="chat-input">
            <select className="fi" value={priority} onChange={e=>setPriority(e.target.value)} style={{width:90,padding:'6px 8px',fontSize:11}}>
              <option value="normal">Normal</option><option value="urgent">Urgent</option><option value="critical">Critical</option>
            </select>
            <textarea className="fi" value={msg} onChange={e=>setMsg(e.target.value)} placeholder={`Message ${chInfo?.label}...`} rows="2" onKeyDown={e=>{if(e.ctrlKey&&e.key==='Enter')send();}} />
            <button className="btn btn-primary" onClick={send}><i className="ri-send-plane-fill"></i></button>
          </div>
        </div>

        {/* Distress */}
        <div className="distress-panel">
          <div className="card-h" style={{flexShrink:0}}><h3 style={{fontSize:12}}><i className="ri-alarm-warning-line"></i> Distress</h3>{guestDistressSignals.length>0&&<span className="sb-badge">{guestDistressSignals.length}</span>}</div>
          <div className="distress-list">
            {guestDistressSignals.length===0 ? <div className="empty" style={{padding:'20px 10px'}}><i className="ri-checkbox-circle-line"></i><p style={{fontSize:11}}>No signals</p></div> :
            guestDistressSignals.map((s,i) => (
              <div className="distress-card" key={i} onClick={()=>{setMsg(`Responding to Room ${s.roomNumber} distress.`);setCh('all');setPriority('critical');}}>
                <div style={{display:'flex',justifyContent:'space-between'}}><div className="distress-room"><i className="ri-alarm-warning-fill"></i>Room {s.roomNumber}</div><span className="distress-time">{s.timestamp?format(new Date(s.timestamp),'HH:mm'):'--'}</span></div>
                <div className="distress-info">{s.peopleCount||1} person(s)</div>
                {s.message&&<div className="distress-info">"{s.message}"</div>}
              </div>
            ))}
          </div>
          <div className="guest-composer">
            <div className="gc-title"><i className="ri-megaphone-line"></i>Guest Broadcast</div>
            <select className="fi" value={guestZone} onChange={e=>setGuestZone(e.target.value)} style={{marginBottom:6,fontSize:12,padding:'5px 8px'}}><option>All Guests</option><option>Floor 4</option><option>Pool Area</option></select>
            <textarea className="fi" value={guestMsg} onChange={e=>setGuestMsg(e.target.value)} placeholder="Message to guests..." rows="2" style={{marginBottom:6,fontSize:12}} />
            <button className="btn btn-primary btn-sm btn-full" onClick={sendGuest}><i className="ri-send-plane-line"></i> Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
