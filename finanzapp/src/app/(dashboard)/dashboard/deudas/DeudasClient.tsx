'use client';

import { useState, useTransition, useMemo } from 'react';
import { addDebt, deleteDebt, markDebtPaid } from '@/lib/actions';
import { compareDebtStrategies } from '@/lib/engine';
import {
  CreditCard,
  Landmark,
  Home,
  Users,
  ShieldCheck,
  Car,
  FileText,
  CheckCircle2,
  Trash2,
  Plus,
  X,
  TrendingDown,
  Zap,
  Calendar,
  DollarSign,
  Percent,
  Check,
  Award,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface Debt {
  id: string; name: string; creditor: string | null; type: string;
  totalOwed: number; originalAmount: number | null; monthlyPayment: number;
  interestRate: number; nextDueDate: string | null; remainingInstallments: number | null; status: string;
}

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const DEBT_TYPE_META: Record<string, { label: string; icon: any; color: string }> = {
  CREDIT_CARD: { label: 'Tarjeta de Crédito', icon: CreditCard, color: '#818CF8' },
  PERSONAL_LOAN: { label: 'Préstamo Bancario', icon: Landmark, color: '#38BDF8' },
  MORTGAGE: { label: 'Hipoteca', icon: Home, color: '#34D399' },
  INFORMAL: { label: 'Préstamo Informal', icon: Users, color: '#FBBF24' },
  IESS_LOAN: { label: 'Préstamo IESS', icon: ShieldCheck, color: '#A78BFA' },
  CAR_LOAN: { label: 'Crédito Automotriz', icon: Car, color: '#FB7185' },
  STUDENT_LOAN: { label: 'Crédito Educativo', icon: FileText, color: '#4ADE80' },
  OTHER: { label: 'Otra Obligación', icon: FileText, color: '#94A3B8' },
};

export default function DeudasClient({ initialDebts }: { initialDebts: Debt[] }) {
  const [debts, setDebts] = useState(initialDebts);
  const [showForm, setShowForm] = useState(false);
  const [showStrategy, setShowStrategy] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ name: '', creditor: '', type: 'CREDIT_CARD', totalOwed: 0, monthlyPayment: 0, interestRate: 0, nextDueDate: '', remainingInstallments: 0 });

  const activeDebts = useMemo(() => debts.filter(d => d.status === 'ACTIVE'), [debts]);
  const paidDebts = useMemo(() => debts.filter(d => d.status === 'PAID_OFF'), [debts]);
  const totalDebt = activeDebts.reduce((s, d) => s + d.totalOwed, 0);
  const totalMonthly = activeDebts.reduce((s, d) => s + d.monthlyPayment, 0);

  const strategy = useMemo(() => {
    if (activeDebts.length === 0) return null;
    return compareDebtStrategies(activeDebts.map(d => ({
      id: d.id, name: d.name, totalOwed: d.totalOwed,
      monthlyPayment: d.monthlyPayment, interestRate: d.interestRate,
    })));
  }, [activeDebts]);

  const handleAdd = () => {
    if (!form.name || form.totalOwed <= 0 || form.monthlyPayment <= 0) return;
    startTransition(async () => {
      await addDebt({ ...form, nextDueDate: form.nextDueDate || undefined, remainingInstallments: form.remainingInstallments || undefined });
      setDebts(prev => [...prev, { ...form, id: `temp-${Date.now()}`, originalAmount: form.totalOwed, status: 'ACTIVE', creditor: form.creditor || null, nextDueDate: form.nextDueDate || null, remainingInstallments: form.remainingInstallments || null }]);
      setShowForm(false);
      setForm({ name: '', creditor: '', type: 'CREDIT_CARD', totalOwed: 0, monthlyPayment: 0, interestRate: 0, nextDueDate: '', remainingInstallments: 0 });
    });
  };

  const handlePay = (debt: Debt) => {
    startTransition(async () => {
      await markDebtPaid(debt.id, debt.monthlyPayment);
      setDebts(prev => prev.map(d => {
        if (d.id !== debt.id) return d;
        const newBalance = Math.max(0, d.totalOwed - d.monthlyPayment);
        return { ...d, totalOwed: newBalance, remainingInstallments: d.remainingInstallments ? d.remainingInstallments - 1 : null, status: newBalance <= 0 ? 'PAID_OFF' : 'ACTIVE' };
      }));
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar esta deuda?')) return;
    setDebts(prev => prev.filter(d => d.id !== id));
    startTransition(() => void deleteDebt(id));
  };

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Gestión de Deudas & Préstamos</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Supervisa tus pasivos financieros y optimiza tu pago con el simulador de amortización.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {activeDebts.length > 1 && (
            <button className="btn btn-secondary" onClick={() => setShowStrategy(!showStrategy)}>
              <Zap size={16} color="var(--warning-400)" />
              <span>{showStrategy ? 'Ocultar Comparador' : 'Comparar Estrategias'}</span>
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? <X size={16} /> : <Plus size={16} />}
            <span>{showForm ? 'Cancelar' : 'Nueva Obligación'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={18} color="var(--danger-400)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>Saldo Total Deuda</span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--danger-400)' }}>{fmt(totalDebt)}</div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Capital pendiente acumulado</span>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={18} color="var(--warning-400)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>Cuota Mensual Total</span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--warning-400)' }}>{fmt(totalMonthly)}</div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Comprometido cada 30 días</span>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={18} color="var(--primary-400)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>Obligaciones Activas</span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{activeDebts.length}</div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{paidDebts.length} cancelada{paidDebts.length !== 1 ? 's' : ''} históricas</span>
        </div>
      </div>

      {/* Strategy Comparison Box */}
      {showStrategy && strategy && (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', animation: 'fadeInDown 0.3s ease-out', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={20} color="var(--warning-400)" />
            <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>Simulador de Métodos de Pago</h3>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Compara pagar primero las deudas con mayor interés (Avalancha) frente a liquidar primero las de menor monto (Bola de Nieve).
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-xl)',
              background: strategy.recommendation === 'avalanche' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${strategy.recommendation === 'avalanche' ? 'rgba(99, 102, 241, 0.4)' : 'rgba(148, 163, 184, 0.1)'}`,
            }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontWeight: 700, color: 'var(--primary-400)', fontSize: '1rem' }}>Método Avalancha</span>
                {strategy.recommendation === 'avalanche' && (
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px', background: 'var(--primary-500)', color: 'white', fontWeight: 700 }}>
                    Recomendado
                  </span>
                )}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Prioriza las tasas de interés más caras para minimizar el costo total.
              </div>
              <div style={{ fontSize: 'var(--text-sm)', marginBottom: '4px' }}>
                Interés total proyectado: <strong style={{ color: 'var(--danger-400)' }}>{fmt(strategy.avalanche.totalInterest)}</strong>
              </div>
              <div style={{ fontSize: 'var(--text-sm)' }}>
                Tiempo estimado de salida: <strong>{strategy.avalanche.totalMonths} meses</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.75rem', borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: '0.5rem' }}>
                Orden sugerido: {strategy.avalanche.debts.map(d => d.name).join(' → ')}
              </div>
            </div>

            <div style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-xl)',
              background: strategy.recommendation === 'snowball' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${strategy.recommendation === 'snowball' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(148, 163, 184, 0.1)'}`,
            }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontWeight: 700, color: 'var(--success-400)', fontSize: '1rem' }}>Método Bola de Nieve</span>
                {strategy.recommendation === 'snowball' && (
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px', background: 'var(--success-500)', color: 'white', fontWeight: 700 }}>
                    Recomendado
                  </span>
                )}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Elimina primero los saldos menores para liberar cuotas rápido e impulsar tu motivación.
              </div>
              <div style={{ fontSize: 'var(--text-sm)', marginBottom: '4px' }}>
                Interés total proyectado: <strong style={{ color: 'var(--danger-400)' }}>{fmt(strategy.snowball.totalInterest)}</strong>
              </div>
              <div style={{ fontSize: 'var(--text-sm)' }}>
                Tiempo estimado de salida: <strong>{strategy.snowball.totalMonths} meses</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.75rem', borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: '0.5rem' }}>
                Orden sugerido: {strategy.snowball.debts.map(d => d.name).join(' → ')}
              </div>
            </div>
          </div>

          {strategy.interestSaved > 0 && (
            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', textAlign: 'center' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--success-400)', fontWeight: 700 }}>
                💡 Ahorras aproximadamente {fmt(strategy.interestSaved)} en intereses siguiendo el método {strategy.recommendation === 'avalanche' ? 'Avalancha' : 'Bola de Nieve'}.
              </span>
            </div>
          )}
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '0.75rem' }}>{strategy.recommendationReason}</p>
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', animation: 'fadeInDown 0.3s ease-out' }}>
          <div className="flex items-center gap-2 mb-4">
            <Plus size={18} color="var(--primary-400)" />
            <h3 style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>Registrar Nueva Obligación</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Descripción de la deuda *</label>
              <input className="input" placeholder="Ej: Visa Banco Pichincha" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Entidad acreedora</label>
              <input className="input" placeholder="Ej: Banco Guayaquil / IESS" value={form.creditor} onChange={e => setForm(p => ({ ...p, creditor: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Tipo de obligación</label>
              <select className="select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {Object.entries(DEBT_TYPE_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Saldo actual adeudado ($) *</label>
              <div className="input-wrapper">
                <span className="input-icon"><DollarSign size={16} /></span>
                <input className="input" type="number" min="0" step="0.01" placeholder="0.00" value={form.totalOwed || ''} onChange={e => setForm(p => ({ ...p, totalOwed: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Cuota mensual ($) *</label>
              <div className="input-wrapper">
                <span className="input-icon"><DollarSign size={16} /></span>
                <input className="input" type="number" min="0" step="0.01" placeholder="0.00" value={form.monthlyPayment || ''} onChange={e => setForm(p => ({ ...p, monthlyPayment: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Tasa de interés anual (%)</label>
              <div className="input-wrapper">
                <span className="input-icon"><Percent size={16} /></span>
                <input className="input" type="number" min="0" step="0.01" placeholder="Ej: 16.06" value={form.interestRate || ''} onChange={e => setForm(p => ({ ...p, interestRate: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Próximo día de vencimiento</label>
              <input className="input" type="date" value={form.nextDueDate} onChange={e => setForm(p => ({ ...p, nextDueDate: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Cuotas restantes (plazo)</label>
              <div className="input-wrapper">
                <span className="input-icon"><Calendar size={16} /></span>
                <input className="input" type="number" min="0" placeholder="Ej: 12" value={form.remainingInstallments || ''} onChange={e => setForm(p => ({ ...p, remainingInstallments: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            <button className={`btn btn-primary ${isPending ? 'btn-loading' : ''}`} onClick={handleAdd} disabled={isPending}>
              <Check size={16} />
              <span>Guardar Obligación</span>
            </button>
          </div>
        </div>
      )}

      {/* Debt List */}
      {activeDebts.length === 0 && !showForm ? (
        <div className="glass-card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
          <CheckCircle2 size={48} color="var(--success-400)" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>¡Sin deudas activas registradas!</h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Mantienes tus finanzas libres de pasivos o aún no has registrado obligaciones.
          </p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} />
            <span>Registrar primera obligación</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {activeDebts.map(d => {
            const meta = DEBT_TYPE_META[d.type] || DEBT_TYPE_META.OTHER;
            const Icon = meta.icon;
            const progress = d.originalAmount ? Math.round(((d.originalAmount - d.totalOwed) / d.originalAmount) * 100) : 0;
            return (
              <div key={d.id} className="glass-card" style={{ padding: '1.25rem', borderLeft: `3px solid ${meta.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div className="flex items-center gap-3">
                    <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: `${meta.color}18`, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{d.name}</span>
                        {d.interestRate > 0 && (
                          <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger-400)', fontWeight: 700 }}>
                            {d.interestRate}% TNA
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                        {d.creditor ? `${d.creditor} · ` : ''}{meta.label}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.15rem', color: 'var(--danger-400)' }}>{fmt(d.totalOwed)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Cuota: {fmt(d.monthlyPayment)}/mes</div>
                  </div>
                </div>

                {progress > 0 && (
                  <div style={{ marginBottom: '0.85rem' }}>
                    <div className="flex justify-between" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 4 }}>
                      <span>Progreso de amortización</span>
                      <span>{progress}% cancelado</span>
                    </div>
                    <div className="progress-bar" style={{ height: 6 }}>
                      <div className="progress-fill progress-fill-success" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderTop: '1px solid rgba(148, 163, 184, 0.08)', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '1.25rem', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    {d.nextDueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        <span>Vence: {new Date(d.nextDueDate).toLocaleDateString('es-EC')}</span>
                      </span>
                    )}
                    {d.remainingInstallments && (
                      <span>{d.remainingInstallments} cuota{d.remainingInstallments !== 1 ? 's' : ''} restantes</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className={`btn btn-primary btn-sm ${isPending ? 'btn-loading' : ''}`}
                      onClick={() => handlePay(d)}
                      disabled={isPending}
                    >
                      <Check size={14} />
                      <span>Registrar cuota</span>
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDelete(d.id)}
                      title="Eliminar deuda"
                      style={{ color: 'var(--danger-400)', padding: '0.35rem' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paid Debts Historic */}
      {paidDebts.length > 0 && (
        <div style={{ marginTop: '2.5rem' }}>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} color="var(--success-400)" />
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Deudas Canceladas ({paidDebts.length})
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {paidDebts.map(d => (
              <div key={d.id} className="glass-card" style={{ padding: '0.85rem 1.25rem', opacity: 0.55, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{d.name}</span>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success-400)', fontWeight: 700 }}>
                  Totalmente Pagada 🎉
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
