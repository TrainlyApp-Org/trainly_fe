import React, { useEffect, useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { api } from '../api';
import ActiveWorkout from './ActiveWorkout';
import WorkoutPlanViewer from '../components/WorkoutPlanViewer';
import { useParams } from 'react-router-dom';

export default function SharedWorkout({ shareId: propShareId }) {
  const { shareId: routeShareId } = useParams();
  const shareId = propShareId || routeShareId;
  const activeDayStorageKey = `trainly_shared_active_day_${shareId}`;
  const [plan, setPlan] = useState(null);
  const [startedDayId, setStartedDayId] = useState(() => localStorage.getItem(activeDayStorageKey));
  const [error, setError] = useState('');
  useEffect(() => { api.getSharedWorkout(shareId).then(setPlan).catch(err => setError(err.message || 'Link non valido o non più disponibile.')); }, [shareId]);

  const startWorkout = (dayId) => {
    localStorage.setItem(activeDayStorageKey, dayId);
    setStartedDayId(dayId);
  };

  const closeWorkout = () => {
    localStorage.removeItem(activeDayStorageKey);
    setStartedDayId(null);
  };

  if (startedDayId && plan) {
    const activeDay = plan.days.find(day => day.id === startedDayId) || plan.days[0];
    return <ActiveWorkout sharedPlan={{ ...plan, activeDay, exercises: activeDay.exercises }} sharedShareId={shareId} onWorkoutComplete={closeWorkout} />;
  }
  if (error) return <div className="shared-workout-error">{error}</div>;
  if (!plan) return <div className="shared-workout-empty"><Dumbbell className="pulse-effect" /> Caricamento scheda...</div>;
  return <WorkoutPlanViewer plan={plan} onStart={startWorkout} footerText="Se vuoi modificare il workout chiedi al tuo Personal Trainer." />;
}
