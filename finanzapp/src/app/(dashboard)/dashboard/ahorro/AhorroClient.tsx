'use client';

import { useState, useTransition, useMemo } from 'react';
import { addSavingsGoal, updateSavingsGoal, deleteSavingsGoal } from '@/lib/actions';
import { simulateSavings, calculateEmergencyFund } from '@/lib/engine';
import {
  Target,
  ShieldCheck,
  Plus,
  X,
  SlidersHorizontal,
  PiggyBank,
  TrendingUp,
  Check,
  Trash2,
  Sparkles,
  Calendar,
  AlertCircle,
  DollarSign
} from 'lucide-react';

interface Goal {
  id: string;
  name: string;
  type: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number | null;
  targetMonths: number | null;
  status: string;
}

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export default function AhorroClient({ initialGoals }: { initialGoals: Goal[] }) {
  const [goals, setGoals] = useState(initialGoals);
  const [showForm, setShowForm] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ name: '', type: 'CUSTOM', targetAmount: 0, monthlyContribution: 0, targetMonths: 0 });
  const [depositingGoalId, setDepositingGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState(0);

  // Simulator — uses real engine
  const [simAmount, setSimAmount] = useState(100);
  const [simMonths, setSimMonths] = useState(12);
  const simResult = useMemo(() => {
    const targetAmount = simAmount * simMonths;
    return simulateSavings({
      targetAmount,
      currentAmount: 0,
      monthlyContribution: simAmount,
      targetMonths: simMonths,
    });
  }, [simAmount, simMonths]);

  const activeGoals = goals.filter(g => g.status === 'ACTIVE');
  const totalSaved = activeGoals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = activeGoals.reduce((s, g) => s + g.targetAmount, 0);
  const globalProgress = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  const handleAdd = () => {
    if (!form.name || form.targetAmount <= 0) return;
    startTransition(async () => {
      await addSavingsGoal(form);
      setGoals(prev => [
        ...prev,
        {
          ...form,
          id: `temp-${Date.now()}`,
          currentAmount: 0,
          monthlyContribution: form.monthlyContribution || null,
          targetMonths: form.targetMonths || null,
          status: 'ACTIVE'
        }
      ]);
      setShowForm(false);
      setForm({ name: '', type: 'CUSTOM', targetAmount: 0, monthlyContribution: 0, targetMonths: 0 });
    });
  };

  const handleDeposit = (goal: Goal, amount: number) => {
    if (amount <= 0) return;
    const newAmount = goal.currentAmount + amount;
    const newStatus = newAmount >= goal.targetAmount ? 'COMPLETED' : 'ACTIVE';
    setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, currentAmount: newAmount, status: newStatus } : g));
    startTransition(() => void updateSavingsGoal(goal.id, { currentAmount: newAmount, status: newStatus }));
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar esta meta?')) return;
    setGoals(prev => prev.filter(g => g.id !== id));
    startTransition(() => void deleteSavingsGoal(id));
  };

  // Emergency fund: calculated against assumed baseline expenses or real accumulated savings
  const emergencyFund = calculateEmergencyFund(1000, totalSaved);
  const coveragePercent = Math.min(100, Math.round((emergencyFund.coverageMonths / 6) * 100));

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.65rem', borderRadius: 'var(--radius-full)', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-400)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <PiggyBank size={13} />
            Metas y Proyecciones
          </div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Plan de Ahorro</h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Construye tu fondo de tranquilidad y alcanza tus metas financieras paso a paso.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            className={`btn ${showSimulator ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowSimulator(!showSimulator)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <SlidersHorizontal size={16} />
            {showSimulator ? 'Cerrar Simulador' : 'Simulador'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancelar' : 'Nueva Meta'}
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Ahorrado</span>
            <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success-400)' }}>
              <PiggyBank size={16} />
            </div>
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--success-400)', marginTop: '0.5rem' }}>
            {fmt(totalSaved)}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
            {activeGoals.length} {activeGoals.length === 1 ? 'meta activa' : 'metas activas'}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Objetivo Acumulado</span>
            <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'rgba(99, 102, 241, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-400)' }}>
              <Target size={16} />
            </div>
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '0.5rem' }}>
            {fmt(totalTarget)}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
            Faltan {fmt(Math.max(0, totalTarget - totalSaved))}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Progreso Global</span>
            <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'rgba(56, 189, 248, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#38bdf8', marginTop: '0.5rem' }}>
            {globalProgress}%
          </div>
          <div className="progress-bar" style={{ marginTop: '0.65rem', height: 5 }}>
            <div className="progress-fill" style={{ width: `${globalProgress}%`, background: 'linear-gradient(90deg, #38bdf8, #818cf8)' }} />
          </div>
        </div>
      </div>

      {/* Emergency Fund Intelligence Card */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.75rem', border: '1px solid rgba(245, 158, 11, 0.25)', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(15, 23, 42, 0.6))', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', position: 'relative', zIndex: 1 }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning-400)', flexShrink: 0 }}>
            <ShieldCheck size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--warning-400)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Fondo de Emergencia Recomendado
                <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Regla de Oro</span>
              </div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                Cobertura: <strong style={{ color: 'var(--text-primary)' }}>{emergencyFund.coverageMonths.toFixed(1)} meses</strong> de 6 sugeridos
              </span>
            </div>

            {/* Gauge bar with checkpoints */}
            <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
              <div className="progress-bar" style={{ height: 8, background: 'rgba(255, 255, 255, 0.08)' }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${coveragePercent}%`,
                    background: coveragePercent >= 100 ? 'var(--success-400)' : coveragePercent >= 50 ? 'var(--warning-400)' : 'var(--danger-400)'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.35rem' }}>
                <span>0 meses</span>
                <span>3 meses: {fmt(emergencyFund.recommended3Months)}</span>
                <span>Meta óptima 6 meses: {fmt(emergencyFund.recommended6Months)}</span>
              </div>
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {emergencyFund.recommendation}
            </p>
          </div>
        </div>
      </div>

      {/* Simulator Drawer / Card */}
      {showSimulator && (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.75rem', border: '1px solid rgba(99, 102, 241, 0.3)', animation: 'fadeInDown 0.3s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <SlidersHorizontal size={18} style={{ color: 'var(--primary-400)' }} />
            <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)', margin: 0 }}>Simulador de Proyección de Ahorro</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="input-group">
              <label className="input-label">Aporte mensual proyectado ($)</label>
              <div className="input-wrapper">
                <span className="input-icon"><DollarSign size={16} /></span>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={simAmount}
                  onChange={e => setSimAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Plazo en meses ({simMonths} meses)</label>
              <input
                type="range"
                min="1"
                max="60"
                value={simMonths}
                onChange={e => setSimMonths(parseInt(e.target.value) || 1)}
                style={{ width: '100%', accentColor: 'var(--primary-500)', marginTop: '0.5rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', padding: '1.25rem', borderRadius: 'var(--radius-lg)', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Aporte Acumulado</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 'var(--text-lg)', color: 'var(--text-primary)', marginTop: 4 }}>
                {fmt(simResult.totalContributed)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Tiempo Proyectado</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 'var(--text-lg)', color: 'var(--primary-400)', marginTop: 4 }}>
                {simResult.monthsToGoal} meses
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Monto Alcanzado</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 'var(--text-xl)', color: 'var(--success-400)', marginTop: 4 }}>
                {fmt(simResult.targetAmount)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Goal Form */}
      {showForm && (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.75rem', border: '1px solid rgba(16, 185, 129, 0.3)', animation: 'fadeInDown 0.3s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Sparkles size={18} style={{ color: 'var(--success-400)' }} />
            <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)', margin: 0 }}>Crear Nueva Meta</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Nombre de la meta *</label>
              <input
                className="input"
                placeholder="Ej: Viaje a Galápagos, Fondo de Emergencia"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Tipo de meta</label>
              <select
                className="select"
                value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              >
                <option value="CUSTOM">Meta personalizada</option>
                <option value="EMERGENCY_FUND">Fondo de emergencia</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Monto objetivo ($) *</label>
              <div className="input-wrapper">
                <span className="input-icon"><DollarSign size={16} /></span>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.targetAmount || ''}
                  onChange={e => setForm(p => ({ ...p, targetAmount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Ahorro mensual programado ($)</label>
              <div className="input-wrapper">
                <span className="input-icon"><DollarSign size={16} /></span>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.monthlyContribution || ''}
                  onChange={e => setForm(p => ({ ...p, monthlyContribution: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1.25rem' }}>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
            <button
              className={`btn btn-primary ${isPending ? 'btn-loading' : ''}`}
              onClick={handleAdd}
              disabled={isPending || !form.name || form.targetAmount <= 0}
            >
              <Check size={16} /> Guardar Meta
            </button>
          </div>
        </div>
      )}

      {/* Goals List */}
      {activeGoals.length === 0 && !showForm ? (
        <div className="glass-card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-400)', margin: '0 auto 1.25rem' }}>
            <Target size={32} />
          </div>
          <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)', marginBottom: '0.35rem' }}>No tienes metas activas</h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto 1.5rem' }}>
            Define tu primera meta de ahorro o construye tu fondo de emergencia para protegerte ante cualquier imprevisto.
          </p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> Crear mi primera meta
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {activeGoals.map(g => {
            const progress = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
            const remaining = Math.max(0, g.targetAmount - g.currentAmount);

            return (
              <div key={g.id} className="glass-card" style={{ padding: '1.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-md)',
                      background: g.type === 'EMERGENCY_FUND' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: g.type === 'EMERGENCY_FUND' ? 'var(--warning-400)' : 'var(--success-400)',
                      flexShrink: 0
                    }}>
                      {g.type === 'EMERGENCY_FUND' ? <ShieldCheck size={20} /> : <Target size={20} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {g.name}
                        {g.type === 'EMERGENCY_FUND' && (
                          <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Emergencia</span>
                        )}
                      </div>
                      {g.monthlyContribution && (
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: 2 }}>
                          <Calendar size={12} /> Aporte programado: {fmt(g.monthlyContribution)}/mes
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDelete(g.id)}
                    style={{ color: 'var(--danger-400)', padding: '0.35rem' }}
                    title="Eliminar meta"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Progress Visual */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {fmt(g.currentAmount)} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>de {fmt(g.targetAmount)}</span>
                  </span>
                  <span style={{ fontWeight: 700, color: progress >= 100 ? 'var(--success-400)' : 'var(--primary-400)' }}>
                    {progress}%
                  </span>
                </div>

                <div className="progress-bar" style={{ height: 7, marginBottom: '0.85rem' }}>
                  <div
                    className={`progress-fill ${progress >= 100 ? 'progress-fill-success' : ''}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Bottom Bar: Remaining & Inline Deposit */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--glass-border)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    {remaining > 0 ? (
                      <>Faltan <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{fmt(remaining)}</strong> para completar la meta</>
                    ) : (
                      <span style={{ color: 'var(--success-400)', fontWeight: 600 }}>🎉 ¡Meta alcanzada!</span>
                    )}
                  </span>

                  {depositingGoalId === g.id ? (
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <input
                        className="input"
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="$0.00"
                        autoFocus
                        value={depositAmount || ''}
                        onChange={e => setDepositAmount(parseFloat(e.target.value) || 0)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && depositAmount > 0) {
                            handleDeposit(g, depositAmount);
                            setDepositingGoalId(null);
                            setDepositAmount(0);
                          }
                          if (e.key === 'Escape') {
                            setDepositingGoalId(null);
                            setDepositAmount(0);
                          }
                        }}
                        style={{ width: 105, padding: '0.35rem 0.6rem', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}
                      />
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={depositAmount <= 0}
                        onClick={() => {
                          handleDeposit(g, depositAmount);
                          setDepositingGoalId(null);
                          setDepositAmount(0);
                        }}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setDepositingGoalId(null);
                          setDepositAmount(0);
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setDepositingGoalId(g.id);
                        setDepositAmount(0);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Plus size={13} /> Depositar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
