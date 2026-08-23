import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api';
import { Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock, Play, RefreshCw, SkipBack, SkipForward, Square, User } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { useParams, useNavigate } from 'react-router-dom';
import PageLoader from '../components/PageLoader';

function Stepper({ value, onChange, min = 0, placeholder }) {
  const change = (next) => onChange(Math.max(min, next));
  return (
    <div className="stepper-group">
      <button type="button" className="stepper-button" onClick={() => change((Number(value) || 0) - 1)}>−</button>
      <input type="number" placeholder={placeholder} className="stepper-input" value={value || ''} onChange={e => onChange(e.target.value)} />
      <button type="button" className="stepper-button" onClick={() => change((Number(value) || 0) + 1)}>+</button>
    </div>
  );
}

export default function ActiveWorkout({ 
  workoutPlanId: propWorkoutPlanId, 
  workoutDayId: propWorkoutDayId, 
  sharedPlan, 
  sharedShareId, 
  onWorkoutComplete 
}) {
  const { workoutPlanId: routeWorkoutPlanId, workoutDayId: routeWorkoutDayId } = useParams();
  const workoutPlanId = propWorkoutPlanId || routeWorkoutPlanId;
  const workoutDayId = propWorkoutDayId || routeWorkoutDayId;
  const navigate = useNavigate();
  const handleWorkoutComplete = onWorkoutComplete || (() => navigate('/dashboard'));

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  
  // Navigation & logging
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState({}); // { [exId]: [set0_completed, set1_completed, ...] }
  const [setWeights, setSetWeights] = useState({}); // { [exId]: [weight0, weight1, ...] }
  const [setReps, setSetReps] = useState({}); // { [exId]: [reps0, reps1, ...] }
  
  // Elapsed Workout Time
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedTimerRef = useRef(null);
  const sessionStartedAtRef = useRef(null);
  const setValueSaveTimersRef = useRef({});
  const sessionKey = sharedShareId 
    ? `trainly_shared_session_${sharedShareId}`
    : `trainly_workout_session_${workoutPlanId}_${workoutDayId}`;

  useEffect(() => {
    if (!plan || !sessionStartedAtRef.current) return;
    localStorage.setItem(sessionKey, JSON.stringify({
      startedAt: sessionStartedAtRef.current,
      completedSets,
      setWeights,
      setReps
    }));
  }, [plan, completedSets, setWeights, setReps, sessionKey]);

  // Fullscreen Rest Timer State
  const [showTimer, setShowTimer] = useState(false);
  const [timerDuration, setTimerDuration] = useState(60);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(60);
  const [timerExerciseName, setTimerExerciseName] = useState('');
  const [timerIsActive, setTimerIsActive] = useState(false);
  const restTimerRef = useRef(null);
  const contentScrollRef = useRef(null);

  // bottom drawer state
  const [showBottomDrawer, setShowBottomDrawer] = useState(false);
  const [drawerHeight, setDrawerHeight] = useState(68);
  const drawerDragRef = useRef({ active: false, startY: 0, startHeight: 68 });
  const DRAWER_MIN_HEIGHT = 68;
  const DRAWER_MAX_HEIGHT = 340;

  // popup end workout
  const [showEndWorkoutModal, setShowEndWorkoutModal] = useState(false);

  const openDrawer = () => {
    setShowBottomDrawer(true);
    setDrawerHeight(DRAWER_MAX_HEIGHT);
  };

  const closeDrawer = () => {
    setShowBottomDrawer(false);
    setDrawerHeight(DRAWER_MIN_HEIGHT);
  };

  const toggleDrawer = () => {
    if (showBottomDrawer) closeDrawer();
    else openDrawer();
  };

  const handleDrawerPointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawerDragRef.current = {
      active: true,
      startY: event.clientY,
      startHeight: drawerHeight,
    };
  };

  const handleDrawerPointerMove = (event) => {
    if (!drawerDragRef.current.active) return;
    const delta = drawerDragRef.current.startY - event.clientY;
    const nextHeight = Math.max(DRAWER_MIN_HEIGHT, Math.min(DRAWER_MAX_HEIGHT, drawerDragRef.current.startHeight + delta));
    setDrawerHeight(nextHeight);
    setShowBottomDrawer(nextHeight > DRAWER_MIN_HEIGHT + 20);
  };

  const handleDrawerPointerUp = () => {
    if (!drawerDragRef.current.active) return;
    drawerDragRef.current.active = false;
    if (drawerHeight > (DRAWER_MIN_HEIGHT + DRAWER_MAX_HEIGHT) / 2) {
      setShowBottomDrawer(true);
      setDrawerHeight(DRAWER_MAX_HEIGHT);
    } else {
      closeDrawer();
    }
  };

  useEffect(() => {
    startWorkout();
    return () => {
      clearInterval(elapsedTimerRef.current);
      clearInterval(restTimerRef.current);
    };
  }, []);

  const startWorkout = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const planData = sharedPlan || await api.getWorkoutDetails(workoutPlanId, workoutDayId);

      const selectedDay = workoutDayId
        ? planData.days.find(day => day.id === workoutDayId)
        : planData.days[0];

      const normalizedPlan = {
        ...planData,
        activeDay: selectedDay,
        exercises: selectedDay?.exercises || []
      };

      // Check cache
      const cachedSession = localStorage.getItem(sessionKey);
      let startTime = Date.now();
      let cachedCompleted = {};
      let cachedWeights = {};
      let cachedReps = {};
      let storedSetValues = [];
      
      if (cachedSession) {
        try {
          const parsed = JSON.parse(cachedSession);
          if (parsed && parsed.startedAt) {
            startTime = parsed.startedAt;
            cachedCompleted = parsed.completedSets || {};
            cachedWeights = parsed.setWeights || {};
            cachedReps = parsed.setReps || {};
          }
        } catch (e) {
          console.error('Error parsing cached session:', e);
        }
      }

      if (sharedPlan && sharedShareId && selectedDay?.id) {
        try {
          const response = await api.getSharedWorkoutSetValues(sharedShareId, selectedDay.id);
          storedSetValues = response.values || [];
        } catch (error) {
          console.error('Failed to load shared weight and reps:', error);
        }
      } else if (workoutPlanId && selectedDay?.id) {
        try {
          const response = await api.getWorkoutSetValues(workoutPlanId, selectedDay.id);
          storedSetValues = response.values || [];
        } catch (error) {
          console.error('Failed to load saved weight and reps:', error);
        }
      }

      sessionStartedAtRef.current = startTime;
      setPlan(normalizedPlan);

      // Initialize state maps for all sets (fallback to default if not in cache)
      const initialCompleted = {};
      const initialWeights = {};
      const initialReps = {};
      
      normalizedPlan.exercises.forEach(ex => {
        const viewId = ex.id;
        initialCompleted[viewId] = cachedCompleted[viewId] || Array.from({ length: ex.sets }, () => false);
        initialWeights[viewId] = cachedWeights[viewId] || Array.from({ length: ex.sets }, () => 0);
        initialReps[viewId] = cachedReps[viewId] || Array.from({ length: ex.sets }, () => parseInt(ex.reps) || 10);

        storedSetValues
          .filter(value => value.exerciseId === ex.exerciseId && value.setIndex < ex.sets)
          .forEach(value => {
            initialWeights[viewId][value.setIndex] = Number(value.weight) || 0;
            initialReps[viewId][value.setIndex] = Number(value.reps) || 0;
          });
      });

      setCompletedSets(initialCompleted);
      setSetWeights(initialWeights);
      setSetReps(initialReps);

      // Set elapsed time immediately
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed >= 0 ? elapsed : 0);

      // Start workout timer
      elapsedTimerRef.current = setInterval(() => {
        if (sessionStartedAtRef.current) {
          const secs = Math.floor((Date.now() - sessionStartedAtRef.current) / 1000);
          setElapsedSeconds(secs >= 0 ? secs : 0);
        }
      }, 1000);

    } catch (err) {
      console.error('Error starting active workout:', err);
      setLoadError(err.message || 'Impossibile inizializzare l’allenamento.');
    } finally {
      setLoading(false);
    }
  };

  // Rest Timer Controller
  const startRestTimer = (seconds, exerciseName) => {
    clearInterval(restTimerRef.current);
    setTimerExerciseName(exerciseName);
    setTimerDuration(seconds);
    setTimerSecondsLeft(seconds);
    setTimerIsActive(true);
    setShowTimer(true);

    restTimerRef.current = setInterval(() => {
      setTimerSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(restTimerRef.current);
          setTimerIsActive(false);
          setShowTimer(false);
          // Play a small synthetic beep sound on mobile if supported
          try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const osc = context.createOscillator();
            osc.connect(context.destination);
            osc.frequency.setValueAtTime(600, context.currentTime);
            osc.start();
            osc.stop(context.currentTime + 0.15);
          } catch (e) {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleToggleSet = async (exIndex, setIdx) => {
    const exercise = plan.exercises[exIndex];
    const viewId = exercise.id;
    const actualExerciseId = exercise.exerciseId;
    
    const isCompleted = !completedSets[viewId][setIdx];
    const repsDone = setReps[viewId][setIdx];
    const weightDone = setWeights[viewId][setIdx];

    // Toggle local state
    const newCompleted = { ...completedSets };
    newCompleted[viewId] = [...newCompleted[viewId]];
    newCompleted[viewId][setIdx] = isCompleted;
    setCompletedSets(newCompleted);

    try {
      if (isCompleted) {
        if (setIdx < exercise.sets - 1) {
          setCurrentSetIndex(setIdx + 1);
        } else if (exIndex < plan.exercises.length - 1) {
          handleExerciseNavigation(exIndex + 1);
        }
        startRestTimer(exercise.restTime || 60, exercise.name);
      }
    } catch (err) {
      console.error('Failed to log set:', err);
    }
  };

  const scheduleSetValueSave = (viewId, setIdx, weight, reps) => {
    if (sharedPlan || !plan?.activeDay?.id) return;

    const exercise = plan.exercises.find(item => item.id === viewId);
    if (!exercise?.exerciseId) return;

    const timerKey = `${viewId}:${setIdx}`;
    clearTimeout(setValueSaveTimersRef.current[timerKey]);
    setValueSaveTimersRef.current[timerKey] = setTimeout(() => {
      api.saveWorkoutSetValue(
        workoutPlanId,
        plan.activeDay.id,
        exercise.exerciseId,
        setIdx,
        Number(weight) || 0,
        Number(reps) || 0
      ).catch(error => console.error('Failed to save weight and reps:', error));
      delete setValueSaveTimersRef.current[timerKey];
    }, 400);
  };

  const handleParamChange = (viewId, setIdx, param, val) => {
    if (param === 'weight') {
      const weight = parseFloat(val) || 0;
      const newWeights = { ...setWeights };
      newWeights[viewId] = [...newWeights[viewId]];
      newWeights[viewId][setIdx] = weight;
      setSetWeights(newWeights);
      if (sharedPlan && sharedShareId) {
        const exercise = plan.exercises.find(ex => ex.id === viewId);
        const actualExerciseId = exercise?.exerciseId;
        api.saveSharedWorkoutSet(sharedShareId, plan.activeDay?.id, actualExerciseId, setIdx, weight, setReps[viewId][setIdx])
          .catch(err => console.error('Failed to save shared workout set:', err));
      } else {
        scheduleSetValueSave(viewId, setIdx, weight, setReps[viewId][setIdx]);
      }
    } else if (param === 'reps') {
      const reps = parseInt(val) || 0;
      const newReps = { ...setReps };
      newReps[viewId] = [...newReps[viewId]];
      newReps[viewId][setIdx] = reps;
      setSetReps(newReps);
      if (sharedPlan && sharedShareId) {
        const exercise = plan.exercises.find(ex => ex.id === viewId);
        const actualExerciseId = exercise?.exerciseId;
        api.saveSharedWorkoutSet(sharedShareId, plan.activeDay?.id, actualExerciseId, setIdx, setWeights[viewId][setIdx], reps)
          .catch(err => console.error('Failed to save shared workout set:', err));
      } else {
        scheduleSetValueSave(viewId, setIdx, setWeights[viewId][setIdx], reps);
      }
    }
  };

  const handleEndWorkout = () => {
    setShowEndWorkoutModal(true);
  };


  const confirmEndWorkout = () => {
    clearInterval(elapsedTimerRef.current);
    localStorage.removeItem(sessionKey);
    setShowEndWorkoutModal(false);
    handleWorkoutComplete();
  };


  const cancelEndWorkout = () => {
    setShowEndWorkoutModal(false);
  };

  const formatElapsed = () => {
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleExerciseNavigation = (newIndex) => {
    setCurrentExerciseIndex(newIndex);
    const nextExercise = plan?.exercises[newIndex];
    const firstIncompleteSet = nextExercise
      ? completedSets[nextExercise.id]?.findIndex(completed => !completed)
      : -1;
    setCurrentSetIndex(firstIncompleteSet >= 0 ? firstIncompleteSet : 0);
  };

  useEffect(() => {
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentExerciseIndex]);

  // Helper values
  if (loading || !plan) {
    if (loadError) {
      return <div className="alert-panel alert-panel--danger page-load-error">{loadError}</div>;
    }
    return <PageLoader label="Inizializzazione allenamento…" />;
  }

  const currentExercise = plan.exercises[currentExerciseIndex];
  const currentExId = currentExercise?.id;
  const plannedTargetReps = Number.parseInt(currentExercise?.reps, 10) || 0;
  const savedTargetReps = Number(setReps[currentExId]?.[currentSetIndex]) || 0;
  const displayedTargetReps = Math.max(plannedTargetReps, savedTargetReps);

  // Check which exercises are fully completed
  const isExerciseFinished = (viewId) => {
    return completedSets[viewId]?.every(c => c === true);
  };

  return (
    <div className="active-workout-app">
      
      {/* Top Session Header */}
      <div className="active-workout-header">
        <div className="active-workout-header__left">
          <h1 className="session-title">{plan.name}</h1>
          {plan.activeDay && <p className="session-subtitle">{plan.activeDay.name}</p>}
        </div>
        <div className="active-workout-header__right">
          <div className="session-timer">
            <Clock size={14} className="icon-accent" />
            {formatElapsed()}
          </div>
          <button onClick={handleEndWorkout} className="workout-end-btn">
            <Square size={12} fill="currentColor" /> Fine
          </button>
        </div>
      </div>

      {/* Main Fullscreen Exercise View */}
      <div ref={contentScrollRef} className="active-workout-content">
        <div className="glass-panel glass-panel--active">
          {/* Card Header: Exercise Name */}
          <div className="active-workout-card__header">
            <span className="exercise-pill">
              Esercizio {currentExerciseIndex + 1} di {plan.exercises.length}
            </span>
            <h2 className="exercise-title">{currentExercise.name}</h2>
            {currentExercise.description && (
              <p className="exercise-description">{currentExercise.description}</p>
            )}
          </div>

          {/* One set at a time */}
          <div className="single-set-progress" aria-label={`Serie ${currentSetIndex + 1} di ${currentExercise.sets}`}>
            <strong>Serie {currentSetIndex + 1} di {currentExercise.sets}</strong>
            <div className="single-set-dots">
              {Array.from({ length: currentExercise.sets }, (_, setIdx) => (
                <button
                  type="button"
                  key={setIdx}
                  aria-label={`Vai alla serie ${setIdx + 1}`}
                  className={`single-set-dot ${completedSets[currentExId]?.[setIdx] ? 'single-set-dot--done' : ''} ${currentSetIndex === setIdx ? 'single-set-dot--active' : ''}`}
                  onClick={() => setCurrentSetIndex(setIdx)}
                />
              ))}
            </div>
          </div>

          <div className={`exercise-set-card exercise-set-card--single ${completedSets[currentExId]?.[currentSetIndex] ? 'exercise-set-card--done' : ''}`}>
            <div className="exercise-set-card-content">
              <div className="exercise-set-top">
                <div className="set-number-block">
                  <div className={`set-number-badge ${completedSets[currentExId]?.[currentSetIndex] ? 'set-number-badge--done' : ''}`}>{currentSetIndex + 1}</div>
                  <div className="set-target"><span className="set-target-title">Target</span><strong className="set-target-value">{displayedTargetReps} reps</strong></div>
                </div>
              </div>
              <div className="set-controls">
                <div className="set-controls-row">
                  <div className={completedSets[currentExId]?.[currentSetIndex] ? 'param-group param-group--disabled' : 'param-group'}><span className="param-label">Peso</span><Stepper placeholder="kg" value={setWeights[currentExId]?.[currentSetIndex]} onChange={value => handleParamChange(currentExId, currentSetIndex, 'weight', value)} /></div>
                  <div className={completedSets[currentExId]?.[currentSetIndex] ? 'param-group param-group--disabled' : 'param-group'}><span className="param-label">Rip.</span><Stepper min={1} placeholder="rep" value={setReps[currentExId]?.[currentSetIndex]} onChange={value => handleParamChange(currentExId, currentSetIndex, 'reps', value)} /></div>
                </div>
                <button onClick={() => handleToggleSet(currentExerciseIndex, currentSetIndex)} className={`set-action-button ${completedSets[currentExId]?.[currentSetIndex] ? 'set-action-button--done' : 'set-action-button--pending'}`}><Check size={20} className="icon-center" /><span>{completedSets[currentExId]?.[currentSetIndex] ? 'Serie completata' : 'Completa serie'}</span></button>
              </div>
            </div>
          </div>

          <div className="single-set-navigation">
            <button type="button" className="btn-secondary series-nav-button" disabled={currentSetIndex === 0} onClick={() => setCurrentSetIndex(index => index - 1)}><ChevronLeft size={16} /><span>Serie precedente</span></button>
            <button type="button" className="btn-secondary series-nav-button" disabled={currentSetIndex === currentExercise.sets - 1} onClick={() => setCurrentSetIndex(index => index + 1)}><span>Serie successiva</span><ChevronRight size={16} /></button>
          </div>

          {/* Navigation Controls inside Card */}
          <div className="workout-nav-actions">
            <button
              onClick={() => handleExerciseNavigation(Math.max(0, currentExerciseIndex - 1))}
              disabled={currentExerciseIndex === 0}
              className="btn-secondary btn-secondary--block exercise-nav-button"
            >
              <SkipBack size={16} />
              <span className="exercise-nav-button__text"><small>Esercizio</small><span>Precedente</span></span>
            </button>
            <button
              onClick={() => handleExerciseNavigation(Math.min(plan.exercises.length - 1, currentExerciseIndex + 1))}
              disabled={currentExerciseIndex === plan.exercises.length - 1}
              className="btn-secondary btn-secondary--block exercise-nav-button"
            >
              <span className="exercise-nav-button__text"><small>Esercizio</small><span>Successivo</span></span>
              <SkipForward size={16} />
            </button>
          </div>
        </div>
      </div>

      <div
        className="bottom-sheet"
        style={{ '--drawer-height': `${drawerHeight}px` }}
      >
        <div className={`bottom-sheet__inner ${showBottomDrawer ? 'bottom-sheet__inner--open' : ''}`}>
          <button
            onClick={toggleDrawer}
            onPointerDown={handleDrawerPointerDown}
            onPointerMove={handleDrawerPointerMove}
            onPointerUp={handleDrawerPointerUp}
            onPointerCancel={handleDrawerPointerUp}
            className="bottom-toggle-bar"
            type="button"
          >
            <span>Vedi tutti gli esercizi</span>
            {showBottomDrawer ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>

          <div className="drawer-panel" aria-hidden={!showBottomDrawer}>
            <h3 className="drawer-heading">Programma Esercizi</h3>
            {plan.exercises.map((item, idx) => {
              const isActive = idx === currentExerciseIndex;
              const finished = isExerciseFinished(item.id);
              const itemClasses = [
                'drawer-item',
                isActive ? 'drawer-item--active' : 'drawer-item--inactive',
                finished ? 'drawer-item--finished' : ''
              ].join(' ');
              return (
                <div
                  key={item.id}
                  className={itemClasses}
                  onClick={() => {
                    handleExerciseNavigation(idx);
                    closeDrawer();
                  }}
                >
                  <div className="drawer-item-left">
                    <div className={`drawer-item-status ${isActive ? 'drawer-item-status--active' : finished ? 'drawer-item-status--finished' : ''}`} />
                    <span className={`drawer-item-title ${isActive ? 'drawer-item-title--active' : ''}`}>{item.name}</span>
                  </div>
                  {finished ? (
                    <CheckCircle2 size={16} className="icon-success" />
                  ) : (
                    <span className="subtle-text">{item.sets} set</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showEndWorkoutModal && (
        <ConfirmModal
          title="Terminare allenamento?"
          message="Sei sicuro di voler completare questa sessione? I dati salvati non andranno persi."
          confirmText="Termina"
          cancelText="Annulla"
          onConfirm={confirmEndWorkout}
          onCancel={cancelEndWorkout}
        />
      )}

      {/* FULLSCREEN REST TIMER OVERLAY */}
      {showTimer && (
        <div className="timer-overlay">
          <span className="timer-label">TEMPO DI RECUPERO</span>
          <h2 className="timer-title">{timerExerciseName}</h2>

          {/* Large Circular Countdown Timer */}
          <div className="timer-circle-wrapper">
            {/* SVG circle backdrop */}
            <svg className="timer-circle-svg" viewBox="0 0 220 220">
              <circle cx="110" cy="110" r="100" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
              <circle 
                cx="110" 
                cy="110" 
                r="100" 
                stroke="var(--accent-orange)" 
                strokeWidth="6" 
                fill="transparent"
                strokeDasharray="628"
                strokeDashoffset={628 - (628 * timerSecondsLeft) / timerDuration}
                className="timer-circle"
              />
            </svg>
            <span className="timer-value">{timerSecondsLeft}</span>
          </div>

          {/* Rest Control Buttons */}
          <div className="timer-controls">
            <div className="timer-action-row">
              <button 
                onClick={() => setTimerSecondsLeft(prev => prev + 10)}
                className="btn-secondary btn-secondary--block"
              >
                +10s
              </button>
              <button 
                onClick={() => setTimerSecondsLeft(prev => Math.max(0, prev - 10))}
                className="btn-secondary btn-secondary--block"
              >
                -10s
              </button>
            </div>
            
            <button 
              onClick={() => {
                clearInterval(restTimerRef.current);
                setTimerIsActive(false);
                setShowTimer(false);
              }}
              className="btn-primary btn-primary--success"
            >
              SALTA RECUPERO
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
