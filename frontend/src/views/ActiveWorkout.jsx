import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api';
import { Check, CheckCircle2, ChevronDown, ChevronUp, Clock, Dumbbell, Play, RefreshCw, SkipForward, Square, User } from 'lucide-react';

function Stepper({ value, onChange, min = 0, placeholder }) {
  const change = (next) => onChange(Math.max(min, next));
  return <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
    <button type="button" className="stepper-button" onClick={() => change((Number(value) || 0) - 1)} style={{ width: '30px', height: '30px', borderRadius: '10px', background: 'rgba(255,255,255,.08)', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '16px', flexShrink: 0 }}>−</button>
    <input type="number" placeholder={placeholder} style={{ minHeight: '34px', padding: '6px 8px', textAlign: 'center', fontSize: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', color: 'var(--color-primary)', width: '56px' }} value={value || ''} onChange={e => onChange(e.target.value)} />
    <button type="button" className="stepper-button" onClick={() => change((Number(value) || 0) + 1)} style={{ width: '30px', height: '30px', borderRadius: '10px', background: 'rgba(255,255,255,.08)', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '16px', flexShrink: 0 }}>+</button>
  </div>;
}

export default function ActiveWorkout({ workoutPlanId, workoutDayId, sharedPlan, sharedShareId, onWorkoutComplete }) {
  const [plan, setPlan] = useState(null);
  const [logId, setLogId] = useState(null);
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
      setPlan(planData);

      let activeLog = null;
      if (!sharedPlan) {
        activeLog = await api.getActiveWorkout(workoutPlanId, workoutDayId).catch(err => {
          if (!err.message?.includes('Active workout log not found')) {
            console.error('Failed to load active workout log:', err);
          }
          return null;
        });
      }

      if (!sharedPlan && !activeLog) {
        const logData = await api.startWorkoutLog(workoutPlanId, workoutDayId);
        setLogId(logData.logId);
      } else if (activeLog) {
        setLogId(activeLog.logId);
      }

      // 3. Initialize state maps for all sets
      const initialCompleted = {};
      const initialWeights = {};
      const initialReps = {};
      const savedDetails = activeLog?.details || [];
      const savedLookup = savedDetails.reduce((acc, detail) => {
        if (!acc[detail.exercise_id]) acc[detail.exercise_id] = {};
        acc[detail.exercise_id][detail.set_index] = detail;
        return acc;
      }, {});
      
      planData.exercises.forEach(ex => {
        const viewId = ex.id;
        const exerciseSaved = savedLookup[ex.exercise_id] || {};
        initialCompleted[viewId] = Array.from({ length: ex.sets }, (_, index) => exerciseSaved[index]?.completed ?? false);
        initialWeights[viewId] = Array.from({ length: ex.sets }, (_, index) => exerciseSaved[index]?.weight ?? ex.set_values?.[index]?.weight ?? ex.weight ?? 0);
        initialReps[viewId] = Array.from({ length: ex.sets }, (_, index) => exerciseSaved[index]?.reps ?? ex.set_values?.[index]?.reps ?? (parseInt(ex.reps) || 10));
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
    const actualExerciseId = exercise.exercise_id;
    
    const isCompleted = !completedSets[viewId][setIdx];
    const repsDone = setReps[viewId][setIdx];
    const weightDone = setWeights[viewId][setIdx];

    // Toggle local state
    const newCompleted = { ...completedSets };
    newCompleted[viewId] = [...newCompleted[viewId]];
    newCompleted[viewId][setIdx] = isCompleted;
    setCompletedSets(newCompleted);

    try {
      // Log set to backend
      if (logId) await api.logWorkoutSet(logId, actualExerciseId, setIdx, repsDone, weightDone, isCompleted);

      // If marked as complete, trigger rest timer
      if (isCompleted) {
        startRestTimer(exercise.rest_time || 60);
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

  const handleEndWorkout = async () => {
    if (!confirm('Vuoi davvero completare e terminare questo allenamento?')) return;

    try {
      if (logId) {
        const savePromises = plan.exercises.flatMap(exercise => {
          const viewId = exercise.id;
          const actualExerciseId = exercise.exercise_id;
          const weights = setWeights[viewId] || [];
          const reps = setReps[viewId] || [];
          const completed = completedSets[viewId] || [];

          return Array.from({ length: exercise.sets }, (_, setIdx) => {
            return api.logWorkoutSet(
              logId,
              actualExerciseId,
              setIdx,
              reps[setIdx] ?? 0,
              weights[setIdx] ?? 0,
              completed[setIdx] ?? false
            );
          });
        });

        await Promise.all(savePromises);
      }

      if (logId) await api.completeWorkoutLog(logId);
      clearInterval(elapsedTimerRef.current);
      onWorkoutComplete();
    } catch (err) {
      console.error('Failed saving workout data before complete:', err);
      alert('Impossibile salvare l\'allenamento.');
    }
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--color-secondary)' }}>
        <Dumbbell size={32} className="pulse-effect" style={{ color: 'var(--accent-orange)', marginBottom: '16px' }} />
        Inizializzazione sessione di allenamento...
      </div>
    );
  }

  const currentExercise = plan.exercises[currentExerciseIndex];
  const currentExId = currentExercise?.id;

  // Check which exercises are fully completed
  const isExerciseFinished = (viewId) => {
    return completedSets[viewId]?.every(c => c === true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', background: '#070b13' }}>
      
      {/* Top Session Header */}
      <div style={{
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(11, 15, 25, 0.8)'
      }}>
        <div>
          <h2 style={{ fontSize: '15px', color: 'var(--accent-orange)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>In Corso</h2>
          <h1 style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-family-title)' }}>{plan.name}</h1>
          {plan.activeDay && <p style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>{plan.activeDay.name}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255,255,255,0.05)',
            padding: '6px 12px',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'var(--font-family-title)',
            fontWeight: '600'
          }}>
            <Clock size={14} style={{ color: 'var(--accent-orange)' }} />
            {formatElapsed()}
          </div>
          <button 
            onClick={handleEndWorkout}
            style={{
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '8px 12px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Square size={12} fill="currentColor" /> Fine
          </button>
        </div>
      </div>

      {/* Main Fullscreen Exercise View */}
      <div ref={contentScrollRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 20px 84px', overflowY: 'auto' }}>
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid var(--border-active)' }}>
          {/* Card Header: Exercise Name */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{
              display: 'inline-block',
              background: 'rgba(255, 122, 0, 0.1)',
              color: 'var(--accent-orange)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '700',
              marginBottom: '10px',
              textTransform: 'uppercase'
            }}>
              Esercizio {currentExerciseIndex + 1} di {plan.exercises.length}
            </span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px' }}>{currentExercise.name}</h2>
            {currentExercise.description && (
              <p style={{ color: 'var(--color-secondary)', fontSize: '13px' }}>{currentExercise.description}</p>
            )}
          </div>

          {/* Sets Logger */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {Array(currentExercise.sets).fill(null).map((_, setIdx) => {
              const setLogged = completedSets[currentExId]?.[setIdx] || false;
              return (
                <div 
                  key={setIdx} 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    padding: '16px 16px 12px',
                    borderRadius: '18px',
                    background: setLogged ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${setLogged ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`
                  }}
                >

                  {/* Set Inputs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: setLogged ? 'var(--accent-green)' : 'rgba(255,255,255,0.05)', color: setLogged ? '#0b0f19' : 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px' }}>
                          {setIdx + 1}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <span style={{ display: 'block', fontSize: '13px', color: 'var(--color-secondary)' }}>Target</span>
                          <strong style={{ fontSize: '16px', color: 'var(--color-primary)' }}>{currentExercise.reps} reps</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', minWidth: '120px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>Peso</span>
                          <div style={{ opacity: setLogged ? 0.6 : 1, pointerEvents: setLogged ? 'none' : 'auto' }}>
                            <Stepper placeholder="kg" value={setWeights[currentExId]?.[setIdx]} onChange={value => handleParamChange(currentExId, setIdx, 'weight', value)} />
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', minWidth: '120px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>Rip.</span>
                          <div style={{ opacity: setLogged ? 0.6 : 1, pointerEvents: setLogged ? 'none' : 'auto' }}>
                            <Stepper min={1} placeholder="rep" value={setReps[currentExId]?.[setIdx]} onChange={value => handleParamChange(currentExId, setIdx, 'reps', value)} />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleSet(currentExerciseIndex, setIdx)}
                        style={{
                          width: '100%',
                          height: '44px',
                          borderRadius: '14px',
                          border: 'none',
                          background: setLogged ? 'var(--accent-green)' : 'rgba(255, 122, 0, 0.16)',
                          color: setLogged ? '#fff' : 'var(--accent-orange)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                          flexShrink: 0
                        }}
                      >
                        <Check size={20} style={{ margin: 'auto' }} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Controls inside Card */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', width: '100%' }}>
            <button
              onClick={() => handleExerciseNavigation(Math.max(0, currentExerciseIndex - 1))}
              disabled={currentExerciseIndex === 0}
              className="btn-secondary"
              style={{ flex: 1, padding: '12px' }}
            >
              Precedente
            </button>
            <button
              onClick={() => handleExerciseNavigation(Math.min(plan.exercises.length - 1, currentExerciseIndex + 1))}
              disabled={currentExerciseIndex === plan.exercises.length - 1}
              className="btn-secondary"
              style={{ flex: 1, padding: '12px' }}
            >
              Successivo <SkipForward size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Persistent Bottom Bar to toggle navigation drawer */}
      <button 
        onClick={() => setShowBottomDrawer(!showBottomDrawer)}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '60px',
          background: 'rgba(22, 30, 46, 0.95)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--color-primary)',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          fontFamily: 'var(--font-family-title)',
          zIndex: 110,
          borderBottomLeftRadius: 'inherit',
          borderBottomRightRadius: 'inherit'
        }}
      >
        Vedi tutti gli esercizi
        {showBottomDrawer ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
      </button>

      {/* Slide-Up Bottom Drawer showing Done / Active / Upcoming Exercises */}
      {showBottomDrawer && (
        <div style={{
          position: 'absolute',
          bottom: '60px',
          left: 0,
          width: '100%',
          maxHeight: '280px',
          background: 'rgba(11, 15, 25, 0.98)',
          borderTop: '2px solid var(--border-color)',
          zIndex: 105,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: '0 -10px 30px rgba(0,0,0,0.5)',
          animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <h3 style={{ fontSize: '13px', color: 'var(--color-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>Programma Esercizi</h3>
          {plan.exercises.map((item, idx) => {
            const isActive = idx === currentExerciseIndex;
            const finished = isExerciseFinished(item.id);
            return (
              <div 
                key={item.id}
                onClick={() => {
                  setCurrentExerciseIndex(idx);
                  setShowBottomDrawer(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: isActive ? 'rgba(255, 122, 0, 0.1)' : 'rgba(255,255,255,0.01)',
                  border: `1px solid ${isActive ? 'rgba(255, 122, 0, 0.3)' : 'transparent'}`,
                  cursor: 'pointer',
                  opacity: isActive ? 1 : finished ? 0.6 : 0.4,
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isActive ? 'var(--accent-orange)' : finished ? 'var(--accent-green)' : 'var(--color-muted)',
                    boxShadow: isActive ? '0 0 8px var(--accent-orange)' : 'none'
                  }} />
                  <span style={{ fontSize: '14px', fontWeight: isActive ? '700' : '500' }}>{item.name}</span>
                </div>
                
                {finished ? (
                  <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} />
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{item.sets} set</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* FULLSCREEN REST TIMER OVERLAY */}
      {showTimer && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle, #101726 0%, #030712 100%)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px',
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <span style={{ fontSize: '14px', color: 'var(--accent-orange)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
            TEMPO DI RECUPERO
          </span>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '40px', color: 'var(--color-primary)', textTransform: 'uppercase' }}>
            {currentExercise.name}
          </h2>

          {/* Large Circular Countdown Timer */}
          <div style={{ position: 'relative', width: '220px', height: '220px', marginBottom: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {/* SVG circle backdrop */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
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
            <span style={{ fontSize: '64px', fontWeight: '800', fontFamily: 'var(--font-family-title)' }}>
              {timerSecondsLeft}
            </span>
          </div>

          {/* Rest Control Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '280px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setTimerSecondsLeft(prev => prev + 10)}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px' }}
              >
                +10s
              </button>
              <button 
                onClick={() => setTimerSecondsLeft(prev => Math.max(0, prev - 10))}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px' }}
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
              className="btn-primary"
              style={{ background: 'var(--accent-green)' }}
            >
              SALTA RECUPERO
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
