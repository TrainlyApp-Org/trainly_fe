import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { api } from './api';

// Views
import Login from './views/Login';
import Register from './views/Register';
import Dashboard from './views/Dashboard';
import Profile from './views/Profile';
import CreateWorkout from './views/CreateWorkout';
import ActiveWorkout from './views/ActiveWorkout';
import SharedWorkout from './views/SharedWorkout';
import AdminDashboard from './views/AdminDashboard';
import AdminAccountDetails from './views/AdminAccountDetails';
import Home from './views/Home';
import DeviceExperienceNotice from './components/DeviceExperienceNotice';
import ForgotPassword from './views/ForgotPassword';
import ResetPassword from './views/ResetPassword';
import LegalPage from './views/LegalPage';
import PageLoader from './components/PageLoader';

function RequireAuth({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('trainly_user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setInitializing(false);
  }, []);

  // Supabase may fall back to the configured Site URL while keeping the
  // recovery session in the URL fragment. Route that session to the reset UI.
  useEffect(() => {
    const recoveryParams = new URLSearchParams(location.hash.replace(/^#/, ''));
    const isPasswordRecovery = recoveryParams.get('type') === 'recovery'
      && Boolean(recoveryParams.get('access_token'));

    if (isPasswordRecovery && location.pathname !== '/reset-password') {
      navigate(`/reset-password${location.hash}`, { replace: true });
    }
  }, [location.hash, location.pathname, navigate]);

  // Handle backward compatibility for ?share=XYZ links
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const shareId = searchParams.get('share');
    if (shareId) {
      navigate(`/shared/${shareId}`, { replace: true });
    }
  }, [location.search, navigate]);

  const handleAuthSuccess = (loggedUser) => {
    setUser(loggedUser);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    navigate('/login');
  };

  const handleStartWorkout = (planId, dayId) => {
    navigate(`/workout/active/${planId}/${dayId}`);
  };

  if (initializing) {
    return (
      <div className="app-container">
        <PageLoader label="Avvio di Trainly…" />
      </div>
    );
  }

  const isActiveWorkout = location.pathname.startsWith('/workout/active');
  const isAdminDashboard = location.pathname.startsWith('/admin');
  const viewportClasses = `phone-viewport ${isActiveWorkout ? 'phone-viewport--no-bottom' : ''}`.trim();

  return (
    <div className={`app-container ${isAdminDashboard ? 'app-container--admin' : ''}`}>
      <DeviceExperienceNotice />
      <div className={`phone-frame ${isAdminDashboard ? 'phone-frame--admin' : ''}`}>
        <div className={`${viewportClasses} ${isAdminDashboard ? 'phone-viewport--admin' : ''}`}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home authenticated={Boolean(user)} />} />
            <Route 
              path="/login" 
              element={user ? <Navigate to="/dashboard" replace /> : <Login onAuthSuccess={handleAuthSuccess} />} 
            />
            <Route 
              path="/register" 
              element={user ? <Navigate to="/dashboard" replace /> : <Register onAuthSuccess={handleAuthSuccess} />} 
            />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/legal/:document" element={<LegalPage />} />
            <Route path="/privacy" element={<Navigate to="/legal/privacy" replace />} />
            <Route path="/cookies" element={<Navigate to="/legal/cookies" replace />} />
            <Route path="/terms" element={<Navigate to="/legal/terms" replace />} />
            <Route path="/disclaimer" element={<Navigate to="/legal/disclaimer" replace />} />
            <Route 
              path="/shared/:shareId" 
              element={<SharedWorkout />} 
            />

            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <RequireAuth user={user}>
                  <Dashboard 
                    onStartWorkout={handleStartWorkout}
                    onCreateWorkout={() => navigate('/workout/create')}
                    onEditWorkout={(id) => navigate(`/workout/edit/${id}`)}
                    onViewProfile={() => navigate('/profile')}
                    onOpenAdmin={() => navigate('/admin')}
                    onLogout={handleLogout}
                  />
                </RequireAuth>
              } 
            />
            <Route
              path="/admin"
              element={
                <RequireAuth user={user}>
                  <AdminDashboard
                    onBack={() => navigate('/dashboard')}
                    onLogout={handleLogout}
                  />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/accounts/:profileId"
              element={
                <RequireAuth user={user}>
                  <AdminAccountDetails onBack={() => navigate('/admin')} />
                </RequireAuth>
              }
            />
            <Route 
              path="/profile" 
              element={
                <RequireAuth user={user}>
                  <Profile onBack={() => navigate('/dashboard')} />
                </RequireAuth>
              } 
            />
            <Route 
              path="/workout/create" 
              element={
                <RequireAuth user={user}>
                  <CreateWorkout 
                    onBack={() => navigate('/dashboard')} 
                    onSaveSuccess={() => navigate('/dashboard')} 
                  />
                </RequireAuth>
              } 
            />
            <Route 
              path="/workout/edit/:workoutId" 
              element={
                <RequireAuth user={user}>
                  <CreateWorkout 
                    onBack={() => navigate('/dashboard')} 
                    onSaveSuccess={() => navigate('/dashboard')} 
                  />
                </RequireAuth>
              } 
            />
            <Route 
              path="/workout/active/:workoutPlanId/:workoutDayId" 
              element={
                <RequireAuth user={user}>
                  <ActiveWorkout 
                    onWorkoutComplete={() => navigate('/dashboard')} 
                  />
                </RequireAuth>
              } 
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
