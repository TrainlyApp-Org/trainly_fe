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
  if (error) return <div className="shared-workout-error">{error}</div>;
  if (!plan) return <div className="shared-workout-empty"><Dumbbell className="pulse-effect" /> Caricamento scheda...</div>;
  if (selectedDayId) {
    const day = plan.days.find(item => item.id === selectedDayId);
    return <div className="shared-workout-day-page">
      <div className="shared-workout-tag">SCHEDA CONDIVISA</div>
      <button className="shared-workout-back-button" onClick={() => setSelectedDayId(null)}>← Tutti i giorni</button>
      <h1 className="shared-workout-title">{day.name}</h1>
      <div className="shared-workout-flex">{day.exercises.map((exercise, index) => <div key={exercise.id} className="glass-panel shared-workout-card"><strong>{index + 1}. {exercise.name}</strong><span>{exercise.sets} serie × {exercise.reps} ripetizioni</span></div>)}</div>
      <button className="btn-primary" onClick={() => setStartedDayId(day.id)}><Play size={16} fill="currentColor" /> Avvia allenamento</button>
    </div>;
  }
  return <div className="shared-workout-page">
    <span className="shared-workout-tag">SCHEDA CONDIVISA</span>
    <h1 className="shared-workout-title">{plan.name}</h1>
    {plan.description && <p className="shared-workout-note">{plan.description}</p>}
    <h2 className="shared-workout-note">Scegli un giorno per vedere gli esercizi</h2>
    <div className="shared-workout-day-card">{plan.days.map(day => <button key={day.id} className="shared-workout-day-card" onClick={() => setSelectedDayId(day.id)}><div className="shared-workout-day-content"><div><strong>{day.name}</strong></div><div><small>{day.exercises.length} esercizi</small></div></div></button>)}</div>
    <p className="shared-workout-note">Se vuoi modificare il workout chiedi al tuo Personal Trainer.</p>
  </div>;
}
