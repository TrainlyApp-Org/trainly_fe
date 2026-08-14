import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { ArrowLeft, ChevronLeft, ChevronRight, Dumbbell, LogOut, Search, Shield, Star, UserRound } from 'lucide-react';

const PAGE_SIZE = 20;

export default function AdminDashboard({ onBack, onLogout }) {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [pagination, setPagination] = useState({ totalElements: 0, totalPages: 0, totalAccounts: 0, premiumAccounts: 0, workoutPlans: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.getAdminAccounts(page, PAGE_SIZE, query.trim());
        setAccounts(data.accounts || []);
        setPagination({
          totalElements: data.totalElements || 0,
          totalPages: data.totalPages || 0,
          totalAccounts: data.totalAccounts || 0,
          premiumAccounts: data.premiumAccounts || 0,
          workoutPlans: data.workoutPlans || 0,
        });
      } catch (err) {
        setError(err.message || 'Accesso amministratore non disponibile.');
      } finally {
        setLoading(false);
      }
    }, query ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [page, query]);

  const changeQuery = (value) => {
    setQuery(value);
    setPage(0);
  };

  return (
    <main className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-brand">
          <div className="admin-mark"><Shield size={24} /></div>
          <div><span>Trainly</span><h1>Amministrazione account</h1></div>
        </div>
        <div className="admin-header-actions">
          <button className="admin-button admin-button--secondary" onClick={onBack}><ArrowLeft size={17} /> Torna all’app</button>
          <button className="admin-icon-button" onClick={onLogout} title="Esci"><LogOut size={19} /></button>
        </div>
      </header>

      <section className="admin-summary-grid">
        <div className="admin-summary-card"><UserRound /><div><strong>{pagination.totalAccounts}</strong><span>Account registrati</span></div></div>
        <div className="admin-summary-card admin-summary-card--premium"><Star fill="currentColor" /><div><strong>{pagination.premiumAccounts}</strong><span>Account premium</span></div></div>
        <div className="admin-summary-card"><Dumbbell /><div><strong>{pagination.workoutPlans}</strong><span>Schede create</span></div></div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-toolbar">
          <div><h2>Account</h2><p>Gestisci profili, abbonamenti e schede di allenamento.</p></div>
          <div className="admin-search"><Search size={18} /><input value={query} onChange={e => changeQuery(e.target.value)} placeholder="Cerca nome, username o ID" /></div>
        </div>
        {error && <div className="admin-error">{error}</div>}
        {loading ? <div className="admin-empty">Caricamento account…</div> : accounts.length === 0 ? <div className="admin-empty">Nessun account trovato.</div> : (
          <div className="admin-table-wrap"><table className="admin-table">
            <thead><tr><th>Profilo</th><th>Tipo</th><th>Schede</th><th>Registrazione</th><th>Ultimo aggiornamento</th><th></th></tr></thead>
            <tbody>{accounts.map(account => (
              <tr key={account.id}>
                <td><strong>{account.full_name || account.username || 'Utente'}</strong><span>@{account.username || '—'} · {account.id}</span></td>
                <td><span className={`admin-tier ${account.is_premium ? 'admin-tier--premium' : ''}`}>{account.is_premium && <Star size={13} fill="currentColor" />} {account.is_premium ? 'Premium' : 'Free'}</span></td>
                <td>{account.workout_count}</td>
                <td>{account.created_at ? new Date(account.created_at).toLocaleDateString('it-IT') : '—'}</td>
                <td>{account.updated_at ? new Date(account.updated_at).toLocaleDateString('it-IT') : '—'}</td>
                <td><button className="admin-row-button" onClick={() => navigate(`/admin/accounts/${account.id}`)}>Dettagli <ChevronRight size={16} /></button></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
        {!loading && pagination.totalPages > 1 && (
          <nav className="admin-pagination" aria-label="Paginazione account">
            <button disabled={page === 0} onClick={() => setPage(current => current - 1)}><ChevronLeft size={17} /> Precedente</button>
            <span>Pagina <strong>{page + 1}</strong> di {pagination.totalPages}</span>
            <button disabled={page + 1 >= pagination.totalPages} onClick={() => setPage(current => current + 1)}>Successiva <ChevronRight size={17} /></button>
          </nav>
        )}
      </section>
    </main>
  );
}
