import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { AlertTriangle, ArrowLeft, Dumbbell, Shield, Star, UserRound } from 'lucide-react';

export default function AdminAccountDetails({ onBack }) {
  const { profileId } = useParams();
  const [account, setAccount] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.getAdminAccount(profileId), api.getAdminAccountWorkouts(profileId)])
      .then(([profile, workoutData]) => {
        setAccount(profile);
        setWorkouts(workoutData.workouts || []);
      })
      .catch(err => setError(err.message || 'Impossibile caricare il profilo.'))
      .finally(() => setLoading(false));
  }, [profileId]);

  const togglePremium = async () => {
    setUpdating(true);
    setError('');
    try {
      setAccount(await api.updateAdminAccountPremium(profileId, !account.is_premium));
      setConfirmationOpen(false);
    } catch (err) {
      setError(err.message || 'Impossibile aggiornare il tipo di account.');
    } finally {
      setUpdating(false);
    }
  };

  return <main className="admin-dashboard">
    <header className="admin-header">
      <div className="admin-header-brand"><div className="admin-mark"><Shield size={24} /></div><div><span>Trainly Admin</span><h1>Dettaglio profilo</h1></div></div>
      <button className="admin-button admin-button--secondary" onClick={onBack}><ArrowLeft size={17} /> Tutti gli account</button>
    </header>
    {error && <div className="admin-error admin-content-width">{error}</div>}
    {loading ? <div className="admin-panel admin-empty">Caricamento profilo…</div> : account && <>
      <section className="admin-profile-card">
        <div className="admin-profile-main"><div className="admin-profile-avatar"><UserRound size={30} /></div><div><span className="admin-tier-label">Profilo utente</span><h2>{account.full_name || account.username || 'Utente'}</h2><p>@{account.username || '—'}</p><p className="admin-profile-created">Registrato il {account.created_at ? new Date(account.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}</p><code>{account.id}</code></div></div>
        <div className="admin-profile-actions"><span className={`admin-tier ${account.is_premium ? 'admin-tier--premium' : ''}`}>{account.is_premium && <Star size={13} fill="currentColor" />}{account.is_premium ? 'Premium' : 'Free'}</span><button className={`admin-button ${account.is_premium ? 'admin-button--secondary' : 'admin-button--premium'}`} onClick={() => setConfirmationOpen(true)}>{account.is_premium ? 'Passa a Free' : <><Star size={16} fill="currentColor" /> Promuovi a Premium</>}</button></div>
      </section>
      <section className="admin-detail-heading"><div><Dumbbell size={21} /><div><h2>Schede di allenamento</h2><p>Tutti i giorni e gli esercizi creati da questo account.</p></div></div><strong>{workouts.length}</strong></section>
      <section className="admin-workout-grid">
        {workouts.length === 0 ? <div className="admin-panel admin-empty">Nessuna scheda creata.</div> : workouts.map(workout => <article className="admin-workout-card" key={workout.id}>
          <div className="admin-workout-title"><div><h3>{workout.name}</h3>{workout.description && <p>{workout.description}</p>}</div><span>{workout.days?.length || 0} giorni</span></div>
          {workout.days?.map(day => <div className="admin-workout-day" key={day.id}><strong>{day.name}</strong>{day.exercises?.map(ex => <div className="admin-exercise" key={ex.id}><span>{ex.name}</span><small>{ex.sets} × {ex.reps} · recupero {ex.restTime}s</small></div>)}</div>)}
        </article>)}
      </section>
    </>}
    {confirmationOpen && account && <div className="modal-overlay" onClick={() => !updating && setConfirmationOpen(false)}>
      <div className="modal-card admin-confirmation-modal" role="alertdialog" aria-modal="true" aria-labelledby="account-confirmation-title" onClick={event => event.stopPropagation()}>
        <div className="admin-confirmation-icon"><AlertTriangle size={25} /></div>
        <h2 id="account-confirmation-title">Conferma modifica account</h2>
        <p>Vuoi davvero {account.is_premium ? 'passare a Free' : 'promuovere a Premium'} l’account <strong>{account.full_name || account.username || 'selezionato'}</strong>?</p>
        <div className="modal-actions">
          <button disabled={updating} className="admin-button admin-button--secondary" onClick={() => setConfirmationOpen(false)}>Annulla</button>
          <button disabled={updating} className="admin-button" onClick={togglePremium}>{updating ? 'Aggiornamento…' : 'Conferma'}</button>
        </div>
      </div>
    </div>}
  </main>;
}
