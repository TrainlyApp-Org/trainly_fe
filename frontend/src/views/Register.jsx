import React, { useState } from 'react';
import { api } from '../api';
import { Dumbbell } from 'lucide-react';

export default function Register({ onAuthSuccess, onViewChange }) {
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
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', minHeight: '100%', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{
          display: 'inline-flex',
          padding: '12px',
          borderRadius: '50%',
          background: 'rgba(255, 122, 0, 0.1)',
          color: 'var(--accent-orange)',
          marginBottom: '12px'
        }}>
          <Dumbbell size={32} className="pulse-effect" />
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '4px', letterSpacing: '-0.5px' }}>
          Registrati su Train<span style={{ color: 'var(--accent-orange)' }}>ly</span>
        </h1>
        <p style={{ color: 'var(--color-secondary)', fontSize: '13px' }}>
          Crea il tuo profilo ed inizia ad allenarti.
        </p>
      </div>

      <div className="glass-panel" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px', fontWeight: '600' }}>Nuovo Profilo</h2>
        
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--accent-red)',
            padding: '10px',
            borderRadius: '12px',
            fontSize: '12px',
            marginBottom: '14px'
          }}>
            {error}
          </div>
        )}

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

          <div className="form-group" style={{ marginBottom: '20px' }}>
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

      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--color-secondary)', fontSize: '13px' }}>
          Hai già un account?{' '}
          <button
            onClick={() => onViewChange('login')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-orange)',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Accedi
          </button>
        </p>
      </div>
    </div>
  );
}
