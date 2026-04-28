import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { LogoFull, LogoWatermark } from './Logo';

const NAV = [
  { path: '/dashboard',      icon: 'ri-dashboard-3-line',    label: 'Dashboard' },
  { path: '/report',         icon: 'ri-alarm-warning-line',   label: 'Report Crisis' },
  { path: '/coordination',   icon: 'ri-team-line',            label: 'Coordination' },
  { path: '/communications', icon: 'ri-message-3-line',       label: 'Communications' },
  { path: '/floormap',       icon: 'ri-map-2-line',           label: 'Floor Map' },
  { path: '/history',        icon: 'ri-folder-open-line',     label: 'History' },
  { path: '/settings',       icon: 'ri-settings-4-line',      label: 'Settings' },
];

export default function StaffLayout({ children }) {
  const { user, logout, stats, incidents } = useApp();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const active = incidents.filter(i => i.status !== 'resolved' && i.status !== 'false_alarm').length;
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sb-head">
          <LogoFull height={98} />
        </div>

        <nav className="sb-nav">
          <div className="sb-label">Menu</div>
          {NAV.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sb-link${isActive ? ' active' : ''}`}
            >
              <i className={item.icon}></i>
              {item.label}
              {item.path === '/dashboard' && active > 0 && (
                <span className="sb-badge">{active}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sb-user">
          <div className="sb-avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sb-uname">{user?.name || 'Staff'}</div>
            <div className="sb-urole">{user?.role || 'Staff'}</div>
          </div>
          <button className="tb-btn" onClick={logout} title="Logout" style={{ border: 'none', background: 'none' }}>
            <i className="ri-logout-box-r-line"></i>
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="tb-left">
            <div className="tb-venue">
              <i className="ri-building-2-line"></i>
              Grand Horizon Hotel
            </div>
          </div>
          <div className="tb-right">
            {stats.critical > 0 ? (
              <div className="tb-status alert">
                <span className="tb-dot red"></span>
                {stats.critical} Critical
              </div>
            ) : (
              <div className="tb-status ok">
                <span className="tb-dot green"></span>
                Normal
              </div>
            )}
            <div className="tb-clock">
              {time.toLocaleTimeString('en-US', { hour12: false })}
            </div>
            <button className="tb-btn" onClick={() => navigate('/report')} title="Report">
              <i className="ri-alarm-warning-line"></i>
            </button>
          </div>
        </header>
        <main className="page fade-in">{children}</main>
        <LogoWatermark />
      </div>
    </div>
  );
}
