import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { AlertTriangle, ArrowLeft, CreditCard, Dumbbell, KeyRound, Shield, Star, Trash2, UserRound } from 'lucide-react';
import PageLoader from '../components/PageLoader';

export default function AdminAccountDetails({ onBack }) {
  const { profileId } = useParams();
  const [account, setAccount] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState('manual');
  const [deleteConfirmationValue, setDeleteConfirmationValue] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const cancelSubscription = async () => {
    setUpdating(true);
    setError('');
    try {
      setAccount(await api.cancelAdminAccountSubscription(profileId));
      setConfirmationOpen(false);
    } catch (err) {
      setError(err.message || 'Impossibile disattivare il rinnovo dell’abbonamento.');
    } finally {
      setUpdating(false);
    }
  };

  const openConfirmation = action => {
    setConfirmationAction(action);
    setDeleteConfirmationValue('');
    setConfirmationOpen(true);
  };

  const resetPassword = async () => {
    setUpdating(true);
    setError('');
    setSuccess('');
    try {
      const result = await api.resetAdminAccountPassword(profileId);
      setSuccess(`Password reimpostata: ${result.default_password}`);
      setConfirmationOpen(false);
    } catch (err) {
      setError(err.message || 'Impossibile reimpostare la password.');
    } finally {
      setUpdating(false);
    }
  };

  const deleteAccount = async () => {
    setUpdating(true);
    setError('');
    setSuccess('');
    try {
      await api.deleteAdminAccount(profileId);
      setConfirmationOpen(false);
      onBack();
    } catch (err) {
      setError(err.message || 'Impossibile eliminare l’account.');
      setConfirmationOpen(false);
    } finally {
      setUpdating(false);
    }
  };

  const deletionConfirmationText = account?.username || account?.id || '';

  return <main className="admin-dashboard">
    <header className="admin-header">
      <div className="admin-header-brand"><div className="admin-mark"><Shield size={24} /></div><div><span>Trainly Admin</span><h1>Dettaglio profilo</h1></div></div>
      <button className="admin-button admin-button--secondary" onClick={onBack}><ArrowLeft size={17} /> Tutti gli account</button>
    </header>
    {error && <div className="admin-error admin-content-width">{error}</div>}
    {success && <div className="admin-success admin-content-width" role="status">{success}</div>}
    {loading ? <PageLoader className="page-loader--admin" label="Caricamento profilo…" /> : account && <>
      <section className="admin-profile-card">
        <div className="admin-profile-main"><div className="admin-profile-avatar"><UserRound size={30} /></div><div><span className="admin-tier-label">Profilo utente</span><h2>{account.full_name || account.username || 'Utente'}</h2><p>@{account.username || '—'}</p><p className="admin-profile-created">Registrato il {account.created_at ? new Date(account.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}</p><code>{account.id}</code></div></div>
        <div className="admin-profile-actions">
          <span className={`admin-tier ${account.is_premium ? 'admin-tier--premium' : ''}`}>{account.is_premium && <Star size={13} fill="currentColor" />}{account.is_premium ? 'Premium' : 'Free'}</span>
          <button className="admin-button admin-button--secondary" onClick={() => openConfirmation('reset-password')}>
            <KeyRound size={16} /> Reimposta password
          </button>
          {account.billing_managed ? <>
            <span className="admin-billing-managed"><CreditCard size={14} /> Gestito da Stripe</span>
            <button
              className="admin-button admin-button--secondary"
              disabled={account.cancel_at_period_end}
              onClick={() => openConfirmation('cancel-subscription')}
            >
              {account.cancel_at_period_end ? 'Rinnovo disattivato' : 'Disattiva rinnovo'}
            </button>
          </> : (
            <button
              className={`admin-button ${account.is_premium ? 'admin-button--secondary' : 'admin-button--premium'}`}
              onClick={() => openConfirmation('manual')}
            >
              {account.is_premium ? 'Passa a Free' : <><Star size={16} fill="currentColor" /> Promuovi a Premium</>}
            </button>
          )}
        </div>
      </section>
      <section className="admin-detail-heading"><div><Dumbbell size={21} /><div><h2>Schede di allenamento</h2><p>Tutti i giorni e gli esercizi creati da questo account.</p></div></div><strong>{workouts.length}</strong></section>
      <section className="admin-workout-grid">
        {workouts.length === 0 ? <div className="admin-panel admin-empty">Nessuna scheda creata.</div> : workouts.map(workout => <article className="admin-workout-card" key={workout.id}>
          <div className="admin-workout-title"><div><h3>{workout.name}</h3>{workout.description && <p>{workout.description}</p>}</div><span>{workout.days?.length || 0} giorni</span></div>
          {workout.days?.map(day => <div className="admin-workout-day" key={day.id}><strong>{day.name}</strong>{day.exercises?.map(ex => <div className="admin-exercise" key={ex.id}><span>{ex.name}</span><small>{ex.sets} × {ex.reps} · recupero {ex.restTime}s</small></div>)}</div>)}
        </article>)}
      </section>
      <section className="admin-account-danger-zone">
        <div>
          <span className="admin-account-danger-zone__icon"><AlertTriangle size={21} /></span>
          <div><h2>Elimina account</h2><p>Annulla immediatamente l’eventuale abbonamento ed elimina definitivamente profilo, schede, allenamenti ed esercizi personalizzati.</p></div>
        </div>
        <button className="admin-button admin-button--danger" onClick={() => openConfirmation('delete-account')}>
          <Trash2 size={17} /> Elimina definitivamente
        </button>
      </section>
    </>}
    {confirmationOpen && account && <div className="modal-overlay" onClick={() => !updating && setConfirmationOpen(false)}>
      <div className="modal-card admin-confirmation-modal" role="alertdialog" aria-modal="true" aria-labelledby="account-confirmation-title" onClick={event => event.stopPropagation()}>
        <div className="admin-confirmation-icon"><AlertTriangle size={25} /></div>
        <h2 id="account-confirmation-title">{confirmationAction === 'delete-account' ? 'Eliminare definitivamente l’account?' : confirmationAction === 'cancel-subscription' ? 'Disattiva rinnovo' : confirmationAction === 'reset-password' ? 'Reimposta password' : 'Conferma modifica account'}</h2>
        <p>{confirmationAction === 'cancel-subscription'
          ? <>Vuoi disattivare il rinnovo Stripe dell’account <strong>{account.full_name || account.username || 'selezionato'}</strong>? L’utente manterrà Premium fino alla fine del periodo già pagato.</>
          : confirmationAction === 'reset-password'
            ? <>Vuoi reimpostare la password di <strong>{account.full_name || account.username || 'questo account'}</strong> a <code>{account.username}_ty</code>?</>
            : confirmationAction === 'delete-account'
              ? <>L’operazione è irreversibile. Per confermare, digita lo username <strong>{deletionConfirmationText}</strong>.</>
              : <>Vuoi davvero {account.is_premium ? 'passare a Free' : 'promuovere a Premium'} l’account <strong>{account.full_name || account.username || 'selezionato'}</strong>?</>}
        </p>
        {confirmationAction === 'delete-account' && <div className="admin-delete-confirmation-field">
          <label htmlFor="admin-delete-confirmation">USERNAME</label>
          <input
            id="admin-delete-confirmation"
            type="text"
            autoComplete="off"
            value={deleteConfirmationValue}
            onChange={event => setDeleteConfirmationValue(event.target.value)}
            placeholder={deletionConfirmationText}
            disabled={updating}
          />
        </div>}
        <div className="modal-actions">
          <button disabled={updating} className="admin-button admin-button--secondary" onClick={() => setConfirmationOpen(false)}>Annulla</button>
          <button
            disabled={updating || (confirmationAction === 'delete-account' && deleteConfirmationValue.trim() !== deletionConfirmationText)}
            className={`admin-button ${confirmationAction === 'delete-account' ? 'admin-button--danger' : ''}`}
            onClick={confirmationAction === 'delete-account' ? deleteAccount : confirmationAction === 'cancel-subscription' ? cancelSubscription : confirmationAction === 'reset-password' ? resetPassword : togglePremium}
          >{updating ? (confirmationAction === 'delete-account' ? 'Eliminazione…' : 'Aggiornamento…') : confirmationAction === 'delete-account' ? 'Elimina account' : 'Conferma'}</button>
        </div>
      </div>
    </div>}
  </main>;
}
