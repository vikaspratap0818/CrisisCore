import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';
import { LogoStacked } from '../components/Logo';

export default function LoginPage() {
  const { login, register, loading } = useApp();
  const [mode, setMode] = useState('login'); // login | register | guest
  const [form, setForm] = useState({ staffId: '', email: '', password: '', name: '', role: 'manager', department: '', phone: '' });
  const [guestForm, setGuestForm] = useState({ roomNumber: '', bookingRef: '' });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = async e => {
    e.preventDefault();
    if (!form.email && !form.staffId) { toast.error('Enter email or staff ID'); return; }
    if (!form.password) { toast.error('Enter password'); return; }
    await login({ email: form.email, staffId: form.staffId, password: form.password, role: form.role });
  };

  const handleRegister = async e => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.role) {
      toast.error('Fill all required fields');
      return;
    }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    await register({ name: form.name, email: form.email, password: form.password, role: form.role, department: form.department, phone: form.phone });
  };

  const handleGuest = async e => {
    e.preventDefault();
    if (!guestForm.roomNumber) { toast.error('Enter room number'); return; }
    await login({ ...guestForm, isGuest: true });
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        {/* Logo */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:24 }}>
          <LogoStacked height={160} />
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab${mode === 'login' ? ' active' : ''}`} onClick={() => setMode('login')}>
            <i className="ri-login-box-line"></i> Login
          </button>
          <button className={`auth-tab${mode === 'register' ? ' active' : ''}`} onClick={() => setMode('register')}>
            <i className="ri-user-add-line"></i> Register
          </button>
          <button className={`auth-tab${mode === 'guest' ? ' active' : ''}`} onClick={() => setMode('guest')}>
            <i className="ri-hotel-line"></i> Guest
          </button>
        </div>

        {/* Login */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="fade-in">
            <div className="auth-title">Staff Login</div>
            <div className="auth-sub">Access the Crisis Command Center</div>
            <div className="fg">
              <label className="fl">Email or Staff ID</label>
              <input className="fi" type="text" value={form.email || form.staffId} onChange={e => { set('email', e.target.value); set('staffId', e.target.value); }} placeholder="name@hotel.com or MGR001" required />
            </div>
            <div className="fg">
              <label className="fl">Password</label>
              <input className="fi" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Enter password" required />
            </div>
            <div className="fg">
              <label className="fl">Role</label>
              <select className="fi" value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="manager">Crisis Manager</option>
                <option value="security">Security</option>
                <option value="medical">Medical Staff</option>
                <option value="frontdesk">Front Desk</option>
                <option value="housekeeping">Housekeeping</option>
                <option value="engineering">Engineering</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? <><span className="spinner"></span> Signing in...</> : <><i className="ri-login-box-line"></i> Sign In</>}
            </button>
            <div className="auth-demo">
              <i className="ri-information-line"></i>
              <span><strong>Demo:</strong> Use MGR001 / crisis2024 or register a new account.</span>
            </div>
            <div className="auth-switch">
              Don't have an account? <a onClick={() => setMode('register')}>Register</a>
            </div>
          </form>
        )}

        {/* Register */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="fade-in">
            <div className="auth-title">Create Account</div>
            <div className="auth-sub">Register as a new staff member</div>
            <div className="fg">
              <label className="fl">Full Name *</label>
              <input className="fi" type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="John Doe" required />
            </div>
            <div className="fg">
              <label className="fl">Email *</label>
              <input className="fi" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@hotel.com" required />
            </div>
            <div className="fg">
              <label className="fl">Password * (min 6 characters)</label>
              <input className="fi" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>
            <div className="form-row">
              <div className="fg">
                <label className="fl">Role *</label>
                <select className="fi" value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="manager">Crisis Manager</option>
                  <option value="security">Security</option>
                  <option value="medical">Medical Staff</option>
                  <option value="frontdesk">Front Desk</option>
                  <option value="housekeeping">Housekeeping</option>
                  <option value="engineering">Engineering</option>
                </select>
              </div>
              <div className="fg">
                <label className="fl">Phone</label>
                <input className="fi" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1-555-0100" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? <><span className="spinner"></span> Creating...</> : <><i className="ri-user-add-line"></i> Create Account</>}
            </button>
            <div className="auth-switch">
              Already have an account? <a onClick={() => setMode('login')}>Sign In</a>
            </div>
          </form>
        )}

        {/* Guest */}
        {mode === 'guest' && (
          <form onSubmit={handleGuest} className="fade-in">
            <div className="auth-title">Guest Portal</div>
            <div className="auth-sub">Access emergency services for your room</div>
            <div className="fg">
              <label className="fl">Room Number *</label>
              <input className="fi" type="text" value={guestForm.roomNumber} onChange={e => setGuestForm(f => ({ ...f, roomNumber: e.target.value }))} placeholder="e.g. 412" required />
            </div>
            <div className="fg">
              <label className="fl">Booking Reference (optional)</label>
              <input className="fi" type="text" value={guestForm.bookingRef} onChange={e => setGuestForm(f => ({ ...f, bookingRef: e.target.value }))} placeholder="BK-20240428" />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? <><span className="spinner"></span> Connecting...</> : <><i className="ri-door-open-line"></i> Enter Portal</>}
            </button>
            <div className="auth-switch">
              Staff member? <a onClick={() => setMode('login')}>Sign In</a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
