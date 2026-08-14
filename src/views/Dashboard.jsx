import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Plus, Play, Trash2, Calendar, Dumbbell, User, LogOut, Pencil, Share2, Sparkles, Shield } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import WorkoutPlanViewer from '../components/WorkoutPlanViewer';

const FREE_WORKOUT_PLAN_LIMIT = 5;
const WORKOUT_DESCRIPTION_MAX_LENGTH = 40;

const formatCardDescription = (description) => {
  const value = description?.trim() || '';
  if (!value) return '\u00A0';
  return value.length > WORKOUT_DESCRIPTION_MAX_LENGTH
    ? `${value.slice(0, WORKOUT_DESCRIPTION_MAX_LENGTH).trimEnd()}…`
    : value;
};

export default function Dashboard({ onStartWorkout, onCreateWorkout, onEditWorkout, onViewProfile, onOpenAdmin, onLogout }) {
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [planToStart, setPlanToStart] = useState(null);
  const [isPremium, setIsPremium] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

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
      const [plansData, profileData, adminData] = await Promise.all([
        api.getWorkouts(),
        api.getProfile(),
        api.getAdminStatus()
      ]);
      setWorkoutPlans(plansData.workouts || []);
      setIsPremium(Boolean(profileData.profile?.is_premium));
      setIsAdmin(Boolean(adminData.admin));

      const storedUser = localStorage.getItem('trainly_user');

      if (storedUser) {
        setUserProfile(localStorage.getItem('full_name'));
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

  const chooseDay = async (plan) => {
    try {
      const details = await api.getWorkoutDetails(plan.id);
      setPlanToStart(details);
    } catch (err) {
      alert(err.message || 'Impossibile aprire la scheda.');
    }
  };

  const workoutPlanLimitReached = !isPremium && workoutPlans.length >= FREE_WORKOUT_PLAN_LIMIT;

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
              {userProfile || 'Atleta'}
            </span>
          </div>
        </div>

        <div className="dashboard-header-actions">
          {isAdmin && (
            <button className="dashboard-logout-button" onClick={onOpenAdmin} title="Dashboard amministratore">
              <Shield size={18} />
            </button>
          )}
          <button className="dashboard-logout-button" onClick={onLogout} title="Esci">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {isPremium === false && (
        <aside className="dashboard-promo-ad" aria-label="Contenuto promozionale" data-ad-slot="dashboard-workouts-banner">
          <div className="dashboard-promo-ad__icon"><Sparkles size={18} /></div>
          <div className="dashboard-promo-ad__content">
            <span>Pubblicità</span>
            <strong>Passa a Trainly Premium</strong>
            <p>Allenati senza pubblicità e crea schede senza limiti.</p>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="dashboard-content">
        {loading ? (
          <div className="dashboard-loading">
            <Dumbbell size={28} className="pulse-effect dashboard-loading-icon" />
            Caricamento in corso...
          </div>
        ) : (
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

                    <p
                      className={`dashboard-card-description ${plan.description?.trim() ? '' : 'dashboard-card-description--empty'}`}
                      title={plan.description || undefined}
                    >
                      {formatCardDescription(plan.description)}
                    </p>

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
                  disabled={workoutPlanLimitReached}
                  title={workoutPlanLimitReached ? 'Limite di 5 schede raggiunto' : undefined}
                >
                  {workoutPlanLimitReached
                    ? 'Limite di 5 schede raggiunto'
                    : <><Plus size={20} /> Crea Nuova Scheda</>}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {planToStart && (
        <div className="dashboard-modal-overlay">
          <WorkoutPlanViewer
            plan={planToStart}
            onBack={() => setPlanToStart(null)}
            onStart={dayId => onStartWorkout(planToStart.id, dayId)}
          />
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
