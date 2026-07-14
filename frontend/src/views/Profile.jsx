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
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <button onClick={onBack} className="button-circle">
          <ArrowLeft size={20} />
        </button>
        <h1 className="page-title">Il tuo Profilo</h1>
      </div>

      {loading ? (
        <div className="profile-info profile-info-text">Caricamento...</div>
      ) : (
        <form onSubmit={handleSave} className="profile-form">
          <div className="profile-info">
            <div className="profile-avatar">
              <User size={48} />
            </div>
            <p className="profile-info-text">ID Utente registrato</p>
          </div>

          <div className="glass-panel mb-24">
            {message.text && (
              <div className={`profile-message ${message.type === 'success' ? 'profile-message--success' : 'profile-message--error'}`}>
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

            <div className="form-group mb-8">
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

          <button type="submit" className="btn-primary profile-save-button" disabled={saving}>
            <Save size={18} />
            {saving ? 'Salvataggio...' : 'Salva Modifiche'}
          </button>
        </form>
      )}
    </div>
  );
}
