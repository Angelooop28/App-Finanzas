'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'var(--bg-deep)',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          background: 'var(--bg-primary)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-2xl)',
          padding: '2.5rem',
          boxShadow: 'var(--shadow-xl)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-2xl)',
            background: 'var(--danger-50)',
            color: 'var(--danger-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}
        >
          <AlertTriangle size={32} />
        </div>

        <h1
          style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem',
          }}
        >
          Algo salió mal
        </h1>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-sm)',
            lineHeight: 1.6,
            marginBottom: '1.75rem',
          }}
        >
          Ha ocurrido un error inesperado al procesar la solicitud. Los detalles técnicos han sido registrados para investigación.
        </p>

        {error?.message && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--danger-700)',
              textAlign: 'left',
              marginBottom: '1.75rem',
              wordBreak: 'break-word',
            }}
          >
            {error.message}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <Button variant="primary" onClick={() => reset()} icon={<RefreshCw size={16} />}>
            Intentar de nuevo
          </Button>
          <Link href="/">
            <Button variant="secondary" icon={<Home size={16} />}>
              Ir al inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
