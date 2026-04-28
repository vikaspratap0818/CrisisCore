import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const FLOORS = [
  { id:'B1', label:'Basement' }, { id:'G', label:'Ground' }, { id:'1', label:'Floor 1' },
  { id:'2', label:'Floor 2' }, { id:'3', label:'Floor 3' }, { id:'4', label:'Floor 4' },
  { id:'5', label:'Floor 5' }, { id:'6', label:'Floor 6' }, { id:'7', label:'Floor 7' },
  { id:'8', label:'Floor 8' }, { id:'12', label:'Penthouse' }, { id:'pool', label:'Pool / Spa' },
];

const EVAC = {
  G: ['North Exit → Parking Assembly', 'South Exit → Street Assembly'],
  '4': ['Stairwell A → Ground → North Exit', 'Stairwell B → Ground → South Exit'],
  pool: ['Pool Gate West → Parking → Street'],
  default: ['Nearest stairwell → Main Entrance'],
};

const ZONES = {
  G: ['Main Lobby', 'Front Desk', 'Restaurant', 'Bar', 'Gift Shop'],
  '4': ['Rooms 401-420', 'Rooms 421-440', 'Corridor', 'Stairwell A'],
  pool: ['Main Pool', 'Jacuzzi', 'Pool Bar', 'Cabanas'],
};

export default function FloorMap() {
  const { incidents, staff } = useApp();
  const [floor, setFloor] = useState('G');
  const canvasRef = useRef(null);
  const active = incidents.filter(i => i.status !== 'resolved' && i.status !== 'false_alarm');
  const floorInc = active.filter(i => i.location?.floor === floor || (floor === 'pool' && i.location?.zone?.toLowerCase().includes('pool')));

  useEffect(() => { draw(); }, [floor, incidents, staff]);

  const draw = () => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d');
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0b0f19'; ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,.03)'; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Rooms
    const rooms = getRooms(floor, W, H);
    rooms.forEach(rm => {
      ctx.fillStyle = rm.color || 'rgba(255,255,255,.03)';
      ctx.strokeStyle = rm.border || 'rgba(255,255,255,.06)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(rm.x, rm.y, rm.w, rm.h, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.font = '10px Inter'; ctx.textAlign = 'center';
      ctx.fillText(rm.label, rm.x + rm.w / 2, rm.y + rm.h / 2 + 3);
    });

    // Incidents
    floorInc.forEach((inc, i) => {
      const x = 160 + (i % 3) * 140, y = 80 + Math.floor(i / 3) * 90;
      const col = inc.severity === 'critical' ? '#ef4444' : inc.severity === 'high' ? '#f97316' : '#eab308';
      ctx.fillStyle = col + '33'; ctx.beginPath(); ctx.arc(x, y, 24, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 8px Inter'; ctx.textAlign = 'center';
      ctx.fillText(inc.crisisType?.slice(0, 4).toUpperCase(), x, y + 3);
      ctx.fillStyle = col; ctx.font = '8px JetBrains Mono'; ctx.fillText(inc.incidentId, x, y + 22);
    });

    // Responders
    staff.filter(s => s.status === 'responding').slice(0, 4).forEach((s, i) => {
      const x = 40 + i * 110, y = H - 35;
      ctx.fillStyle = '#8b5cf6'; ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 7px Inter'; ctx.textAlign = 'center';
      ctx.fillText(s.name?.split(' ').map(n => n[0]).join('') || '?', x, y + 2.5);
    });
  };

  const getRooms = (f, W, H) => {
    if (f === 'G') return [
      { x: 30, y: 30, w: 180, h: 100, label: 'Main Lobby', color: 'rgba(59,130,246,.06)', border: 'rgba(59,130,246,.15)' },
      { x: 220, y: 30, w: 120, h: 70, label: 'Front Desk', color: 'rgba(20,184,166,.06)', border: 'rgba(20,184,166,.15)' },
      { x: 30, y: 140, w: 200, h: 100, label: 'Restaurant', color: 'rgba(139,92,246,.04)', border: 'rgba(139,92,246,.1)' },
      { x: 350, y: 30, w: 60, h: 210, label: 'Lifts', color: 'rgba(255,255,255,.02)', border: 'rgba(255,255,255,.05)' },
      { x: 420, y: 30, w: 160, h: 100, label: 'Conference', color: 'rgba(59,130,246,.04)', border: 'rgba(59,130,246,.1)' },
      { x: 420, y: 140, w: 75, h: 70, label: 'Medical', color: 'rgba(20,184,166,.06)', border: 'rgba(20,184,166,.15)' },
      { x: 505, y: 140, w: 75, h: 70, label: 'Shop', color: 'rgba(255,255,255,.02)', border: 'rgba(255,255,255,.05)' },
    ];
    if (f === 'pool') return [
      { x: 40, y: 30, w: 260, h: 170, label: 'Main Pool', color: 'rgba(59,130,246,.1)', border: 'rgba(59,130,246,.2)' },
      { x: 320, y: 30, w: 110, h: 80, label: 'Jacuzzi', color: 'rgba(20,184,166,.08)', border: 'rgba(20,184,166,.15)' },
      { x: 320, y: 120, w: 110, h: 60, label: 'Pool Bar', color: 'rgba(139,92,246,.05)', border: 'rgba(139,92,246,.1)' },
      { x: 40, y: 210, w: 170, h: 60, label: 'Cabanas', color: 'rgba(255,255,255,.02)', border: 'rgba(255,255,255,.05)' },
    ];
    const rooms = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      const n = parseInt(f) * 100 + r * 4 + c + 1;
      rooms.push({ x: 30 + c * 130, y: 30 + r * 100, w: 110, h: 75, label: `Rm ${n}`, color: 'rgba(255,255,255,.02)', border: 'rgba(255,255,255,.05)' });
    }
    return rooms;
  };

  const evac = EVAC[floor] || EVAC.default;
  const zones = ZONES[floor] || [];

  return (
    <div>
      <div className="ph">
        <div className="ph-title"><div className="ph-icon"><i className="ri-map-2-line"></i></div><div><h2>Floor Map</h2><div className="ph-sub">Live overlay · Evacuation routes</div></div></div>
        {floorInc.length > 0 && <span className="badge b-critical"><i className="ri-alarm-warning-fill"></i> {floorInc.length} alert(s)</span>}
      </div>
      <div className="fmap">
        <div className="card">
          <div className="card-h"><h3><i className="ri-layout-grid-line"></i> Floors</h3></div>
          <div className="floor-list">
            {FLOORS.map(fl => {
              const has = active.some(i => i.location?.floor === fl.id);
              return <button key={fl.id} className={`floor-btn${floor === fl.id ? ' active' : ''}${has ? ' has-inc' : ''}`} onClick={() => setFloor(fl.id)}>{fl.label}{has && <span className="floor-dot"></span>}</button>;
            })}
          </div>
        </div>
        <div className="card">
          <div className="card-h"><h3><i className="ri-map-2-line"></i> {FLOORS.find(f => f.id === floor)?.label}</h3>{floorInc.length > 0 && <div className="live"><span className="live-dot"></span>{floorInc.length}</div>}</div>
          <div style={{padding:8}}><canvas ref={canvasRef} width={600} height={300} style={{width:'100%',display:'block'}} /></div>
          <div className="evac">
            <div className="evac-title"><i className="ri-door-open-line"></i> Evacuation</div>
            {evac.map((r, i) => <div className="evac-route" key={i}><i className="ri-arrow-right-line"></i>{r}</div>)}
          </div>
          <div className="legend">
            {[['#ef4444','Fire'],['#3b82f6','Medical'],['#f97316','Security'],['#22c55e','Safe'],['#8b5cf6','Responder']].map(([c, l]) =>
              <div className="legend-item" key={l}><span className="legend-dot" style={{background:c}}></span>{l}</div>
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-h"><h3><i className="ri-map-pin-line"></i> Zones</h3></div>
          <div className="zone-list">
            {floorInc.map(inc => (
              <div key={inc.incidentId} className="zone-card inc">
                <div className="zone-name"><i className="ri-alarm-warning-fill" style={{marginRight:3,color:'var(--red)'}}></i>{inc.location?.zone || 'Unknown'}</div>
                <div className="zone-st"><span className={`badge b-${inc.severity}`}>{inc.severity}</span> · {inc.crisisType}</div>
              </div>
            ))}
            {zones.map((z, i) => {
              const has = floorInc.some(x => x.location?.zone?.includes(z));
              return <div key={i} className={`zone-card${has?' inc':''}`}><div className="zone-name">{z}</div><div className="zone-st">{has ? <span className="badge b-critical">Alert</span> : <span style={{color:'var(--green)'}}>Normal</span>}</div></div>;
            })}
            {!zones.length && !floorInc.length && <div className="empty"><i className="ri-checkbox-circle-line"></i><h4>All clear</h4></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
