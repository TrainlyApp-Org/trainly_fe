import React from 'react';
import { LoaderCircle } from 'lucide-react';

export default function PageLoader({ label = 'Caricamento dati…', className = '' }) {
  return (
    <div className={`page-loader ${className}`.trim()} role="status" aria-live="polite">
      <LoaderCircle className="page-loader__spinner" size={34} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
