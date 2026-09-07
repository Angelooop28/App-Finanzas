import { getDashboardData } from '@/lib/actions';
import {
  Bell,
  AlertOctagon,
  AlertTriangle,
  Info,
  Calendar,
  TrendingDown,
  CheckCircle2,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';

export default async function AlertasPage() {
  let dashData;
  try {
    dashData = await getDashboardData();
  } catch {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 1.5rem', maxWidth: 480, margin: '2rem auto' }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger-400)', margin: '0 auto 1.25rem' }}>
          <AlertOctagon size={32} />
        </div>
        <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Error al cargar alertas</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          Ocurrió un problema temporal recuperando tu información. Intenta recargar la página.
        </p>
      </div>
    );
  }

  const { debts, expenses, incomes, deductions } = dashData;
  const latestIncome = incomes[0];

  interface AlertItem {
    id: string;
    type: string;
    icon: typeof AlertOctagon;
    title: string;
    message: string;
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
    actionLink?: string;
    actionLabel?: string;
  }

  const alerts: AlertItem[] = [];
  const now = new Date();

  // Debt due alerts
  debts.forEach(d => {
    if (d.nextDueDate) {
      const due = new Date(d.nextDueDate);
      const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil < 0) {
        alerts.push({
          id: `overdue-${d.id}`,
          type: 'OVERDUE',
          icon: AlertOctagon,
          title: `${d.name} — Cuota Vencida`,
          message: `Tu cuota de $${d.monthlyPayment.toFixed(2)} venció hace ${Math.abs(daysUntil)} días. Te sugerimos regularizarla para evitar intereses por mora y penalizaciones en tu buró.`,
          severity: 'CRITICAL',
          actionLink: '/dashboard/deudas',
          actionLabel: 'Ver Deuda',
        });
      } else if (daysUntil <= 3) {
        alerts.push({
          id: `due-${d.id}`,
          type: 'DEBT_DUE',
          icon: AlertTriangle,
          title: `${d.name} — Vence ${daysUntil === 0 ? 'HOY' : daysUntil === 1 ? 'MAÑANA' : `en ${daysUntil} días`}`,
          message: `Cuota de $${d.monthlyPayment.toFixed(2)}. Verifica tener saldo suficiente en tu cuenta para débito automático o transferencia.`,
          severity: 'WARNING',
          actionLink: '/dashboard/deudas',
          actionLabel: 'Ver Deuda',
        });
      } else if (daysUntil <= 7) {
        alerts.push({
          id: `upcoming-${d.id}`,
          type: 'DEBT_DUE',
          icon: Calendar,
          title: `${d.name} — Vencimiento Próximo`,
          message: `Cuota de $${d.monthlyPayment.toFixed(2)} programada para el ${due.toLocaleDateString('es-EC')}.`,
          severity: 'INFO',
          actionLink: '/dashboard/deudas',
          actionLabel: 'Ver Deuda',
        });
      }
    }
  });

  // Budget alerts
  if (latestIncome) {
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalDebt = debts.reduce((s, d) => s + d.monthlyPayment, 0);
    const grossSalary = latestIncome.grossAmount;
    const totalDeductions = deductions.filter(d => d.isActive).reduce((s, d) => {
      if (d.isPercentage) return s + grossSalary * ((d.percentage ?? 0) / 100);
      return s + (d.fixedAmount ?? 0);
    }, 0);
    const netIncome = grossSalary - totalDeductions;
    const committed = totalExpenses + totalDebt;

    if (committed > netIncome) {
      alerts.push({
        id: 'deficit',
        type: 'OVERSPENDING',
        icon: TrendingDown,
        title: 'Presupuesto con Déficit Financiero',
        message: `Tus compromisos mensuales ($${committed.toFixed(2)}) superan tu ingreso neto disponible ($${netIncome.toFixed(2)}) por un margen negativo de $${(committed - netIncome).toFixed(2)}.`,
        severity: 'CRITICAL',
        actionLink: '/dashboard/gastos',
        actionLabel: 'Optimizar Gastos',
      });
    } else if (committed > netIncome * 0.9) {
      alerts.push({
        id: 'tight',
        type: 'OVERSPENDING',
        icon: AlertTriangle,
        title: 'Margen Financiero Reducido',
        message: `Estás comprometiendo el ${Math.round((committed / netIncome) * 100)}% de tu ingreso neto. Se recomienda recortar gastos prescindibles para evitar sobreendeudamiento.`,
        severity: 'WARNING',
        actionLink: '/dashboard/gastos',
        actionLabel: 'Revisar Gastos',
      });
    }
  }

  // Sort by severity
  const severityOrder: Record<string, number> = { CRITICAL: 0, WARNING: 1, INFO: 2 };
  alerts.sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3));

  const severityConfigs = {
    CRITICAL: {
      bg: 'rgba(239, 68, 68, 0.07)',
      border: 'rgba(239, 68, 68, 0.25)',
      color: 'var(--danger-400)',
      badgeClass: 'badge-danger',
      badgeText: 'Crítico',
    },
    WARNING: {
      bg: 'rgba(245, 158, 11, 0.07)',
      border: 'rgba(245, 158, 11, 0.25)',
      color: 'var(--warning-400)',
      badgeClass: 'badge-warning',
      badgeText: 'Atención',
    },
    INFO: {
      bg: 'rgba(99, 102, 241, 0.07)',
      border: 'rgba(99, 102, 241, 0.25)',
      color: 'var(--primary-400)',
      badgeClass: 'badge-primary',
      badgeText: 'Informativo',
    },
  };

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.65rem', borderRadius: 'var(--radius-full)', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-400)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <Bell size={13} />
          Centro de Notificaciones y Alertas
        </div>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Alertas</h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Monitoreo en tiempo real de tus fechas límite de pago y umbrales de presupuesto.
        </p>
      </div>

      {alerts.length === 0 ? (
        <div className="glass-card" style={{ padding: '4rem 1.5rem', textAlign: 'center', maxWidth: 500, margin: '2rem auto' }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success-400)', margin: '0 auto 1.25rem' }}>
            <CheckCircle2 size={36} />
          </div>
          <h3 style={{ fontWeight: 800, fontSize: 'var(--text-xl)', marginBottom: '0.5rem' }}>¡Finanzas bajo control!</h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
            No tienes alertas urgentes ni pagos en mora pendientes. Sigue manteniendo este buen hábito financiero.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {alerts.map(a => {
            const config = severityConfigs[a.severity] || severityConfigs.INFO;
            const Icon = a.icon;

            return (
              <div
                key={a.id}
                className="glass-card"
                style={{
                  padding: '1.35rem 1.5rem',
                  background: config.bg,
                  borderColor: config.border,
                  transition: 'transform var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 'var(--radius-lg)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: config.color,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={22} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <h4 style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: config.color, margin: 0 }}>
                        {a.title}
                      </h4>
                      <span className={`badge ${config.badgeClass}`} style={{ fontSize: '0.65rem' }}>
                        {config.badgeText}
                      </span>
                    </div>

                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                      {a.message}
                    </p>

                    {a.actionLink && (
                      <div style={{ marginTop: '0.85rem' }}>
                        <Link
                          href={a.actionLink}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                        >
                          {a.actionLabel} →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
