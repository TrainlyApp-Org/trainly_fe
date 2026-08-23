import React from 'react';
import { RefreshCw, WifiOff, Wrench } from 'lucide-react';

export default function ServiceUnavailable({ offline = false, onRetry }) {
  return (
    <main className="service-unavailable">
      <div className={`service-unavailable__icon ${offline ? 'service-unavailable__icon--offline' : ''}`}>
        {offline ? <WifiOff size={34} aria-hidden="true" /> : <Wrench size={34} aria-hidden="true" />}
      </div>
      <span className="service-unavailable__eyebrow">Trainly</span>
      <h1>{offline ? 'Sei offline' : 'Servizio in manutenzione'}</h1>
      <p>
        {offline
          ? 'Controlla la connessione internet del dispositivo. Riproveremo automaticamente appena tornerai online.'
          : 'Stiamo aggiornando Trainly per offrirti un servizio migliore. Torneremo operativi tra pochi minuti.'}
      </p>
      <button type="button" className="btn-primary service-unavailable__retry" onClick={onRetry}>
        <RefreshCw size={18} aria-hidden="true" /> Riprova ora
      </button>
      <small>Il controllo del servizio viene effettuato automaticamente.</small>
    </main>
  );
}
