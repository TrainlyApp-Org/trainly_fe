import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Plus, Play, Trash2, Calendar, Dumbbell, User, LogOut, ChevronRight, Pencil, Share2, X } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

export default function Dashboard({ onStartWorkout, onCreateWorkout, onEditWorkout, onViewProfile, onLogout }) {
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' or 'history'
  const [userProfile, setUserProfile] = useState(null);
  const [planToStart, setPlanToStart] = useState(null);
  const [selectedDayId, setSelectedDayId] = useState(null);

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    id: null
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const plansData = await api.getWorkouts();
      setWorkoutPlans(plansData.workouts || []);

      const storedUser = localStorage.getItem('trainly_user');

      if (storedUser) {
        setUserProfile(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id, e) => {
      e.stopPropagation();

      setDeleteModal({
        open: true,
        id
      });
  };

  const confirmDelete = async () => {

    const id = deleteModal.id;

    try {
      await api.deleteWorkout(id);

      setWorkoutPlans(
        workoutPlans.filter(plan => plan.id !== id)
      );

    } catch (err) {
      alert(err.message || 'Impossibile eliminare la scheda.');
    }

    setDeleteModal({
      open: false,
      id: null
    });
  };


  const cancelDelete = () => {
    setDeleteModal({
      open: false,
      id: null
    });
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
    <div className="dashboard-page">
      {/* Header Profile Area */}
      <div className="dashboard-header">
        <div className="dashboard-profile" onClick={onViewProfile}>
          <div className="dashboard-avatar">
            <User size={22} />
          </div>
          <div>
            <span className="dashboard-greeting">Ciao,</span>
            <span className="dashboard-username">
              {userProfile?.full_name || userProfile?.username || 'Atleta'}
            </span>
          </div>
        </div>

        <button className="dashboard-logout-button" onClick={onLogout} title="Esci">
          <LogOut size={18} />
        </button>
      </div>

      {/* Segmented Controls Tab */}
      <div className="dashboard-tabs">
        <div className="dashboard-tab-group">
          <button
            onClick={() => setActiveTab('plans')}
            className={`dashboard-tab ${activeTab === 'plans' ? 'dashboard-tab--active' : 'dashboard-tab--inactive'}`}
          >
            Le mie Schede
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`dashboard-tab ${activeTab === 'history' ? 'dashboard-tab--active' : 'dashboard-tab--inactive'}`}
          >
            Cronologia
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="dashboard-content">
        {loading ? (
          <div className="dashboard-loading">
            <Dumbbell size={28} className="pulse-effect dashboard-loading-icon" />
            Caricamento in corso...
          </div>
        ) : activeTab === 'plans' ? (
          <>
            {workoutPlans.length === 0 ? (
              <div className="dashboard-empty-card">
                <Dumbbell size={36} className="dashboard-loading-icon" />
                <h3>Nessuna scheda creata</h3>
                <p>Crea la tua prima scheda per organizzare gli allenamenti e tracciare i progressi.</p>
                <button className="btn-primary dashboard-empty-action" onClick={onCreateWorkout}>
                  <Plus size={18} /> Nuova Scheda
                </button>
              </div>
            ) : (
              <div className="dashboard-plan-list">
                {workoutPlans.map(plan => (
                  <div 
                    key={plan.id} 
                    className="glass-panel dashboard-card" 
                    onClick={() => chooseDay(plan)}
                  >
                    <div className="dashboard-card-header">
                      <div className="dashboard-card-actions">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onEditWorkout(plan.id); }}
                          className="icon-button"
                          title="Modifica scheda"
                        ><Pencil size={16} /></button>
                        <button 
                          onClick={(e) => handleShare(plan.id, e)}
                          className="icon-button"
                          title="Crea link condivisibile"
                        ><Share2 size={16} /></button>
                        <button 
                          onClick={(e) => handleDelete(plan.id, e)}
                          className="icon-button icon-button--muted"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <h3 className="dashboard-card-title">{plan.name}</h3>
                    </div>

                    {plan.description && (
                      <p className="dashboard-card-description">
                        {plan.description}
                      </p>
                    )}

                    {(plan.days || []).length > 0 && (
                      <p className="dashboard-card-days">
                        {(plan.days || []).length} {(plan.days || []).length === 1 ? 'giorno' : 'giorni'}: {(plan.days || []).map(day => day.name).join(' · ')}
                      </p>
                    )}

                    <div className="dashboard-plan-meta">
                      <span className="dashboard-plan-date">
                        <Calendar size={12} />
                        {new Date(plan.createdAt).toLocaleDateString('it-IT')}
                      </span>
                      <div className="dashboard-badge">
                        <Play size={12} fill="currentColor" />
                        Inizia
                      </div>
                    </div>
                  </div>
                ))}

                <button 
                  className="btn-primary dashboard-fixed-action" 
                  onClick={onCreateWorkout}
                >
                  <Plus size={20} /> Crea Nuova Scheda
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="dashboard-history-list">
            {history.length === 0 ? (
              <div className="dashboard-empty-card">
                <Calendar size={36} className="dashboard-loading-icon" />
                <h3>Ancora nessun allenamento</h3>
                <p>Gli allenamenti che completi verranno mostrati qui con statistiche e date.</p>
              </div>
            ) : (
              history.map(log => (
                <div key={log.id} className="glass-panel dashboard-history-card">
                  <div>
                    <h4 className="dashboard-history-summary">
                      {log.workout_plan?.name || 'Allenamento Libero'}
                    </h4>
                    <div className="dashboard-history-meta">
                      <span>{formatDate(log.started_at)}</span>
                      <span>•</span>
                      <span className="dashboard-history-duration">
                        {getDuration(log.started_at, log.completed_at)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="icon-muted" />
                </div>
              ))
            )}
          </div>
        )}
      </div>
      {planToStart && (
        <div className="dashboard-modal-overlay">
          <div className="dashboard-modal-panel" onClick={e => e.stopPropagation()}>
            <div className="dashboard-modal-header">
              <h2 className="dashboard-modal-title">{planToStart.name}</h2>
              <div><button className="dashboard-modal-close" onClick={() => setPlanToStart(null)}><X size={16}/></button></div>
            </div>
            {planToStart.description && <p className="dashboard-modal-description">{planToStart.description}</p>}
            <div className="dashboard-modal-day-tabs">
              {planToStart.days?.map(day => (
                <button
                  key={day.id}
                  onClick={() => setSelectedDayId(day.id)}
                  className={`dashboard-modal-day-pill ${selectedDayId === day.id ? 'dashboard-modal-day-pill--active' : ''}`}
                >
                  {day.name}
                </button>
              ))}
            </div>
            {(() => {
              const day = planToStart.days?.find(item => item.id === selectedDayId) || planToStart.days?.[0];
              return <>
                <h3 className="dashboard-modal-subtitle">Esercizi da fare</h3>
                <div className="dashboard-modal-exercise-list">
                  {day.exercises.map((exercise, index) => (
                    <div key={exercise.id} className="dashboard-exercise-item">
                      <strong>{index + 1}. {exercise.name}</strong>
                      <span>{exercise.sets} × {exercise.reps}</span>
                      <span>| Rest: {exercise.restTime} sec</span>
                    </div>
                  ))}
                </div>
                <button className="btn-primary" onClick={() => onStartWorkout(planToStart.id, day.id)}><Play size={16} fill="currentColor" /> Avvia {day.name}</button>
              </>;
            })()}
          </div>
        </div>
      )}

      {deleteModal.open && (
        <ConfirmModal
          title="Eliminare scheda?"
          message="Sei sicuro di voler eliminare questa scheda? Tutti gli esercizi associati verranno rimossi."
          confirmText="Elimina"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}
