import React, { useState, useEffect } from 'react';
import { api } from './api';

// Views
import Login from './views/Login';
import Register from './views/Register';
import Dashboard from './views/Dashboard';
import Profile from './views/Profile';
import CreateWorkout from './views/CreateWorkout';
import ActiveWorkout from './views/ActiveWorkout';
import SharedWorkout from './views/SharedWorkout';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // login | register | dashboard | profile | create_workout | active_workout
  const [activeWorkoutId, setActiveWorkoutId] = useState(null);
  const [activeWorkoutDayId, setActiveWorkoutDayId] = useState(null);
  const [editingWorkoutId, setEditingWorkoutId] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const shareId = new URLSearchParams(window.location.search).get('share');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('trainly_token');
    const storedUser = localStorage.getItem('trainly_user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      setView('dashboard');
    } else {
      setView('login');
    }
    setInitializing(false);
  }, []);

  const handleAuthSuccess = (loggedUser) => {
    setUser(loggedUser);
    setView('dashboard');
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setView('login');
  };

  const handleStartWorkout = (planId, dayId) => {
    setActiveWorkoutId(planId);
    setActiveWorkoutDayId(dayId);
    setView('active_workout');
  };

  const renderView = () => {
    switch (view) {
      case 'login':
        return <Login onAuthSuccess={handleAuthSuccess} onViewChange={setView} />;
      case 'register':
        return <Register onAuthSuccess={handleAuthSuccess} onViewChange={setView} />;
      case 'dashboard':
        return (
          <Dashboard 
            onStartWorkout={handleStartWorkout}
            onCreateWorkout={() => { setEditingWorkoutId(null); setView('create_workout'); }}
            onEditWorkout={(id) => { setEditingWorkoutId(id); setView('create_workout'); }}
            onViewProfile={() => setView('profile')}
            onLogout={handleLogout}
          />
        );
      case 'profile':
        return <Profile onBack={() => setView('dashboard')} />;
      case 'create_workout':
        return (
          <CreateWorkout 
            workoutId={editingWorkoutId}
            onBack={() => { setEditingWorkoutId(null); setView('dashboard'); }} 
            onSaveSuccess={() => { setEditingWorkoutId(null); setView('dashboard'); }} 
          />
        );
      case 'active_workout':
        return (
          <ActiveWorkout 
            workoutPlanId={activeWorkoutId}
            workoutDayId={activeWorkoutDayId}
            onWorkoutComplete={() => {
              setActiveWorkoutId(null);
              setActiveWorkoutDayId(null);
              setView('dashboard');
            }} 
          />
        );
      default:
        return <Login onAuthSuccess={handleAuthSuccess} onViewChange={setView} />;
    }
  };

  if (initializing) {
    return (
      <div className="app-container">
        <div style={{ color: 'var(--color-secondary)' }}>Trainly...</div>
      </div>
    );
  }

  if (shareId) {
    return <div className="app-container"><div className="phone-frame"><div className="phone-viewport"><SharedWorkout shareId={shareId} /></div></div></div>;
  }

  return (
    <div className="app-container">
      <div className="phone-frame">
        <div className="phone-viewport" style={{ paddingBottom: view === 'active_workout' ? '0' : '70px', height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {renderView()}
        </div>
      </div>
    </div>
  );
}
