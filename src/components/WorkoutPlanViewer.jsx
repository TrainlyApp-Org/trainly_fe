import React, { useState } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WorkoutPlanViewer({ plan, onBack, onStart, footerText }) {
  const [selectedDayId, setSelectedDayId] = useState(null);

  if (selectedDayId) {
    const day = plan.days.find(item => item.id === selectedDayId) || plan.days[0];

    return (
      <div className="shared-workout-day-page">
        <button
          className="shared-workout-back-button"
          onClick={() => setSelectedDayId(null)}
          aria-label="Torna a tutti i giorni"
          title="Torna a tutti i giorni"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="shared-workout-title">{day.name}</h1>
        <div className="shared-workout-flex">
          {day.exercises.map((exercise, index) => (
            <div key={exercise.id} className="glass-panel shared-workout-card">
              <strong className="shared-workout-exercise-name">{index + 1}. {exercise.name}</strong>
              <span>{exercise.sets} serie × {exercise.reps} ripetizioni</span>
            </div>
          ))}
        </div>
        <button className="btn-primary shared-workout-start-button" onClick={() => onStart(day.id)}>
          <Play size={16} fill="currentColor" /> Avvia allenamento
        </button>
        <p className="workout-safety-note">
          Trainly non sostituisce il parere medico. Se sei minorenne, allenati con la supervisione
          di un adulto o professionista. Interrompi l’attività in caso di dolore o malessere.{' '}
          <Link to="/disclaimer">Leggi le avvertenze complete</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="shared-workout-page">
      {onBack && (
        <button className="shared-workout-back-button" onClick={onBack} aria-label="Torna alla dashboard" title="Torna alla dashboard">
          <ArrowLeft size={20} />
        </button>
      )}
      <h1 className="shared-workout-title shared-workout-title--plan">{plan.name}</h1>
      {plan.creatorName && <p className="shared-workout-creator">Creata da: {plan.creatorName}</p>}
      {plan.description && <p className="shared-workout-note">{plan.description}</p>}
      <h2 className="shared-workout-note">Scegli un giorno per vedere gli esercizi</h2>
      <div className="shared-workout-day-card">
        {plan.days.map(day => (
          <button key={day.id} className="shared-workout-day-card" onClick={() => setSelectedDayId(day.id)}>
            <div className="shared-workout-day-content">
              <strong>{day.name}</strong>
              <small>{day.exercises.length} esercizi</small>
            </div>
          </button>
        ))}
      </div>
      {footerText && <p className="shared-workout-note">{footerText}</p>}
    </div>
  );
}
