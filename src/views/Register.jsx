import React, { useState } from 'react';
import { api } from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PasswordInput from '../components/PasswordInput';
import LegalFooter from '../components/LegalFooter';

export default function Register({ onAuthSuccess, onViewChange }) {
  const navigate = useNavigate();
  const handleViewChange = onViewChange || ((view) => navigate(view === 'register' ? '/register' : '/login'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !adultConfirmed || !termsAccepted || !privacyAcknowledged) return;

    setLoading(true);
    setError('');

    try {
      const data = await api.register(email, password, username, fullName, adultConfirmed, termsAccepted, privacyAcknowledged);
      onAuthSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Errore durante la registrazione.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-screen auth-screen--centered">
      <button
        type="button"
        className="shared-workout-back-button auth-register-back"
        onClick={() => navigate('/login')}
        aria-label="Torna alla pagina di accesso"
        title="Torna alla pagina di accesso"
      >
        <ArrowLeft size={20} />
      </button>
      <div className="register-brand">
        <div className="register-brand-icon register-brand-spacer" aria-hidden="true" />
        <h1 className="register-heading">
          Registrati su Train<span className="auth-heading-accent">ly</span>
        </h1>
        <p className="register-subtitle">
          Crea il tuo profilo ed inizia ad allenarti.
        </p>
      </div>

      <div className="glass-panel auth-panel">
        <h2 className="auth-panel-title">Nuovo Profilo</h2>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fullName">NOME E COGNOME</label>
            <input
              id="fullName"
              type="text"
              className="form-control"
              placeholder="es. Mario Rossi"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">USERNAME</label>
            <input
              id="username"
              type="text"
              className="form-control"
              placeholder="es. mariorossi"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">EMAIL</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="es. nome@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group mb-20">
            <label htmlFor="password">PASSWORD</label>
            <PasswordInput
              id="password"
              placeholder="Minimo 6 caratteri"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <label className="legal-confirmation">
            <input
              type="checkbox"
              checked={adultConfirmed}
              onChange={(event) => setAdultConfirmed(event.target.checked)}
              required
            />
            <span>Confermo di avere almeno 18 anni.</span>
          </label>

          <label className="legal-confirmation">
            <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} required />
            <span>Accetto i <Link to="/terms" target="_blank">Termini e condizioni</Link>.</span>
          </label>

          <label className="legal-confirmation">
            <input type="checkbox" checked={privacyAcknowledged} onChange={(event) => setPrivacyAcknowledged(event.target.checked)} required />
            <span>Dichiaro di aver letto l’<Link to="/privacy" target="_blank">Informativa privacy</Link>.</span>
          </label>

          <button type="submit" className="btn-primary" disabled={loading || !adultConfirmed || !termsAccepted || !privacyAcknowledged}>
            {loading ? 'Registrazione...' : 'Crea Account'}
          </button>
        </form>
      </div>

      <div className="text-center">
        <p className="auth-subtitle">
          Hai già un account?{' '}
          <button
            onClick={() => handleViewChange('login')}
            className="auth-link-button"
          >
            Accedi
          </button>
        </p>
      </div>
      <LegalFooter />
    </div>
  );
}
