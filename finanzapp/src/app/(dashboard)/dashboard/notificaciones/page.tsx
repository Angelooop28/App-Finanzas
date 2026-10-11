import { getDashboardData } from '@/lib/actions';
import { generateActionPlan } from '@/lib/finance/recommendation-engine';
import Link from 'next/link';
import {
  Bell,
  AlertOctagon,
  AlertTriangle,
  Info,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function NotificacionesPage() {
  const data = await getDashboardData();
  const latestIncome = data.incomes[0];
  const grossIncome = latestIncome?.grossAmount ?? 0;
  const netIncome = latestIncome?.netAmount ?? grossIncome;

  const fixedExpenses = data.expenses
    .filter(e => e.category?.type === 'FIXED')
    .reduce((sum, e) => sum + e.amount, 0);

  const variableExpenses = data.expenses
    .filter(e => e.category?.type === 'VARIABLE')
    .reduce((sum, e) => sum + e.amount, 0);

  const actionCards = generateActionPlan({
    netIncome,
    fixedExpenses,
    variableExpenses,
    debts: data.debts,
    savingsGoals: data.savingsGoals,
  });

  return (
    <div style={{ animation: 'fadeInUp 0.35s ease-out', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, margin: '0 0 0.25rem' }}>
            Centro de Alertas & Notificaciones
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
            Prioridad inteligente de pagos, vencimientos legales (SUPA) y avisos de seguridad.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              background: actionCards.some(c => c.severity === 'CRITICAL') ? 'var(--danger-50)' : 'var(--success-50)',
              color: actionCards.some(c => c.severity === 'CRITICAL') ? 'var(--danger-600)' : 'var(--success-600)',
              fontSize: 'var(--text-xs)',
              fontWeight: 800,
            }}
          >
            {actionCards.length} Notificaciones Activas
          </span>
        </div>
      </div>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {actionCards.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'var(--success-50)',
                color: 'var(--success-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <CheckCircle2 size={28} />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: 'var(--text-lg)', margin: '0 0 0.5rem' }}>
              Todo al día y sin alertas pendientes
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: 450, margin: '0 auto' }}>
              No tienes cuotas vencidas ni desvíos presupuestarios detectados. ¡Continúa con tus metas de ahorro!
            </p>
          </div>
        ) : (
          actionCards.map(card => {
            const isCritical = card.severity === 'CRITICAL';
            const isWarning = card.severity === 'WARNING';

            const borderColor = isCritical ? 'var(--danger-500)' : isWarning ? 'var(--warning-500)' : 'var(--success-500)';
            const bgIcon = isCritical ? 'var(--danger-50)' : isWarning ? 'var(--warning-50)' : 'var(--success-50)';
            const colorIcon = isCritical ? 'var(--danger-600)' : isWarning ? 'var(--warning-600)' : 'var(--success-600)';

            return (
              <div
                key={card.id}
                className="glass-card"
                style={{
                  padding: '1.5rem',
                  borderLeft: `4px solid ${borderColor}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flex: 1, minWidth: 280 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      background: bgIcon,
                      color: colorIcon,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isCritical ? <AlertOctagon size={22} /> : isWarning ? <AlertTriangle size={22} /> : <Sparkles size={22} />}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          color: colorIcon,
                          letterSpacing: '0.04em',
                        }}
                      >
                        {card.badgeLabel}
                      </span>
                    </div>

                    <h4 style={{ fontWeight: 800, fontSize: 'var(--text-base)', color: 'var(--text-primary)', margin: '0 0 0.35rem' }}>
                      {card.title}
                    </h4>

                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      {card.explanation}
                    </p>

                    {card.estimatedImpact && (
                      <div style={{ marginTop: '0.5rem', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                        💡 {card.estimatedImpact}
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  href={card.actionHref}
                  className={`btn ${isCritical ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
                >
                  <span>{card.actionLabel}</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
