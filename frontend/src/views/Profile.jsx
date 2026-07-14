import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { User, Save, ArrowLeft } from 'lucide-react';

export default function Profile({ onBack }) {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await api.getProfile();
      const profile = data.profile;
      if (profile) {
        setUsername(profile.username || '');
        setFullName(profile.full_name || '');
        setAvatarUrl(profile.avatar_url || '');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setMessage({ type: 'error', text: 'Errore nel caricamento del profilo.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await api.updateProfile({
        username,
        fullName,
        avatarUrl
      });
      setMessage({ type: 'success', text: 'Profilo salvato con successo!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Errore nel salvataggio.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button 
          onClick={onBack}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Il tuo Profilo</h1>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--color-secondary)' }}>
          Caricamento...
        </div>
      ) : (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              background: 'rgba(255, 122, 0, 0.1)',
              border: '2px solid var(--accent-orange)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-orange)',
              margin: '0 auto 16px auto',
              boxShadow: 'var(--shadow-accent)'
            }}>
              <User size={48} />
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>ID Utente registrato</p>
          </div>

          <div className="glass-panel" style={{ marginBottom: '24px' }}>
            {message.text && (
              <div style={{
                background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: message.type === 'success' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                color: message.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)',
                padding: '12px',
                borderRadius: '12px',
                fontSize: '13px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                {message.text}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="fullName">NOME COMPLETO</label>
              <input
                id="fullName"
                type="text"
                className="form-control"
                placeholder="es. Mario Rossi"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label htmlFor="username">NOME UTENTE</label>
              <input
                id="username"
                type="text"
                className="form-control"
                placeholder="es. mariorossi"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={saving}
            style={{ marginTop: 'auto' }}
          >
            <Save size={18} />
            {saving ? 'Salvataggio...' : 'Salva Modifiche'}
          </button>
        </form>
      )}
    </div>
  );
}
