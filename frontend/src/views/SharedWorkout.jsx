import React, { useEffect, useState } from 'react';
import { Dumbbell, Play } from 'lucide-react';
import { api } from '../api';
import ActiveWorkout from './ActiveWorkout';

export default function SharedWorkout({ shareId }) {
  const [plan, setPlan] = useState(null);
  const [selectedDayId, setSelectedDayId] = useState(null);
  const [startedDayId, setStartedDayId] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.getSharedWorkout(shareId).then(setPlan).catch(err => setError(err.message || 'Link non valido o non più disponibile.')); }, [shareId]);
  if (startedDayId && plan) {
    const activeDay = plan.days.find(day => day.id === startedDayId) || plan.days[0];
    return <ActiveWorkout sharedPlan={{ ...plan, activeDay, exercises: activeDay.exercises }} sharedShareId={shareId} onWorkoutComplete={() => setStartedDayId(null)} />;
  }
  if (error) return <div style={{ padding: '32px 20px', color: 'var(--accent-red)', textAlign: 'center' }}>{error}</div>;
  if (!plan) return <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--color-secondary)' }}><Dumbbell className="pulse-effect" /> Caricamento scheda...</div>;
  if (selectedDayId) {
    const day = plan.days.find(item => item.id === selectedDayId);
    return <div style={{ height: '100%', minHeight: '100%', padding: '32px 20px', overflowY: 'auto', background: 'var(--bg-primary)' }}>
      <button onClick={() => setSelectedDayId(null)} style={{ border: 'none', background: 'none', color: 'var(--color-secondary)', cursor: 'pointer', padding: '0 0 20px' }}>← Tutti i giorni</button>
      <span style={{ color: 'var(--accent-orange)', fontSize: '12px', fontWeight: '700' }}>SCHEDA CONDIVISA</span>
      <h1 style={{ fontSize: '26px', margin: '8px 0 20px' }}>{day.name}</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>{day.exercises.map((exercise, index) => <div key={exercise.id} className="glass-panel" style={{ fontSize: '14px' }}><strong>{index + 1}. {exercise.name}</strong><span style={{ display: 'block', color: 'var(--color-secondary)', marginTop: '5px' }}>{exercise.sets} serie × {exercise.reps} ripetizioni</span></div>)}</div>
      <button className="btn-primary" onClick={() => setStartedDayId(day.id)}><Play size={16} fill="currentColor" /> Avvia allenamento</button>
    </div>;
  }
  return <div style={{ padding: '32px 20px', overflowY: 'auto' }}>
    <span style={{ color: 'var(--accent-orange)', fontSize: '12px', fontWeight: '700' }}>SCHEDA CONDIVISA</span>
    <h1 style={{ fontSize: '28px', margin: '8px 0' }}>{plan.name}</h1>
    {plan.description && <p style={{ color: 'var(--color-secondary)', marginBottom: '24px' }}>{plan.description}</p>}
    <h2 style={{ fontSize: '16px', marginBottom: '12px' }}>Scegli un giorno per vedere gli esercizi</h2>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>{plan.days.map(day => <button key={day.id} className="glass-panel" onClick={() => setSelectedDayId(day.id)} style={{ color: 'var(--color-primary)', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: selectedDayId === day.id ? 'var(--accent-orange)' : 'var(--border-color)' }}><span><strong>{day.name}</strong><small style={{ display: 'block', color: 'var(--color-secondary)', marginTop: '4px' }}>{day.exercises.length} esercizi</small></span></button>)}</div>
    <p style={{ fontSize: '12px', color: 'var(--color-muted)', textAlign: 'center', marginTop: '24px' }}>Puoi allenarti senza account. I risultati non vengono salvati.</p>
  </div>;
}
