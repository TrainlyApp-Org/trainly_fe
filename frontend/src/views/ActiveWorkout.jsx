import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api';
import { Check, CheckCircle2, ChevronDown, ChevronUp, Clock, Dumbbell, Play, RefreshCw, SkipForward, Square, User } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

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

export default function ActiveWorkout({ workoutPlanId, workoutDayId, sharedPlan, sharedShareId, onWorkoutComplete }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Navigation & logging
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState({}); // { [exId]: [set0_completed, set1_completed, ...] }
  const [setWeights, setSetWeights] = useState({}); // { [exId]: [weight0, weight1, ...] }
  const [setReps, setSetReps] = useState({}); // { [exId]: [reps0, reps1, ...] }
  
  // Elapsed Workout Time
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedTimerRef = useRef(null);

  // Fullscreen Rest Timer State
  const [showTimer, setShowTimer] = useState(false);
  const [timerDuration, setTimerDuration] = useState(60);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(60);
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

      setPlan(normalizedPlan);

      // Logging allenamenti non ancora implementato

      // 3. Initialize state maps for all sets
      const initialCompleted = {};
      const initialWeights = {};
      const initialReps = {};
      const savedDetails = [];
      const savedLookup = savedDetails.reduce((acc, detail) => {
        if (!acc[detail.exerciseId]) acc[detail.exerciseId] = {};
        acc[detail.exerciseId][detail.set_index] = detail;
        return acc;
      }, {});
      
      normalizedPlan.exercises.forEach(ex => {
        const viewId = ex.id;
        initialCompleted[viewId] =
          Array.from({ length: ex.sets }, () => false);

        initialWeights[viewId] =
          Array.from({ length: ex.sets }, () => 0);

        initialReps[viewId] =
          Array.from({ length: ex.sets }, () => parseInt(ex.reps) || 10);
      });

      setCompletedSets(initialCompleted);
      setSetWeights(initialWeights);
      setSetReps(initialReps);

      // 4. Start workout timer
      elapsedTimerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error starting active workout:', err);
    } finally {
      setLoading(false);
    }
  };

  // Rest Timer Controller
  const startRestTimer = (seconds) => {
    clearInterval(restTimerRef.current);
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
        startRestTimer(exercise.restTime || 60);
      }
    } catch (err) {
      console.error('Failed to log set:', err);
    }
  };

  const handleParamChange = (viewId, setIdx, param, val) => {
    if (param === 'weight') {
      const newWeights = { ...setWeights };
      newWeights[viewId] = [...newWeights[viewId]];
      newWeights[viewId][setIdx] = parseFloat(val) || 0;
      setSetWeights(newWeights);
      if (sharedPlan && sharedShareId) {
        const exercise = plan.exercises.find(ex => ex.id === viewId);
        const actualExerciseId = exercise?.exercise_id;
        api.saveSharedWorkoutSet(sharedShareId, plan.activeDay?.id, actualExerciseId, setIdx, parseFloat(val) || 0, setReps[viewId][setIdx])
          .catch(err => console.error('Failed to save shared workout set:', err));
      }
    } else if (param === 'reps') {
      const newReps = { ...setReps };
      newReps[viewId] = [...newReps[viewId]];
      newReps[viewId][setIdx] = parseInt(val) || 0;
      setSetReps(newReps);
      if (sharedPlan && sharedShareId) {
        const exercise = plan.exercises.find(ex => ex.id === viewId);
        const actualExerciseId = exercise?.exercise_id;
        api.saveSharedWorkoutSet(sharedShareId, plan.activeDay?.id, actualExerciseId, setIdx, setWeights[viewId][setIdx], parseInt(val) || 0)
          .catch(err => console.error('Failed to save shared workout set:', err));
      }
    }
  };

  const handleEndWorkout = () => {
    setShowEndWorkoutModal(true);
  };


  const confirmEndWorkout = () => {
    clearInterval(elapsedTimerRef.current);

    setShowEndWorkoutModal(false);

    onWorkoutComplete();
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
  };

  useEffect(() => {
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentExerciseIndex]);

  // Helper values
  if (loading || !plan) {
    return (
      <div className="auth-screen auth-screen--centered">
        <div className="shared-workout-empty-center">
          <Dumbbell size={32} className="pulse-effect icon-pulse-orange" />
          <p className="subtle-text">Inizializzazione sessione di allenamento...</p>
        </div>
      </div>
    );
  }

  const currentExercise = plan.exercises[currentExerciseIndex];
  const currentExId = currentExercise?.id;

  console.log('INDEX:', currentExerciseIndex);
  console.log('LENGTH:', plan.exercises.length);
  console.log('DISABLED:', currentExerciseIndex === plan.exercises.length - 1); 

  // Check which exercises are fully completed
  const isExerciseFinished = (viewId) => {
    return completedSets[viewId]?.every(c => c === true);
  };

  return (
    <div className="active-workout-app">
      
      {/* Top Session Header */}
      <div className="active-workout-header">
        <div className="active-workout-header__left">
          <span className="session-pill">In Corso</span>
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

          {/* Sets Logger */}
          <div className="exercise-set-list">
            {Array(currentExercise.sets).fill(null).map((_, setIdx) => {
              const setLogged = completedSets[currentExId]?.[setIdx] || false;
              return (
                <div 
                  key={setIdx} 
                  className={`exercise-set-card ${setLogged ? 'exercise-set-card--done' : ''}`}
                >

                  {/* Set Inputs */}
                  <div className="exercise-set-card-content">
                    <div className="exercise-set-top">
                      <div className="set-number-block">
                        <div className={`set-number-badge ${setLogged ? 'set-number-badge--done' : ''}`}>
                          {setIdx + 1}
                        </div>
                        <div className="set-target">
                          <span className="set-target-title">Target</span>
                          <strong className="set-target-value">{currentExercise.reps} reps</strong>
                        </div>
                      </div>
                    </div>

                    <div className="set-controls">
                      <div className="set-controls-row">
                        <div className={setLogged ? 'param-group param-group--disabled' : 'param-group'}>
                          <span className="param-label">Peso</span>
                          <Stepper placeholder="kg" value={setWeights[currentExId]?.[setIdx]} onChange={value => handleParamChange(currentExId, setIdx, 'weight', value)} />
                        </div>

                        <div className={setLogged ? 'param-group param-group--disabled' : 'param-group'}>
                          <span className="param-label">Rip.</span>
                          <Stepper min={1} placeholder="rep" value={setReps[currentExId]?.[setIdx]} onChange={value => handleParamChange(currentExId, setIdx, 'reps', value)} />
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleSet(currentExerciseIndex, setIdx)}
                        className={`set-action-button ${setLogged ? 'set-action-button--done' : 'set-action-button--pending'}`}
                      >
                        <Check size={20} className="icon-center" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Controls inside Card */}
          <div className="workout-nav-actions">
            <button
              onClick={() => handleExerciseNavigation(Math.max(0, currentExerciseIndex - 1))}
              disabled={currentExerciseIndex === 0}
              className="btn-secondary btn-secondary--block"
            >
              Precedente
            </button>
            <button
              onClick={() => handleExerciseNavigation(Math.min(plan.exercises.length - 1, currentExerciseIndex + 1))}
              disabled={currentExerciseIndex === plan.exercises.length - 1}
              className="btn-secondary btn-secondary--block"
            >
              Successivo <SkipForward size={14} />
            </button>
          </div>
        </div>
      </div>

      <div
        className="bottom-sheet"
        style={{ height: `${drawerHeight}px` }}
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
                    setCurrentExerciseIndex(idx);
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
          <h2 className="timer-title">{currentExercise.name}</h2>

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
