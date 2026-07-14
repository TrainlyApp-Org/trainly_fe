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

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--color-secondary)',
    marginBottom: '8px',
    fontFamily: 'var(--font-family-title)',
    letterSpacing: '0.02em',
    textTransform: 'none'
  };

  const inputStyle = {
    background: 'rgba(255, 255, 255, 0.04)',
    color: 'var(--color-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '12px 14px',
    width: '100%',
    minHeight: '44px',
    fontSize: '15px',
    fontFamily: 'var(--font-family-body)',
    boxShadow: 'none',
    WebkitAppearance: 'none',
    appearance: 'none',
    boxSizing: 'border-box'
  };

  const buttonStyle = {
    background: 'linear-gradient(135deg, var(--accent-orange) 0%, #ff5100 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '16px',
    padding: '14px 24px',
    width: '100%',
    minHeight: '48px',
    fontFamily: 'var(--font-family-title)',
    fontWeight: 600,
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
    WebkitAppearance: 'none',
    appearance: 'none',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    cursor: 'pointer'
  };

  return (
    <div className="login-screen" style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          display: 'inline-flex',
          padding: '16px',
          borderRadius: '50%',
          background: 'rgba(255, 122, 0, 0.1)',
          color: 'var(--accent-orange)',
          marginBottom: '16px'
        }}>
          <Dumbbell size={40} className="pulse-effect" />
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>
          Train<span style={{ color: 'var(--accent-orange)' }}>ly</span>
        </h1>
        <p style={{ color: 'var(--color-secondary)', fontSize: '14px' }}>
          Il tuo personal trainer in tasca, pronto all'uso.
        </p>
      </div>

      <div className="glass-panel" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '20px', fontWeight: '600' }}>Accedi</h2>
        
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--accent-red)',
            padding: '12px',
            borderRadius: '12px',
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" style={labelStyle}>EMAIL</label>
            <input
              id="email"
              type="email"
              className="form-control"
              style={inputStyle}
              placeholder="es. nome@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label htmlFor="password" style={labelStyle}>PASSWORD</label>
            <input
              id="password"
              type="password"
              className="form-control"
              style={inputStyle}
              placeholder="Inserisci la password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" style={buttonStyle} disabled={loading}>
            {loading ? 'Accedendo...' : 'Entra'}
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--color-secondary)', fontSize: '14px' }}>
          Non hai un account?{' '}
          <button
            onClick={() => onViewChange('register')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-orange)',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Registrati
          </button>
        </p>
      </div>
    </div>
  );
}
