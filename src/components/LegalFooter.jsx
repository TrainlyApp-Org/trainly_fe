import React from 'react';
import { Link } from 'react-router-dom';

export default function LegalFooter() {
  return (
    <nav className="legal-footer" aria-label="Informazioni legali">
      <Link to="/privacy">Privacy</Link>
      <Link to="/cookies">Cookie</Link>
      <Link to="/terms">Termini</Link>
      <Link to="/disclaimer">Sicurezza</Link>
    </nav>
  );
}
