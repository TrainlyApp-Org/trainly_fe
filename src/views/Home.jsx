import React, { useState } from 'react';
import { ArrowRight, ClipboardList, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LegalFooter from '../components/LegalFooter';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function extractShareCode(value) {
  const input = value.trim();
  if (!input) return '';

  try {
    const url = new URL(input);
    const queryCode = url.searchParams.get('share');
    if (queryCode) return queryCode.trim();
    const pathMatch = url.pathname.match(/\/shared\/([^/?#]+)/i);
    if (pathMatch) return decodeURIComponent(pathMatch[1]).trim();
  } catch {
    // A plain sharing code is expected in the most common case.
  }

  return input;
}

export default function Home({ authenticated = false }) {
  const navigate = useNavigate();
  const [shareCode, setShareCode] = useState('');
  const [error, setError] = useState('');

  const openSharedWorkout = event => {
    event.preventDefault();
    const code = extractShareCode(shareCode);
    if (!UUID_PATTERN.test(code)) {
      setError('Inserisci un codice scheda valido o incolla il link completo.');
      return;
    }
    navigate(`/shared/${code}`);
  };

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-brand-mark">
          <img src="/favicon.svg" alt="" aria-hidden="true" />
        </div>
        <h1 className="home-app-title">Trainl<span>y</span></h1>
        <p className="home-intro">Inserisci il codice ricevuto dal tuo Personal Trainer e comincia il tuo allenamento.</p>
      </section>

      <section className="home-share-panel">
        <div className="home-panel-heading">
          <div className="home-panel-icon"><ClipboardList size={21} /></div>
          <div><span>ACCESSO RAPIDO</span><h2>Apri una scheda condivisa</h2></div>
        </div>

        <form onSubmit={openSharedWorkout}>
          <label htmlFor="shareCode">CODICE SCHEDA</label>
          <input
            id="shareCode"
            className="home-code-input"
            value={shareCode}
            onChange={event => {
              setShareCode(event.target.value);
              if (error) setError('');
            }}
            placeholder="Incolla il codice o il link"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
          />
          {error && <p className="home-code-error">{error}</p>}
          <button className="btn-primary shared-workout-start-button home-primary-action" type="submit">
            Visualizza scheda
            <ArrowRight size={19} />
          </button>
        </form>
      </section>

      <section className="home-trainer-access">
        <div><Users size={20} /><div><strong>Sei un Personal Trainer?</strong><span>Crea e gestisci le schede dei tuoi clienti.</span></div></div>
        <button type="button" onClick={() => navigate(authenticated ? '/dashboard' : '/login')}>
          {authenticated ? 'Vai alla dashboard' : 'Area Personal Trainer'}
          <ArrowRight size={17} />
        </button>
      </section>
      <LegalFooter />
    </main>
  );
}
