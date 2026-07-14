import React, { useState } from 'react';
import { api } from '../api';
import { Dumbbell } from 'lucide-react';

export default function Login({ onAuthSuccess, onViewChange }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    try {
      const data = await api.login(email, password);
      onAuthSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Errore durante il login.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="login-screen auth-screen--centered">
      <div className="auth-brand">
        <div className="auth-brand-icon">
          <Dumbbell size={40} className="pulse-effect" />
        </div>
        <h1 className="auth-heading">
          Train<span className="auth-heading-accent">ly</span>
        </h1>
        <p className="auth-subtitle">
          Il tuo personal trainer in tasca, pronto all'uso.
        </p>
      </div>

      <div className="glass-panel auth-panel">
        <h2 className="auth-panel-title">Accedi</h2>
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
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

          <div className="form-group mb-24">
            <label htmlFor="password">PASSWORD</label>
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="Inserisci la password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Accedendo...' : 'Entra'}
          </button>
        </form>
      </div>

      <div className="text-center">
        <p className="auth-subtitle">
          Non hai un account?{' '}
          <button
            onClick={() => onViewChange('register')}
            className="auth-link-button"
          >
            Registrati
          </button>
        </p>
      </div>
    </div>
  );
}
