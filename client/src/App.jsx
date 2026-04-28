import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './context/AppContext';
import LoginPage from './pages/LoginPage';
import StaffLayout from './components/StaffLayout';
import GuestPortal from './pages/GuestPortal';
import Dashboard from './pages/Dashboard';
import ReportIncident from './pages/ReportIncident';
import Coordination from './pages/Coordination';
import Communications from './pages/Communications';
import FloorMap from './pages/FloorMap';
import IncidentHistory from './pages/IncidentHistory';
import Settings from './pages/Settings';
import CrisisBanner from './components/CrisisBanner';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, token } = useApp();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user, token } = useApp();

  if (!token || !user) return <LoginPage />;
  if (user.role === 'guest') return <GuestPortal />;

  return (
    <>
      <CrisisBanner />
      <StaffLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/report" element={<ReportIncident />} />
          <Route path="/coordination" element={<Coordination />} />
          <Route path="/communications" element={<Communications />} />
          <Route path="/floormap" element={<FloorMap />} />
          <Route path="/history" element={<IncidentHistory />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </StaffLayout>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#111827', color: '#f9fafb', border: '1px solid #1f2937', borderRadius: '8px', fontSize: '13px' },
            duration: 4000,
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
