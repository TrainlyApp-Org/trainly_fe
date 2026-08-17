import React, { useState } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.forgotPassword(email);
      setMessage(response.message);
    } catch (requestError) {
      setError(requestError.message || 'Impossibile inviare l’email di recupero.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen auth-screen--centered">
      <button
        type="button"
        className="shared-workout-back-button auth-login-back"
        onClick={() => navigate('/login')}
        aria-label="Torna al login"
      >
        <ArrowLeft size={20} />
      </button>

      <div className="auth-login-content auth-recovery-content">
        <div className="auth-brand auth-recovery-brand">
          <div className="auth-brand-icon"><Mail size={32} /></div>
          <h1 className="auth-heading">Recupera password</h1>
          <p className="auth-subtitle">
            Inserisci l’email associata al tuo account Trainly.
          </p>
        </div>

        <div className="glass-panel auth-panel">
          {message ? (
            <>
              <div className="auth-success">{message}</div>
              <button type="button" className="btn-secondary" onClick={() => navigate('/login')}>
                Torna al login
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="auth-error">{error}</div>}
              <div className="form-group mb-24">
                <label htmlFor="recovery-email">EMAIL</label>
                <input
                  id="recovery-email"
                  type="email"
                  className="form-control"
                  placeholder="es. nome@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Invio in corso...' : 'Invia email di recupero'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
