import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const ICON = { fire:'ri-fire-line', medical:'ri-heart-pulse-line', security:'ri-shield-keyhole-line', gas:'ri-windy-line', earthquake:'ri-shake-hands-line', power:'ri-flashlight-line', flood:'ri-water-flash-line', structural:'ri-building-4-line', other:'ri-alert-line' };
const LABEL = { fire:'Fire / Smoke', medical:'Medical', security:'Security', gas:'Gas Leak', earthquake:'Earthquake', power:'Power Out', flood:'Flood', structural:'Structural', other:'Other' };
const STATUS = { active:'Active', responding:'Responding', contained:'Contained', resolved:'Resolved', false_alarm:'False Alarm' };

const FILTERS = [
  ['all','ri-list-check','All'], ['fire','ri-fire-line','Fire'], ['medical','ri-heart-pulse-line','Medical'],
  ['security','ri-shield-keyhole-line','Security'], ['power','ri-flashlight-line','Utility'], ['resolved','ri-checkbox-circle-line','Resolved'],
];

export default function IncidentHistory() {
  const { incidents } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sel, setSel] = useState(null);

  const filtered = incidents.filter(i => {
    const ms = !search || [i.incidentId, i.crisisType, i.description, i.location?.zone].some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const mf = filter === 'all' || (filter === 'resolved' ? ['resolved','false_alarm'].includes(i.status) : i.crisisType === filter);
    return ms && mf;
  });

  const exportCSV = () => {
    const h = ['ID','Type','Severity','Status','Location','Reporter','Time','People'];
    const rows = filtered.map(i => [i.incidentId, i.crisisType, i.severity, i.status, `${i.location?.zone||''} ${i.location?.room?'Rm '+i.location.room:''}`.trim(), i.reportedBy, i.createdAt?format(new Date(i.createdAt),'yyyy-MM-dd HH:mm'):'--', i.peopleAffected||0]);
    const csv = [h,...rows].map(r=>r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = `incidents-${format(new Date(),'yyyyMMdd')}.csv`; a.click();
    toast.success('Exported');
  };

  return (
    <div>
      <div className="ph">
        <div className="ph-title"><div className="ph-icon"><i className="ri-folder-open-line"></i></div><div><h2>Incident History</h2><div className="ph-sub">Searchable archive & reports</div></div></div>
        <div className="ph-actions">
          <input type="text" className="search-box" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." />
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}><i className="ri-download-2-line"></i> CSV</button>
        </div>
      </div>

      <div className="kpis">
        {[
          { c:'var(--blue)', icon:'ri-bar-chart-2-line', val:incidents.length, lbl:'Total' },
          { c:'var(--green)', icon:'ri-checkbox-circle-fill', val:incidents.filter(i=>i.status==='resolved').length, lbl:'Resolved' },
          { c:'var(--red)', icon:'ri-alarm-warning-fill', val:incidents.filter(i=>i.severity==='critical').length, lbl:'Critical' },
          { c:'var(--purple)', icon:'ri-timer-line', val:'--', lbl:'Avg Resp' },
        ].map(k=><div className="kpi" key={k.lbl} style={{'--kpi-c':k.c}}><div className="kpi-top"><i className={`kpi-icon ${k.icon}`}></i></div><div className="kpi-val">{k.val}</div><div className="kpi-label">{k.lbl}</div></div>)}
      </div>

      <div className="filters">
        {FILTERS.map(([v,ic,lb]) => <button key={v} className={`filter${filter===v?' active':''}`} onClick={()=>setFilter(v)}><i className={ic}></i>{lb}</button>)}
      </div>

      <div className="card">
        <div style={{overflowX:'auto'}}>
          <table className="tbl">
            <thead><tr><th>ID</th><th>Type</th><th>Severity</th><th>Location</th><th>Reported</th><th>Status</th><th>People</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan="8" style={{textAlign:'center',padding:40,color:'var(--text-4)'}}>No incidents found</td></tr> :
              filtered.map(inc => (
                <tr key={inc._id||inc.incidentId} style={{cursor:'pointer'}} onClick={()=>setSel(inc)}>
                  <td className="id-col">{inc.incidentId}</td>
                  <td><div className="type-cell"><div className="type-icon"><i className={ICON[inc.crisisType]||'ri-alert-line'} style={{color:'var(--red)'}}></i></div>{LABEL[inc.crisisType]||inc.crisisType}</div></td>
                  <td><span className={`badge b-${inc.severity}`}>{inc.severity}</span></td>
                  <td style={{fontSize:12}}>{[inc.location?.zone,inc.location?.room&&`Rm ${inc.location.room}`].filter(Boolean).join(' · ')||'--'}</td>
                  <td style={{fontSize:11,whiteSpace:'nowrap'}}>{inc.createdAt?formatDistanceToNow(new Date(inc.createdAt),{addSuffix:true}):'--'}</td>
                  <td><span className={`badge b-${inc.status}`}>{STATUS[inc.status]}</span></td>
                  <td style={{fontSize:12}}>{inc.peopleAffected||0}</td>
                  <td><button className="btn btn-ghost btn-sm" onClick={e=>{e.stopPropagation();setSel(inc);}}><i className="ri-external-link-line"></i></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {sel && (
        <div className="modal-bg" onClick={()=>setSel(null)}>
          <div className="modal lg" onClick={e=>e.stopPropagation()}>
            <div className="modal-head"><div className="modal-title"><i className={ICON[sel.crisisType]}></i>{sel.incidentId}<span className={`badge b-${sel.severity}`}>{sel.severity}</span></div><button className="modal-close" onClick={()=>setSel(null)}><i className="ri-close-line"></i></button></div>
            <div className="modal-body">
              <div className="info-grid">
                {[['Type',LABEL[sel.crisisType]],['Status',STATUS[sel.status]],['Severity',sel.severity],['Location',[sel.location?.zone,sel.location?.room&&`Rm ${sel.location.room}`].filter(Boolean).join(' · ')||'--'],['Reporter',sel.reportedBy],['People',sel.peopleAffected||0],['Responders',sel.assignedResponders?.length||0],['Duration',sel.resolutionTime?`${sel.resolutionTime}m`:'Ongoing'],['AI Conf.',sel.aiClassification?`${Math.round((sel.aiClassification.confidence||0)*100)}%`:'N/A']].map(([l,v])=>(
                  <div className="info-cell" key={l}><div className="info-cell-l">{l}</div><div className="info-cell-v">{v}</div></div>
                ))}
              </div>
              <div className="fg"><label className="fl">Description</label><div style={{background:'var(--bg-3)',borderRadius:6,padding:'8px 12px',fontSize:13,color:'var(--text-2)'}}>{sel.description}</div></div>
              {sel.timeline?.length>0 && (
                <div className="fg"><label className="fl">Timeline</label><div style={{background:'var(--bg-3)',borderRadius:6,maxHeight:200,overflowY:'auto'}}>
                  {sel.timeline.map((t,i)=><div key={i} className="log-row"><span className="log-ts">{t.timestamp?format(new Date(t.timestamp),'HH:mm:ss'):'--'}</span><span className="log-actor">{t.actor||'SYSTEM'}</span><span className="log-msg">{t.action}: {t.details}</span></div>)}
                </div></div>
              )}
              {sel.postIncidentReport && (
                <div className="fg"><label className="fl"><i className="ri-file-chart-line"></i> AI Analysis</label><div style={{background:'var(--bg-3)',borderRadius:6,padding:12}}><p style={{fontSize:13,marginBottom:8}}>{sel.postIncidentReport.summary}</p>{sel.postIncidentReport.recommendations?.map((r,i)=><div key={i} style={{fontSize:12,color:'var(--text-3)',marginBottom:4,paddingLeft:10,borderLeft:'2px solid var(--blue)'}}>{i+1}. {r}</div>)}</div></div>
              )}
            </div>
            <div className="modal-foot"><button className="btn btn-ghost btn-sm" onClick={()=>setSel(null)}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
