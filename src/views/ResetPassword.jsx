import React, { useMemo, useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import PasswordInput from '../components/PasswordInput';

const readRecoveryParams = () => {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const query = new URLSearchParams(window.location.search);
  return {
    accessToken: hash.get('access_token'),
    type: hash.get('type'),
    error: hash.get('error_description') || query.get('error_description'),
  };
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const recovery = useMemo(readRecoveryParams, []);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const invalidLink = recovery.error || !recovery.accessToken || recovery.type !== 'recovery';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La password deve contenere almeno 6 caratteri.');
      return;
    }
    if (password !== confirmation) {
      setError('Le password non coincidono.');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(recovery.accessToken, password);
      window.history.replaceState({}, document.title, window.location.pathname);
      setSuccess(true);
    } catch (requestError) {
      setError(requestError.message || 'Impossibile aggiornare la password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen auth-screen--centered">
      <div className="auth-login-content auth-recovery-content">
        <div className="auth-brand auth-recovery-brand">
          <div className="auth-brand-icon"><LockKeyhole size={32} /></div>
          <h1 className="auth-heading">Nuova password</h1>
          <p className="auth-subtitle">Scegli una nuova password per il tuo account.</p>
        </div>

        <div className="glass-panel auth-panel">
          {success ? (
            <>
              <div className="auth-success">Password aggiornata correttamente. Ora puoi accedere.</div>
              <button type="button" className="btn-primary" onClick={() => navigate('/login', { replace: true })}>
                Vai al login
              </button>
            </>
          ) : invalidLink ? (
            <>
              <div className="auth-error">Il link di recupero non è valido o è scaduto.</div>
              <button type="button" className="btn-primary" onClick={() => navigate('/forgot-password', { replace: true })}>
                Richiedi un nuovo link
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="auth-error">{error}</div>}
              <div className="form-group">
                <label htmlFor="new-password">NUOVA PASSWORD</label>
                <PasswordInput
                  id="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimo 6 caratteri"
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="form-group mb-24">
                <label htmlFor="confirm-password">CONFERMA PASSWORD</label>
                <PasswordInput
                  id="confirm-password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  placeholder="Ripeti la nuova password"
                  autoComplete="new-password"
                  required
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Aggiornamento...' : 'Aggiorna password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
