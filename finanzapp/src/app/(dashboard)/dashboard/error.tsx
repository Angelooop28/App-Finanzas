'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, LayoutDashboard } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div
      style={{
        padding: '3rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '460px',
          width: '100%',
          background: 'var(--bg-primary)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          boxShadow: 'var(--shadow-md)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 'var(--radius-xl)',
            background: 'var(--danger-50)',
            color: 'var(--danger-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}
        >
          <AlertCircle size={26} />
        </div>

        <h2
          style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem',
          }}
        >
          Error al cargar esta sección
        </h2>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-sm)',
            lineHeight: 1.5,
            marginBottom: '1.5rem',
          }}
        >
          No pudimos obtener la información financiera requerida. Por favor, reintenta o vuelve al panel general.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button onClick={() => reset()} className="btn btn-primary btn-sm">
            <RefreshCw size={15} />
            <span>Reintentar</span>
          </button>
          <Link href="/dashboard" className="btn btn-secondary btn-sm">
            <LayoutDashboard size={15} />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
