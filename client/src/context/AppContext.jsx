import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import toast from 'react-hot-toast';

const AppContext = createContext(null);

const initialState = {
  user: null,
  token: null,
  incidents: [],
  staff: [],
  messages: { all: [], security: [], medical: [], management: [], guests: [], 'emergency-services': [] },
  guestDistressSignals: [],
  onlineStaff: [],
  hotelAlerts: [],
  socket: null,
  loading: false,
  error: null,
  stats: { critical: 0, high: 0, moderate: 0, low: 0, resolved: 0 },
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_AUTH':
      return { ...state, user: action.user, token: action.token };
    case 'LOGOUT':
      return { ...initialState };
    case 'SET_SOCKET':
      return { ...state, socket: action.socket };
    case 'SET_INCIDENTS':
      return { ...state, incidents: action.incidents, stats: computeStats(action.incidents) };
    case 'ADD_INCIDENT':
      const newIncs = [action.incident, ...state.incidents];
      return { ...state, incidents: newIncs, stats: computeStats(newIncs) };
    case 'UPDATE_INCIDENT':
      const updated = state.incidents.map(i => i.incidentId === action.incident.incidentId ? action.incident : i);
      return { ...state, incidents: updated, stats: computeStats(updated) };
    case 'SET_STAFF':
      return { ...state, staff: action.staff };
    case 'SET_ONLINE_STAFF':
      return { ...state, onlineStaff: action.users || [] };
    case 'UPDATE_STAFF_STATUS':
      return { ...state, staff: state.staff.map(s => s.staffId === action.staffId ? { ...s, status: action.status } : s) };
    case 'ADD_MESSAGE': {
      const ch = action.message.channel || 'all';
      return { ...state, messages: { ...state.messages, [ch]: [...(state.messages[ch] || []), action.message] } };
    }
    case 'SET_MESSAGES': {
      return { ...state, messages: { ...state.messages, [action.channel]: action.messages } };
    }
    case 'ADD_DISTRESS':
      return { ...state, guestDistressSignals: [action.signal, ...state.guestDistressSignals] };
    case 'ADD_HOTEL_ALERT':
      return { ...state, hotelAlerts: [action.alert, ...state.hotelAlerts] };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    default:
      return state;
  }
}

function computeStats(incidents) {
  return {
    critical: incidents.filter(i => i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'false_alarm').length,
    high: incidents.filter(i => i.severity === 'high' && i.status !== 'resolved' && i.status !== 'false_alarm').length,
    moderate: incidents.filter(i => i.severity === 'moderate' && i.status !== 'resolved' && i.status !== 'false_alarm').length,
    low: incidents.filter(i => i.severity === 'low' && i.status !== 'resolved' && i.status !== 'false_alarm').length,
    resolved: incidents.filter(i => i.status === 'resolved' || i.status === 'false_alarm').length,
  };
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const socketRef = useRef(null);

  // Restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('cc_token');
    const user = localStorage.getItem('cc_user');
    if (token && user) {
      dispatch({ type: 'SET_AUTH', token, user: JSON.parse(user) });
    }
  }, []);

  // Setup Axios defaults
  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [state.token]);

  // Setup Socket.IO
  useEffect(() => {
    if (!state.token || !state.user) return;
    const SOCKET_URL = import.meta.env.PROD ? window.location.origin : 'http://localhost:5000';
    const socket = io(SOCKET_URL, { auth: { token: state.token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    dispatch({ type: 'SET_SOCKET', socket });

    socket.on('connect', () => {
      if (state.user.role === 'guest') {
        socket.emit('joinGuest', { roomNumber: state.user.roomNumber });
      } else {
        socket.emit('join', { userId: state.user.staffId, role: state.user.role, name: state.user.name });
      }
    });

    socket.on('newIncident', ({ incident }) => {
      dispatch({ type: 'ADD_INCIDENT', incident });
      const sev = incident.severity;
      if (sev === 'critical') {
        toast.error(`🚨 CRITICAL: ${incident.crisisType.toUpperCase()} at ${incident.location?.zone || incident.location?.room || 'Unknown'}`, { duration: 10000 });
        playAlert();
      } else if (sev === 'high') {
        toast(`⚠️ HIGH: ${incident.crisisType.toUpperCase()} incident reported`, { icon: '🟠', duration: 7000 });
      } else {
        toast(`📋 New incident: ${incident.crisisType}`, { duration: 5000 });
      }
    });

    socket.on('incidentUpdated', (incident) => {
      dispatch({ type: 'UPDATE_INCIDENT', incident });
    });

    socket.on('newMessage', (message) => {
      dispatch({ type: 'ADD_MESSAGE', message });
    });

    socket.on('guestDistress', (signal) => {
      dispatch({ type: 'ADD_DISTRESS', signal });
      toast.error(`🆘 Guest Distress: Room ${signal.roomNumber} — ${signal.peopleCount} person(s)`, { duration: 15000 });
      playAlert();
    });

    socket.on('hotelAlert', (alert) => {
      dispatch({ type: 'ADD_HOTEL_ALERT', alert });
      toast(`📢 Hotel Alert: ${alert.message}`, { icon: '⚠️', duration: 8000 });
    });

    socket.on('staffOnline', ({ users }) => {
      dispatch({ type: 'SET_ONLINE_STAFF', users });
    });

    socket.on('staffStatusUpdate', ({ staffId, status }) => {
      dispatch({ type: 'UPDATE_STAFF_STATUS', staffId, status });
    });

    socket.on('connect_error', () => {
      console.warn('Socket connection failed — running in offline mode');
    });

    return () => { socket.disconnect(); };
  }, [state.token, state.user?.staffId]);

  // Fetch incidents on login
  useEffect(() => {
    if (state.token && state.user?.role !== 'guest') {
      fetchIncidents();
      fetchStaff();
    }
  }, [state.token]);

  const fetchIncidents = useCallback(async () => {
    try {
      const res = await axios.get('/api/incidents');
      if (res.data.success) dispatch({ type: 'SET_INCIDENTS', incidents: res.data.data });
    } catch (err) {
      console.error('Failed to fetch incidents:', err.message);
    }
  }, []);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await axios.get('/api/staff');
      if (res.data.success) dispatch({ type: 'SET_STAFF', staff: res.data.data });
    } catch (err) {
      console.error('Failed to fetch staff:', err.message);
    }
  }, []);

  const fetchMessages = useCallback(async (channel) => {
    try {
      const res = await axios.get(`/api/messages/${channel}`);
      if (res.data.success) dispatch({ type: 'SET_MESSAGES', channel, messages: res.data.data });
    } catch (err) {
      console.error('Failed to fetch messages:', err.message);
    }
  }, []);

  const login = useCallback(async (credentials) => {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const endpoint = credentials.isGuest ? '/api/auth/guest-login' : '/api/auth/login';
      const res = await axios.post(endpoint, credentials);
      if (res.data.success) {
        localStorage.setItem('cc_token', res.data.token);
        localStorage.setItem('cc_user', JSON.stringify(res.data.user));
        dispatch({ type: 'SET_AUTH', token: res.data.token, user: res.data.user });
        toast.success(`Welcome, ${res.data.user.name || 'Guest'}!`);
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      toast.error(msg);
      return { success: false, message: msg };
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, []);

  const register = useCallback(async (data) => {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const res = await axios.post('/api/auth/register', data);
      if (res.data.success) {
        localStorage.setItem('cc_token', res.data.token);
        localStorage.setItem('cc_user', JSON.stringify(res.data.user));
        dispatch({ type: 'SET_AUTH', token: res.data.token, user: res.data.user });
        toast.success(`Account created! Welcome, ${res.data.user.name}`);
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
      return { success: false, message: msg };
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      const res = await axios.put('/api/auth/change-password', { currentPassword, newPassword });
      if (res.data.success) {
        toast.success('Password updated');
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password';
      toast.error(msg);
      return { success: false, message: msg };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
    if (socketRef.current) socketRef.current.disconnect();
    dispatch({ type: 'LOGOUT' });
    toast('Logged out', { icon: '✓' });
  }, []);

  const createIncident = useCallback(async (data) => {
    try {
      const res = await axios.post('/api/incidents', data);
      if (res.data.success) {
        dispatch({ type: 'ADD_INCIDENT', incident: res.data.data });
        return { success: true, data: res.data.data, alerts: res.data.alerts };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create incident';
      toast.error(msg);
      return { success: false, message: msg };
    }
  }, []);

  const updateIncident = useCallback(async (incidentId, data) => {
    try {
      const res = await axios.put(`/api/incidents/${incidentId}`, data);
      if (res.data.success) {
        dispatch({ type: 'UPDATE_INCIDENT', incident: res.data.data });
        return { success: true, data: res.data.data };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update incident';
      toast.error(msg);
      return { success: false, message: msg };
    }
  }, []);

  const classifyWithAI = useCallback(async (text) => {
    try {
      const res = await axios.post('/api/incidents/ai-classify', { text });
      return res.data.success ? res.data.data : null;
    } catch (err) {
      // Fallback client-side simple classification
      return clientSideClassify(text);
    }
  }, []);

  const sendMessage = useCallback(async (data) => {
    try {
      const res = await axios.post('/api/messages', data);
      if (res.data.success) {
        dispatch({ type: 'ADD_MESSAGE', message: res.data.data });
        return { success: true, data: res.data.data };
      }
    } catch (err) {
      // Optimistic fallback
      const msg = { ...data, _id: Date.now(), sender: state.user?.name, senderRole: state.user?.role, createdAt: new Date() };
      dispatch({ type: 'ADD_MESSAGE', message: msg });
      if (state.socket) state.socket.emit('newMessage', msg);
      return { success: true, data: msg };
    }
  }, [state.user, state.socket]);

  const sendDistressSignal = useCallback(async (data) => {
    try {
      const res = await axios.post('/api/alerts/distress', data);
      if (state.socket) state.socket.emit('distressSignal', data);
      return res.data;
    } catch (err) {
      if (state.socket) state.socket.emit('distressSignal', data);
      return { success: true };
    }
  }, [state.socket]);

  const sendGuestAlert = useCallback(async (data) => {
    try {
      const res = await axios.post('/api/alerts/guest', data);
      return res.data;
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);

  function playAlert() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'square'; osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  }

  const value = {
    ...state,
    login, register, logout, changePassword,
    createIncident, updateIncident, classifyWithAI,
    sendMessage, sendDistressSignal, sendGuestAlert,
    fetchIncidents, fetchStaff, fetchMessages,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

// Simple client-side fallback classifier
function clientSideClassify(text) {
  const t = text.toLowerCase();
  if (t.includes('fire') || t.includes('smoke') || t.includes('flame')) return { crisisType: 'fire', severity: 'critical', confidence: 0.85, shouldEvacuate: true };
  if (t.includes('collapse') || t.includes('unconscious') || t.includes('medical') || t.includes('heart')) return { crisisType: 'medical', severity: 'critical', confidence: 0.82, shouldEvacuate: false };
  if (t.includes('threat') || t.includes('weapon') || t.includes('security') || t.includes('fight')) return { crisisType: 'security', severity: 'high', confidence: 0.78, shouldEvacuate: false };
  if (t.includes('gas') || t.includes('leak') || t.includes('fumes')) return { crisisType: 'gas', severity: 'critical', confidence: 0.88, shouldEvacuate: true };
  if (t.includes('earthquake') || t.includes('tremor') || t.includes('shaking')) return { crisisType: 'earthquake', severity: 'critical', confidence: 0.92, shouldEvacuate: true };
  if (t.includes('power') || t.includes('blackout') || t.includes('outage')) return { crisisType: 'power', severity: 'moderate', confidence: 0.75, shouldEvacuate: false };
  return { crisisType: 'other', severity: 'moderate', confidence: 0.5, shouldEvacuate: false };
}
