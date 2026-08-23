import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { User, Save, ArrowLeft, LockKeyhole, Star, Clock3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PasswordInput from '../components/PasswordInput';
import LegalFooter from '../components/LegalFooter';
import PageLoader from '../components/PageLoader';

export default function Profile({ onBack }) {
  const navigate = useNavigate();
  const handleBack = onBack || (() => navigate('/dashboard'));
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const data = await api.getProfile();
      const profile = data.profile;
      if (profile) {
        setUserId(profile.id || '');
        setUsername(profile.username || '');
        setFullName(profile.full_name || '');
        setAvatarUrl(profile.avatar_url || '');
        setIsPremium(Boolean(profile.is_premium));
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setLoadFailed(true);
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

  const handleChangePassword = async () => {
    setPasswordMessage({ type: '', text: '' });

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Compila tutti i campi della password.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'La nuova password deve contenere almeno 6 caratteri.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Le nuove password non coincidono.' });
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordMessage({ type: 'error', text: 'La nuova password deve essere diversa da quella attuale.' });
      return;
    }

    setChangingPassword(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      api.logout();
      window.location.assign('/login');
    } catch (err) {
      setPasswordMessage({
        type: 'error',
        text: err.message || 'Impossibile modificare la password.'
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePasswordKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleChangePassword();
    }
  };

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <button onClick={handleBack} className="button-circle">
          <ArrowLeft size={20} />
        </button>
        <h1 className="page-title">Il tuo Profilo</h1>
      </div>

      {loading ? (
        <PageLoader label="Caricamento profilo…" />
      ) : loadFailed ? (
        <div className="profile-message profile-message--error">Errore nel caricamento del profilo.</div>
      ) : (
        <form onSubmit={handleSave} className="profile-form">
          <div className="profile-info">
            <div className="profile-avatar">
              <User size={48} />
            </div>
            <div className={`profile-account-badge ${isPremium ? 'profile-account-badge--premium' : 'profile-account-badge--free'}`}>
              {isPremium && <Star size={15} fill="currentColor" aria-hidden="true" />}
              Account {isPremium ? 'Premium' : 'Free'}
            </div>
            <div className="profile-user-id" title={userId}>Profile ID: {userId}</div>
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

          <div className="glass-panel profile-billing-panel">
            <div className="profile-section-title">
              <Star size={18} />
              <h2>Trainly Premium</h2>
            </div>

            <p className="profile-billing-description">
              {isPremium
                ? 'Il tuo account include schede illimitate e nessuna pubblicità.'
                : 'Passa a Premium per creare schede illimitate e rimuovere la pubblicità.'}
            </p>

            <div className="profile-billing-coming-soon" role="status">
              <Clock3 size={18} aria-hidden="true" />
              <div>
                <strong>Abbonamenti disponibili presto</strong>
                <span>Durante questa fase beta gli account Premium vengono abilitati manualmente.</span>
              </div>
            </div>
          </div>

          <div className="glass-panel profile-password-panel">
            <div className="profile-section-title">
              <LockKeyhole size={18} />
              <h2>Modifica password</h2>
            </div>

            {passwordMessage.text && (
              <div className={`profile-message ${passwordMessage.type === 'success' ? 'profile-message--success' : 'profile-message--error'}`}>
                {passwordMessage.text}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="currentPassword">PASSWORD ATTUALE</label>
              <PasswordInput
                id="currentPassword"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                onKeyDown={handlePasswordKeyDown}
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">NUOVA PASSWORD</label>
              <PasswordInput
                id="newPassword"
                autoComplete="new-password"
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onKeyDown={handlePasswordKeyDown}
              />
            </div>

            <div className="form-group mb-8">
              <label htmlFor="confirmPassword">CONFERMA NUOVA PASSWORD</label>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={handlePasswordKeyDown}
              />
            </div>

            <button
              type="button"
              className="btn-secondary profile-password-button"
              disabled={changingPassword}
              onClick={handleChangePassword}
            >
              <LockKeyhole size={17} />
              {changingPassword ? 'Aggiornamento...' : 'Aggiorna Password'}
            </button>
          </div>

          <button type="submit" className="btn-primary profile-save-button" disabled={saving}>
            <Save size={18} />
            {saving ? 'Salvataggio...' : 'Salva Modifiche'}
          </button>
          <LegalFooter />
        </form>
      )}
    </div>
  );
}
