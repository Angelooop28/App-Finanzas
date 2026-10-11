'use client';

import React, { useState, useTransition, useMemo } from 'react';
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
  Zap,
  Calendar,
  DollarSign,
  Percent,
  Check,
  Building2,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Combobox, ComboboxOption } from '@/components/ui/Combobox';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

interface Debt {
  id: string;
  name: string;
  creditor: string | null;
  type: string;
  totalOwed: number;
  originalAmount: number | null;
  monthlyPayment: number;
  interestRate: number;
  nextDueDate: string | null;
  remainingInstallments: number | null;
  status: string;
}

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const DEBT_TYPE_OPTIONS: ComboboxOption[] = [
  // Bancos
  { value: 'CREDIT_CARD', label: 'Tarjeta de Crédito Bancaria', group: '🏦 Sistema Financiero', icon: <CreditCard size={16} color="#3B82F6" />, description: 'Visa, Mastercard, Diners, etc.' },
  { value: 'PERSONAL_LOAN', label: 'Préstamo de Consumo / Personal', group: '🏦 Sistema Financiero', icon: <Landmark size={16} color="#2563EB" />, description: 'Crédito bancario tradicional' },
  { value: 'COOPERATIVE', label: 'Cooperativa de Ahorro y Crédito', group: '🏦 Sistema Financiero', icon: <Building2 size={16} color="#0284C7" />, description: 'Crédito en coop. de ahorro' },
  
  // BIESS / IESS
  { value: 'IESS_LOAN', label: 'Préstamo Quirografario / BIESS', group: '🛡️ Seguridad Social (BIESS)', icon: <ShieldCheck size={16} color="#7C3AED" />, description: 'Descuento por rol o planilla' },
  { value: 'MORTGAGE_BIESS', label: 'Hipotecario BIESS', group: '🛡️ Seguridad Social (BIESS)', icon: <Home size={16} color="#6D28D9" />, description: 'Vivienda de interés público' },

  // Familia / Legal (SUPA)
  { value: 'SUPA', label: 'Pensión Alimenticia SUPA', group: '⚖️ Obligaciones Legales & Familia', icon: <Users size={16} color="#F59E0B" />, description: 'Prioridad 1 legal y de retención' },

  // Bienes
  { value: 'MORTGAGE', label: 'Hipoteca / Crédito Vivienda Bancario', group: '🏠 Vivienda & Vehículos', icon: <Home size={16} color="#10B981" />, description: 'Inmueble o terreno' },
  { value: 'CAR_LOAN', label: 'Crédito Automotriz / Vehicular', group: '🏠 Vivienda & Vehículos', icon: <Car size={16} color="#F43F5E" />, description: 'Vehículo particular o trabajo' },

  // Comercial & Otros
  { value: 'RETAIL', label: 'Crédito Directo Almacén (De Prati, Sukasa, etc.)', group: '🛍️ Casas Comerciales & Otros', icon: <ShoppingBag size={16} color="#EC4899" />, description: 'Crédito en almacenes' },
  { value: 'STUDENT_LOAN', label: 'Crédito Educativo', group: '🛍️ Casas Comerciales & Otros', icon: <FileText size={16} color="#14B8A6" />, description: 'Universidad o posgrado' },
  { value: 'INFORMAL', label: 'Préstamo Familiar / Banquito / Informal', group: '🛍️ Casas Comerciales & Otros', icon: <Users size={16} color="#D97706" />, description: 'Acuerdo privado o comunitario' },
  { value: 'OTHER', label: 'Otra Obligación', group: '🛍️ Casas Comerciales & Otros', icon: <FileText size={16} color="#64748B" />, description: 'Servicios o acuerdos varios' },
];

export default function DeudasClient({ initialDebts }: { initialDebts: Debt[] }) {
  const [debts, setDebts] = useState<Debt[]>(initialDebts);
  const [showModal, setShowModal] = useState(false);
  const [showStrategy, setShowStrategy] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    name: '',
    creditor: '',
    type: 'CREDIT_CARD',
    totalOwed: 0,
    monthlyPayment: 0,
    interestRate: 0,
    nextDueDate: '',
    remainingInstallments: 0,
  });

  const activeDebts = useMemo(() => debts.filter(d => d.status === 'ACTIVE'), [debts]);
  const paidDebts = useMemo(() => debts.filter(d => d.status === 'PAID_OFF'), [debts]);
  const totalDebt = activeDebts.reduce((s, d) => s + d.totalOwed, 0);
  const totalMonthly = activeDebts.reduce((s, d) => s + d.monthlyPayment, 0);

  // Identify next critical due date
  const nextCriticalDebt = useMemo(() => {
    if (activeDebts.length === 0) return null;
    const sorted = [...activeDebts]
      .filter(d => d.nextDueDate)
      .sort((a, b) => new Date(a.nextDueDate!).getTime() - new Date(b.nextDueDate!).getTime());
    return sorted[0] || null;
  }, [activeDebts]);

  const daysUntilNextDue = useMemo(() => {
    if (!nextCriticalDebt || !nextCriticalDebt.nextDueDate) return null;
    const diff = new Date(nextCriticalDebt.nextDueDate).getTime() - new Date().setHours(0,0,0,0);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [nextCriticalDebt]);

  const strategy = useMemo(() => {
    if (activeDebts.length === 0) return null;
    return compareDebtStrategies(activeDebts.map(d => ({
      id: d.id,
      name: d.name,
      totalOwed: d.totalOwed,
      monthlyPayment: d.monthlyPayment,
      interestRate: d.interestRate,
    })));
  }, [activeDebts]);

  const handleAdd = () => {
    if (!form.name || form.totalOwed <= 0 || form.monthlyPayment <= 0) {
      alert('Ingresa el nombre, saldo adeudado (> 0) y cuota mensual (> 0).');
      return;
    }
    startTransition(async () => {
      const res = await addDebt({
        ...form,
        nextDueDate: form.nextDueDate || undefined,
        remainingInstallments: form.remainingInstallments || undefined,
      });
      if (res.success) {
        setDebts(prev => [
          ...prev,
          {
            ...form,
            id: `temp-${Date.now()}`,
            originalAmount: form.totalOwed,
            status: 'ACTIVE',
            creditor: form.creditor || null,
            nextDueDate: form.nextDueDate || null,
            remainingInstallments: form.remainingInstallments || null,
          },
        ]);
        setShowModal(false);
        setForm({
          name: '',
          creditor: '',
          type: 'CREDIT_CARD',
          totalOwed: 0,
          monthlyPayment: 0,
          interestRate: 0,
          nextDueDate: '',
          remainingInstallments: 0,
        });
      } else {
        alert(res.error || 'Error al guardar la obligación');
      }
    });
  };

  const handlePay = (debt: Debt) => {
    startTransition(async () => {
      const res = await markDebtPaid(debt.id, debt.monthlyPayment);
      if (res.success) {
        setDebts(prev =>
          prev.map(d => {
            if (d.id !== debt.id) return d;
            const newBalance = Math.max(0, d.totalOwed - d.monthlyPayment);
            return {
              ...d,
              totalOwed: newBalance,
              remainingInstallments: d.remainingInstallments ? d.remainingInstallments - 1 : null,
              status: newBalance <= 0 ? 'PAID_OFF' : 'ACTIVE',
            };
          })
        );
      } else {
        alert(res.error || 'Error al registrar el pago');
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar esta obligación?')) return;
    setDebts(prev => prev.filter(d => d.id !== id));
    startTransition(() => void deleteDebt(id));
  };

  return (
    <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Centro de Obligaciones Financieras
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Controla, prioriza y planifica tus pagos con amortización inteligente.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {activeDebts.length > 1 && (
            <Button
              variant="secondary"
              icon={<Zap size={16} color="var(--warning-500)" />}
              onClick={() => setShowStrategy(!showStrategy)}
            >
              {showStrategy ? 'Ocultar Comparador' : 'Comparar Estrategias'}
            </Button>
          )}
          <Button
            variant="primary"
            icon={<Plus size={18} />}
            onClick={() => setShowModal(true)}
          >
            Registrar Nueva Obligación
          </Button>
        </div>
      </div>

      {/* Level 1: KPIs Hierarchy */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <StatCard
          title="Deuda Total Pendiente"
          value={fmt(totalDebt)}
          subtitle="Capital acumulado por liquidar"
          icon={<CreditCard size={18} color="var(--danger-500)" />}
          iconBg="rgba(239, 68, 68, 0.12)"
          badge={{ text: `${activeDebts.length} activas`, variant: totalDebt > 0 ? 'danger' : 'success' }}
        />

        <StatCard
          title="Cuotas Mensuales"
          value={fmt(totalMonthly)}
          subtitle="Comprometido en próximos 30 días"
          icon={<Calendar size={18} color="var(--warning-500)" />}
          iconBg="rgba(245, 158, 11, 0.12)"
          badge={{ text: 'Mensual', variant: 'warning' }}
        />

        {nextCriticalDebt ? (
          <StatCard
            title="Próximo Vencimiento"
            value={fmt(nextCriticalDebt.monthlyPayment)}
            subtitle={`${nextCriticalDebt.name} · ${nextCriticalDebt.nextDueDate ? new Date(nextCriticalDebt.nextDueDate).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' }) : ''}`}
            icon={<Zap size={18} color="var(--danger-500)" />}
            iconBg="rgba(239, 68, 68, 0.15)"
            critical={daysUntilNextDue !== null && daysUntilNextDue <= 5}
            badge={{
              text: daysUntilNextDue !== null && daysUntilNextDue <= 0 ? '¡VENCE HOY!' : `Vence en ${daysUntilNextDue} días`,
              variant: daysUntilNextDue !== null && daysUntilNextDue <= 5 ? 'danger' : 'warning',
            }}
          />
        ) : (
          <StatCard
            title="Próximo Vencimiento"
            value="Al día"
            subtitle="Sin cuotas pendientes inmediatas"
            icon={<CheckCircle2 size={18} color="var(--success-500)" />}
            iconBg="rgba(16, 185, 129, 0.12)"
            badge={{ text: 'Al día', variant: 'success' }}
          />
        )}
      </div>

      {/* Level 3: Strategy Comparator Drawer / Box */}
      {showStrategy && strategy && (
        <div
          className="glass-card"
          style={{
            padding: '1.75rem',
            marginBottom: '1.75rem',
            borderRadius: 'var(--radius-2xl)',
            border: '1px solid rgba(37, 99, 235, 0.25)',
            animation: 'fadeInUp 0.25s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
            <Zap size={22} color="var(--warning-500)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Simulador de Aceleración de Deudas</h3>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Compara pagar primero las deudas más costosas (Avalancha) frente a liquidar deudas pequeñas para flujo rápido (Bola de Nieve).
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-xl)',
                background: strategy.recommendation === 'avalanche' ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-secondary)',
                border: `1.5px solid ${strategy.recommendation === 'avalanche' ? 'var(--brand-navy-500)' : 'var(--glass-border)'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 800, color: 'var(--brand-navy-600)' }}>Método Avalancha</span>
                {strategy.recommendation === 'avalanche' && (
                  <Badge variant="primary" size="sm">Más Ahorro</Badge>
                )}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Ataca primero la tasa de interés más alta (TNA).
              </p>
              <div style={{ fontSize: 'var(--text-sm)', marginBottom: '4px' }}>
                Interés total: <strong style={{ color: 'var(--danger-500)' }}>{fmt(strategy.avalanche.totalInterest)}</strong>
              </div>
              <div style={{ fontSize: 'var(--text-sm)' }}>
                Tiempo estimado: <strong>{strategy.avalanche.totalMonths} meses</strong>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.75rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.5rem' }}>
                Orden: {strategy.avalanche.debts.map(d => d.name).join(' → ')}
              </div>
            </div>

            <div
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-xl)',
                background: strategy.recommendation === 'snowball' ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-secondary)',
                border: `1.5px solid ${strategy.recommendation === 'snowball' ? 'var(--success-500)' : 'var(--glass-border)'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 800, color: 'var(--success-600)' }}>Método Bola de Nieve</span>
                {strategy.recommendation === 'snowball' && (
                  <Badge variant="success" size="sm">Motivación Rápida</Badge>
                )}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Elimina saldos pequeños primero para liberar flujo.
              </p>
              <div style={{ fontSize: 'var(--text-sm)', marginBottom: '4px' }}>
                Interés total: <strong style={{ color: 'var(--danger-500)' }}>{fmt(strategy.snowball.totalInterest)}</strong>
              </div>
              <div style={{ fontSize: 'var(--text-sm)' }}>
                Tiempo estimado: <strong>{strategy.snowball.totalMonths} meses</strong>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.75rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.5rem' }}>
                Orden: {strategy.snowball.debts.map(d => d.name).join(' → ')}
              </div>
            </div>
          </div>

          {strategy.interestSaved > 0 && (
            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', textAlign: 'center' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--success-600)', fontWeight: 700 }}>
                💡 Ahorras aproximadamente {fmt(strategy.interestSaved)} en intereses siguiendo el método {strategy.recommendation === 'avalanche' ? 'Avalancha' : 'Bola de Nieve'}.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Level 4: Active Debt Cards */}
      {activeDebts.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 size={32} color="var(--success-500)" />}
          title="¡No tienes obligaciones pendientes registradas!"
          description="Tus pasivos están en orden. Puedes registrar créditos bancarios, tarjetas o compromisos para monitorear sus fechas de corte."
          actionText="Registrar nueva obligación"
          onAction={() => setShowModal(true)}
          actionIcon={<Plus size={16} />}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {activeDebts.map(debt => {
            const opt = DEBT_TYPE_OPTIONS.find(o => o.value === debt.type) || DEBT_TYPE_OPTIONS[0];
            const original = debt.originalAmount || debt.totalOwed;
            const progress = original > 0 ? Math.round(((original - debt.totalOwed) / original) * 100) : 0;
            const isDueSoon = debt.nextDueDate && (new Date(debt.nextDueDate).getTime() - new Date().setHours(0,0,0,0)) <= 5 * 24 * 60 * 60 * 1000;

            return (
              <div
                key={debt.id}
                className="card"
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  borderLeft: `4px solid ${isDueSoon ? 'var(--danger-500)' : 'var(--brand-navy-500)'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 'var(--radius-xl)',
                        background: 'var(--bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {opt.icon || <CreditCard size={20} />}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {debt.name}
                        </span>
                        {isDueSoon ? (
                          <Badge variant="danger" size="sm" dot>Próximo a Vencer</Badge>
                        ) : (
                          <Badge variant="primary" size="sm" dot>Activa</Badge>
                        )}
                        {debt.interestRate > 0 && (
                          <Badge variant="neutral" size="sm">
                            {debt.interestRate}% TNA
                          </Badge>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                        {debt.creditor ? `${debt.creditor} · ` : ''}{opt.label}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Saldo Pendiente
                    </div>
                    <div style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--danger-500)' }}>
                      {fmt(debt.totalOwed)}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <ProgressBar
                    value={progress}
                    label="Amortización acumulada"
                    showPercent
                    variant="success"
                    height={6}
                  />
                </div>

                {/* Bottom details & quick actions */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--glass-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                    <div>
                      Cuota mensual: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{fmt(debt.monthlyPayment)}</strong>
                    </div>
                    {debt.nextDueDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={14} color="var(--text-tertiary)" />
                        <span>Vence: <strong>{new Date(debt.nextDueDate).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}</strong></span>
                      </div>
                    )}
                    {debt.remainingInstallments && (
                      <span>Plazo: <strong>{debt.remainingInstallments} cuotas</strong></span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Check size={14} />}
                      onClick={() => handlePay(debt)}
                      isLoading={isPending}
                    >
                      Registrar Pago de Cuota
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 size={15} />}
                      onClick={() => handleDelete(debt.id)}
                      title="Eliminar registro"
                      style={{ color: 'var(--danger-500)', padding: '0.35rem' }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Level 5: Historial de deudas canceladas */}
      {paidDebts.length > 0 && (
        <div style={{ marginTop: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <CheckCircle2 size={18} color="var(--success-500)" />
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Historial de Obligaciones Liquidadas ({paidDebts.length})
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {paidDebts.map(debt => (
              <div
                key={debt.id}
                className="card"
                style={{
                  padding: '0.75rem 1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  opacity: 0.65,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <CheckCircle2 size={16} color="var(--success-500)" />
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{debt.name}</span>
                  {debt.creditor && <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>({debt.creditor})</span>}
                </div>
                <Badge variant="success" size="sm">Totalmente Cancelada 🎉</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Multi-Step Form */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Registrar Nueva Obligación"
        subtitle="Ingresa los detalles para cálculo de amortización y alertas de vencimiento"
        icon={<Sparkles size={20} />}
        maxWidth="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Section 1: Tipo y Entidad */}
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              1. Identificación de la Deuda
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
              <div className="input-group">
                <label className="input-label">Descripción de la deuda *</label>
                <input
                  className="input"
                  placeholder="Ej: Tarjeta Visa Signature / Crédito Auto"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Entidad acreedora</label>
                <input
                  className="input"
                  placeholder="Ej: Banco Pichincha / BIESS / Cooperativa"
                  value={form.creditor}
                  onChange={e => setForm(p => ({ ...p, creditor: e.target.value }))}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <Combobox
                  label="Tipo de obligación financiera"
                  options={DEBT_TYPE_OPTIONS}
                  value={form.type}
                  onChange={val => setForm(p => ({ ...p, type: val }))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Montos y Tasas */}
          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              2. Datos Financieros y Cuota
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
              <div className="input-group">
                <label className="input-label">Saldo total pendiente ($) *</label>
                <div className="input-wrapper">
                  <span className="input-icon"><DollarSign size={16} /></span>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.totalOwed || ''}
                    onChange={e => setForm(p => ({ ...p, totalOwed: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Cuota mensual requerida ($) *</label>
                <div className="input-wrapper">
                  <span className="input-icon"><DollarSign size={16} /></span>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.monthlyPayment || ''}
                    onChange={e => setForm(p => ({ ...p, monthlyPayment: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Tasa de interés anual (TNA %)</label>
                <div className="input-wrapper">
                  <span className="input-icon"><Percent size={16} /></span>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ej: 16.06"
                    value={form.interestRate || ''}
                    onChange={e => setForm(p => ({ ...p, interestRate: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Plazos y Vencimiento */}
          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              3. Condiciones y Vencimiento
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
              <div className="input-group">
                <label className="input-label">Próxima fecha de corte o pago</label>
                <input
                  className="input"
                  type="date"
                  value={form.nextDueDate}
                  onChange={e => setForm(p => ({ ...p, nextDueDate: e.target.value }))}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Cuotas restantes (meses)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  placeholder="Ej: 12"
                  value={form.remainingInstallments || ''}
                  onChange={e => setForm(p => ({ ...p, remainingInstallments: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              icon={<Check size={16} />}
              onClick={handleAdd}
              isLoading={isPending}
              disabled={!form.name || form.totalOwed <= 0 || form.monthlyPayment <= 0}
            >
              Guardar Obligación
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
