'use client';

import { useState, useTransition } from 'react';
import { evaluatePurchase, type RecommendationType, type FinancialSnapshot } from '@/lib/engine';
import { savePurchaseQuery } from '@/lib/actions';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import {
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  History,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface HistoryItem {
  id: string;
  description: string;
  amount: number;
  recommendation: string;
  justification: string;
  createdAt: string;
}

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const VERDICT_CONFIG: Record<
  RecommendationType,
  {
    icon: typeof CheckCircle2;
    color: string;
    bg: string;
    border: string;
    label: string;
    badgeClass: string;
  }
> = {
  YES: {
    icon: CheckCircle2,
    color: 'var(--success-400)',
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.25)',
    label: 'Compra Viable',
    badgeClass: 'badge-success',
  },
  NO: {
    icon: XCircle,
    color: 'var(--danger-400)',
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.25)',
    label: 'No Recomendado',
    badgeClass: 'badge-danger',
  },
  CONDITIONAL: {
    icon: AlertTriangle,
    color: 'var(--warning-400)',
    bg: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.25)',
    label: 'Viable con Condiciones',
    badgeClass: 'badge-warning',
  },
};

export default function ConsultarClient({
  surplus,
  hasData,
  snapshot,
  history,
}: {
  surplus: number;
  hasData: boolean;
  snapshot: FinancialSnapshot;
  history: HistoryItem[];
}) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [result, setResult] = useState<{
    recommendation: RecommendationType;
    justification: string;
    details: Array<{ label: string; value: string; type: string }>;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleEvaluate = () => {
    if (!description || amount <= 0) return;
    const evaluation = evaluatePurchase({ description, amount }, snapshot);
    setResult(evaluation);
    startTransition(
      () =>
        void savePurchaseQuery({
          description,
          amount,
          recommendation: evaluation.recommendation,
          justification: evaluation.justification,
          surplusAtTime: surplus,
        })
    );
  };

  if (!hasData) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 1.5rem', maxWidth: 520, margin: '2rem auto' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-400)', margin: '0 auto 1.25rem' }}>
          <HelpCircle size={32} />
        </div>
        <h2 style={{ fontWeight: 800, fontSize: 'var(--text-xl)', marginBottom: '0.5rem' }}>Primero registra tus ingresos</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '1.5rem' }}>
          Necesitamos conocer tu flujo mensual real para evaluar compras de manera precisa y proteger tu patrimonio.
        </p>
        <Link href="/dashboard/ingresos" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          Configurar Ingresos <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const VerdictIcon = result ? VERDICT_CONFIG[result.recommendation].icon : null;

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.65rem', borderRadius: 'var(--radius-full)', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-400)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <Sparkles size={13} />
          Asesor Inteligente de Consumo
        </div>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>¿Puedo Comprarlo?</h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Consulta al motor financiero antes de tomar una decisión de compra impulsiva o de alto valor.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '1.5rem', alignItems: 'start' }}>
        {/* Terminal Input Card */}
        <div>
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem', borderRadius: 'var(--radius-lg)', background: surplus > 0 ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)', border: `1px solid ${surplus > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tu Excedente Mensual Libre</span>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: surplus > 0 ? 'var(--success-400)' : 'var(--danger-400)', marginTop: 2 }}>
                  {fmt(surplus)}
                </div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: surplus > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: surplus > 0 ? 'var(--success-400)' : 'var(--danger-400)' }}>
                <TrendingUp size={20} />
              </div>
            </div>

            <Input
              label="¿Qué deseas comprar?"
              placeholder="Ej: Laptop para trabajo, Celular nuevo, Smart TV"
              value={description}
              onChange={e => setDescription(e.target.value)}
              containerStyle={{ marginBottom: '1.25rem' }}
            />

            <Input
              label="Monto estimado de la compra (USD)"
              type="text"
              inputMode="decimal"
              icon={<DollarSign size={20} />}
              placeholder="0.00"
              value={amount || ''}
              onChange={e => setAmount(parseFloat(e.target.value) || 0)}
              onKeyDown={e => { if (e.key === 'Enter') handleEvaluate(); }}
              style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
              containerStyle={{ marginBottom: '1.5rem' }}
            />

            <button
              className={`btn btn-primary w-full ${isPending ? 'btn-loading' : ''}`}
              onClick={handleEvaluate}
              disabled={isPending || !description.trim() || amount <= 0}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.85rem' }}
            >
              <Search size={18} />
              {isPending ? 'Analizando situación...' : 'Evaluar Factibilidad'}
            </button>
          </div>

          {/* Verdict Result */}
          {result && VerdictIcon && (
            <div
              className="glass-card"
              style={{
                padding: '1.75rem',
                marginTop: '1.25rem',
                animation: 'fadeInUp 0.35s ease-out',
                borderColor: VERDICT_CONFIG[result.recommendation].border,
                background: VERDICT_CONFIG[result.recommendation].bg,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: VERDICT_CONFIG[result.recommendation].color,
                    flexShrink: 0,
                  }}
                >
                  <VerdictIcon size={28} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: VERDICT_CONFIG[result.recommendation].color, margin: 0 }}>
                      {VERDICT_CONFIG[result.recommendation].label}
                    </h3>
                    <span className={`badge ${VERDICT_CONFIG[result.recommendation].badgeClass}`} style={{ fontSize: '0.65rem' }}>
                      {result.recommendation}
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', marginTop: 2, fontWeight: 600 }}>
                    {description} — <span style={{ fontFamily: 'var(--font-mono)' }}>{fmt(amount)}</span>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {result.justification}
              </p>

              {result.details && result.details.length > 0 && (
                <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {result.details.map((d, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', padding: '0.35rem 0' }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>{d.label}</span>
                      <span
                        style={{
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          color:
                            d.type === 'positive'
                              ? 'var(--success-400)'
                              : d.type === 'negative'
                              ? 'var(--danger-400)'
                              : 'var(--text-primary)',
                        }}
                      >
                        {d.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Query History */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <History size={18} style={{ color: 'var(--primary-400)' }} />
            <h3 style={{ fontWeight: 700, fontSize: 'var(--text-base)', margin: 0 }}>Consultas Recientes</h3>
          </div>

          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <HelpCircle size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto 0.75rem', opacity: 0.4 }} />
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', margin: 0 }}>
                Aún no has evaluado compras. Realiza tu primera consulta a la izquierda.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {history.map(h => {
                const rec = (h.recommendation as RecommendationType) || 'CONDITIONAL';
                const cfg = VERDICT_CONFIG[rec] || VERDICT_CONFIG.CONDITIONAL;
                const RecIcon = cfg.icon;

                return (
                  <div
                    key={h.id}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-lg)',
                      background: 'rgba(148, 163, 184, 0.03)',
                      border: '1px solid var(--glass-border)',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                        {h.description}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: cfg.color }}>
                        <RecIcon size={14} />
                        <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{cfg.label}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(h.amount)}</span>
                      <span>{new Date(h.createdAt).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
