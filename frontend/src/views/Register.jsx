import React, { useState } from 'react';
import { api } from '../api';
import { Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Register({ onAuthSuccess, onViewChange }) {
  const navigate = useNavigate();
  const handleViewChange = onViewChange || ((view) => navigate(view === 'register' ? '/register' : '/login'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    try {
      const data = await api.register(email, password, username, fullName);
      onAuthSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Errore durante la registrazione.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-screen auth-screen--centered">
      <div className="register-brand">
        <div className="register-brand-icon">
          <Dumbbell size={32} className="pulse-effect" />
        </div>
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
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="Minimo 6 caratteri"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
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
    </div>
  );
}
