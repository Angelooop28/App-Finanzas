'use client';

import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="btn btn-primary"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
    >
      <Printer size={16} />
      <span>Imprimir / Descargar PDF</span>
    </button>
  );
}
