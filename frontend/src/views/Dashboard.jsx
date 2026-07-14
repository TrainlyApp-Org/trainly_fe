import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Plus, Play, Trash2, Calendar, Dumbbell, User, LogOut, ChevronRight, Pencil, Share2 } from 'lucide-react';

export default function Dashboard({ onStartWorkout, onCreateWorkout, onEditWorkout, onViewProfile, onLogout }) {
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' or 'history'
  const [userProfile, setUserProfile] = useState(null);
  const [planToStart, setPlanToStart] = useState(null);
  const [selectedDayId, setSelectedDayId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const plansData = await api.getWorkouts();
      setWorkoutPlans(plansData.workoutPlans || []);
      
      const historyData = await api.getWorkoutHistory();
      setHistory(historyData.history || []);

      const profileData = await api.getProfile();
      setUserProfile(profileData.profile);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Sei sicuro di voler eliminare questa scheda?')) return;

    try {
      await api.deleteWorkout(id);
      setWorkoutPlans(workoutPlans.filter(plan => plan.id !== id));
    } catch (err) {
      alert(err.message || 'Impossibile eliminare la scheda.');
    }
  };

  const handleShare = async (id, e) => {
    e.stopPropagation();
    try {
      const { shareId } = await api.createShareLink(id);
      const link = `${window.location.origin}${window.location.pathname}?share=${shareId}`;

      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(link);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = link;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'absolute';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      alert('Link condivisibile copiato negli appunti.');
    } catch (err) {
      alert(err.message || 'Impossibile creare il link.');
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getDuration = (start, end) => {
    if (!start || !end) return '';
    const diffMs = new Date(end) - new Date(start);
    const diffMins = Math.round(diffMs / 60000);
    return `${diffMins} min`;
  };

  const chooseDay = async (plan) => {
    try {
      const details = await api.getWorkoutDetails(plan.id);
      setPlanToStart(details);
      setSelectedDayId(details.days?.[0]?.id || null);
    } catch (err) {
      alert(err.message || 'Impossibile aprire la scheda.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header Profile Area */}
      <div style={{
        padding: '24px 20px 16px 20px',
        background: 'linear-gradient(to bottom, rgba(255, 122, 0, 0.15), transparent)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} onClick={onViewProfile}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-orange)'
          }}>
            <User size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ciao,</span>
            <span style={{ fontSize: '16px', fontWeight: '700', fontFamily: 'var(--font-family-title)' }}>
              {userProfile?.full_name || userProfile?.username || 'Atleta'}
            </span>
          </div>
        </div>

        <button 
          onClick={onLogout}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-secondary)',
            cursor: 'pointer'
          }}
          title="Esci"
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Segmented Controls Tab */}
      <div style={{ padding: '0 20px', marginBottom: '20px' }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '4px',
          display: 'flex'
        }}>
          <button
            onClick={() => setActiveTab('plans')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'plans' ? 'var(--bg-secondary)' : 'transparent',
              color: activeTab === 'plans' ? 'var(--accent-orange)' : 'var(--color-secondary)',
              fontWeight: '600',
              fontFamily: 'var(--font-family-title)',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            Le mie Schede
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'history' ? 'var(--bg-secondary)' : 'transparent',
              color: activeTab === 'history' ? 'var(--accent-orange)' : 'var(--color-secondary)',
              fontWeight: '600',
              fontFamily: 'var(--font-family-title)',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            Cronologia
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 80px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-secondary)' }}>
            <Dumbbell size={28} className="pulse-effect" style={{ margin: '0 auto 12px auto', display: 'block', color: 'var(--accent-orange)' }} />
            Caricamento in corso...
          </div>
        ) : activeTab === 'plans' ? (
          <>
            {workoutPlans.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '48px 24px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '24px',
                border: '1px dashed var(--border-color)',
                marginTop: '10px'
              }}>
                <Dumbbell size={36} style={{ color: 'var(--color-muted)', marginBottom: '16px' }} />
                <h3 style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '600' }}>Nessuna scheda creata</h3>
                <p style={{ color: 'var(--color-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                  Crea la tua prima scheda per organizzare gli allenamenti e tracciare i progressi.
                </p>
                <button className="btn-primary" onClick={onCreateWorkout} style={{ margin: '0 auto', maxWidth: '200px' }}>
                  <Plus size={18} /> Nuova Scheda
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {workoutPlans.map(plan => (
                  <div 
                    key={plan.id} 
                    className="glass-panel" 
                    onClick={() => chooseDay(plan)}
                    style={{
                      padding: '20px',
                      cursor: 'pointer',
                      borderLeft: '4px solid var(--accent-orange)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{plan.name}</h3>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEditWorkout(plan.id); }}
                        style={{ background: 'none', border: 'none', color: 'var(--color-secondary)', cursor: 'pointer', padding: '4px' }}
                        title="Modifica scheda"
                      ><Pencil size={16} /></button>
                      <button 
                        onClick={(e) => handleShare(plan.id, e)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-secondary)', cursor: 'pointer', padding: '4px' }}
                        title="Crea link condivisibile"
                      ><Share2 size={16} /></button>
                      <button 
                        onClick={(e) => handleDelete(plan.id, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-muted)',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {plan.description && (
                      <p style={{ color: 'var(--color-secondary)', fontSize: '13px', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {plan.description}
                      </p>
                    )}

                    {(plan.days || []).length > 0 && (
                      <p style={{ color: 'var(--color-secondary)', fontSize: '12px', marginBottom: '12px' }}>
                        {(plan.days || []).length} {(plan.days || []).length === 1 ? 'giorno' : 'giorni'}: {(plan.days || []).map(day => day.name).join(' · ')}
                      </p>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        {new Date(plan.created_at).toLocaleDateString('it-IT')}
                      </span>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(255, 122, 0, 0.1)',
                        color: 'var(--accent-orange)',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '700'
                      }}>
                        <Play size={12} fill="currentColor" />
                        Inizia
                      </div>
                    </div>
                  </div>
                ))}

                <button 
                  className="btn-primary" 
                  onClick={onCreateWorkout} 
                  style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'calc(100% - 40px)',
                    maxWidth: '400px',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
                    zIndex: 99
                  }}
                >
                  <Plus size={20} /> Crea Nuova Scheda
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {history.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '48px 24px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '24px',
                border: '1px dashed var(--border-color)',
                marginTop: '10px'
              }}>
                <Calendar size={36} style={{ color: 'var(--color-muted)', marginBottom: '16px' }} />
                <h3 style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '600' }}>Ancora nessun allenamento</h3>
                <p style={{ color: 'var(--color-secondary)', fontSize: '14px' }}>
                  Gli allenamenti che completi verranno mostrati qui con statistiche e date.
                </p>
              </div>
            ) : (
              history.map(log => (
                <div key={log.id} className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>
                      {log.workout_plan?.name || 'Allenamento Libero'}
                    </h4>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--color-secondary)' }}>
                      <span>{formatDate(log.started_at)}</span>
                      <span>•</span>
                      <span style={{ color: 'var(--accent-green)', fontWeight: '600' }}>
                        {getDuration(log.started_at, log.completed_at)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--color-muted)' }} />
                </div>
              ))
            )}
          </div>
        )}
      </div>
      {planToStart && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 300, background: 'var(--bg-primary)', display: 'flex' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', height: '100%', overflowY: 'auto', padding: '32px 20px calc(32px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '6px' }}>{planToStart.name}</h2>
            {planToStart.description && <p style={{ color: 'var(--color-secondary)', fontSize: '13px', marginBottom: '18px' }}>{planToStart.description}</p>}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '16px' }}>
              {planToStart.days.map(day => (
                <button key={day.id} onClick={() => setSelectedDayId(day.id)} style={{ flex: '0 0 auto', border: `1px solid ${selectedDayId === day.id ? 'var(--accent-orange)' : 'var(--border-color)'}`, background: selectedDayId === day.id ? 'rgba(255,122,0,.14)' : 'rgba(255,255,255,.03)', color: selectedDayId === day.id ? 'var(--accent-orange)' : 'var(--color-secondary)', padding: '9px 12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>
                  {day.name}
                </button>
              ))}
            </div>
            {(() => {
              const day = planToStart.days.find(item => item.id === selectedDayId) || planToStart.days[0];
              return <>
                <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>Esercizi da fare</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto', marginBottom: '16px', minHeight: 0 }}>
                  {day.exercises.map((exercise, index) => <div key={exercise.id} style={{ padding: '10px 12px', background: 'rgba(255,255,255,.03)', borderRadius: '10px', fontSize: '13px' }}><strong>{index + 1}. {exercise.name}</strong><span style={{ color: 'var(--color-secondary)', marginLeft: '8px' }}>{exercise.sets} × {exercise.reps}</span></div>)}
                </div>
                <button className="btn-primary" onClick={() => onStartWorkout(planToStart.id, day.id)}><Play size={16} fill="currentColor" /> Avvia {day.name}</button>
              </>;
            })()}
            <button onClick={() => setPlanToStart(null)} style={{ width: '100%', background: 'none', border: 'none', color: 'var(--color-secondary)', padding: '16px', cursor: 'pointer' }}>Chiudi</button>
          </div>
        </div>
      )}
    </div>
  );
}
