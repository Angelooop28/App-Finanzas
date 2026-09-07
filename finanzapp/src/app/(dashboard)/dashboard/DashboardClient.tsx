'use client';

import Link from 'next/link';
import type { HealthScore } from '@/lib/engine';
import {
  Wallet,
  ReceiptText,
  CreditCard,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Landmark,
  Home,
  Users,
  ShieldCheck,
  Car,
  FileText,
  HelpCircle,
  PlusCircle,
  PiggyBank,
  Calendar,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import styles from './dashboard-page.module.css';

interface Props {
  userName: string;
  hasData: boolean;
  grossIncome: number;
  netIncome: number;
  totalExpenses: number;
  totalDebtPayments: number;
  totalDebt: number;
  surplus: number;
  deficit: number;
  isDeficit: boolean;
  healthScore: HealthScore;
  budgetActual: { needsPercent: number; wantsPercent: number; savingsPercent: number };
  budgetSuggested: { needs: number; wants: number; savings: number };
  debtCount: number;
  debtRecommendation: string;
  debtRecommendationReason: string;
  upcomingDebts: { id: string; name: string; monthlyPayment: number; nextDueDate: string; daysText?: string; type: string }[];
  savingsGoals: { id: string; name: string; targetAmount: number; currentAmount: number; progressPercent: number }[];
  expensesByCategory: { name: string; icon: string; color: string; total: number }[];
}

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const getDebtIcon = (type: string) => {
  switch (type) {
    case 'CREDIT_CARD': return <CreditCard size={18} />;
    case 'PERSONAL_LOAN': return <Landmark size={18} />;
    case 'MORTGAGE': return <Home size={18} />;
    case 'INFORMAL': return <Users size={18} />;
    case 'IESS_LOAN': return <ShieldCheck size={18} />;
    case 'CAR_LOAN': return <Car size={18} />;
    default: return <FileText size={18} />;
  }
};

export default function DashboardClient(props: Props) {
  if (!props.hasData) {
    return (
      <div className={styles.dashPage}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIconBadge}>
            <Wallet size={36} className={styles.emptyIcon} />
          </div>
          <h2 className={styles.emptyTitle}>¡Bienvenido, {props.userName}!</h2>
          <p className={styles.emptyDesc}>
            Para comenzar a visualizar tu balance financiero y proyecciones, ingresa tu salario y deducciones de rol de pagos.
          </p>
          <Link href="/dashboard/ingresos" className="btn btn-primary btn-lg">
            <span>Configurar Salario & IESS</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  const scoreLevel = props.healthScore.level;
  const scoreColors: Record<string, { text: string; bg: string; label: string }> = {
    green: { text: '#34D399', bg: 'rgba(16, 185, 129, 0.12)', label: 'Saludable' },
    yellow: { text: '#FBBF24', bg: 'rgba(245, 158, 11, 0.12)', label: 'Precaución' },
    red: { text: '#EF4444', bg: 'rgba(239, 68, 68, 0.2)', label: 'Peligro' },
  };
  const activeScoreColor = scoreColors[scoreLevel] || { text: '#34D399', bg: 'rgba(16, 185, 129, 0.12)', label: 'Saludable' };

  return (
    <div className={styles.dashPage}>
      {/* Summary KPI Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryCardHeader}>
            <div className={`${styles.kpiIconWrapper} ${styles.kpiIncome}`}>
              <Wallet size={20} />
            </div>
            <span className={styles.summaryCardLabel}>Ingreso Neto</span>
          </div>
          <div className={`${styles.summaryCardValue} ${styles.positive}`}>{fmt(props.netIncome)}</div>
          <div className={styles.summaryCardSubtext}>
            <span>Salario bruto: <strong>{fmt(props.grossIncome)}</strong></span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryCardHeader}>
            <div className={`${styles.kpiIconWrapper} ${styles.kpiExpenses}`}>
              <ReceiptText size={20} />
            </div>
            <span className={styles.summaryCardLabel}>Gastos del Mes</span>
          </div>
          <div className={`${styles.summaryCardValue} ${styles.warning}`}>{fmt(props.totalExpenses)}</div>
          <div className={styles.summaryCardSubtext}>
            <span>{props.expensesByCategory.length} categorías activas</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryCardHeader}>
            <div className={`${styles.kpiIconWrapper} ${styles.kpiDebt}`}>
              <CreditCard size={20} />
            </div>
            <span className={styles.summaryCardLabel}>Cuotas de Deuda</span>
          </div>
          <div className={`${styles.summaryCardValue} ${styles.negative}`}>{fmt(props.totalDebtPayments)}</div>
          <div className={styles.summaryCardSubtext}>
            <span>{props.debtCount} deuda{props.debtCount !== 1 ? 's' : ''} en curso</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryCardHeader}>
            <div className={`${styles.kpiIconWrapper} ${props.isDeficit ? styles.kpiDeficit : styles.kpiSurplus}`}>
              {props.isDeficit ? <AlertTriangle size={20} /> : <Sparkles size={20} />}
            </div>
            <span className={styles.summaryCardLabel}>{props.isDeficit ? 'Déficit del Mes' : 'Superávit Libre'}</span>
          </div>
          <div className={`${styles.summaryCardValue} ${props.isDeficit ? styles.negative : styles.positive}`}>
            {props.isDeficit ? `-${fmt(props.deficit)}` : fmt(props.surplus)}
          </div>
          <div className={styles.summaryCardSubtext}>
            <span>{props.isDeficit ? 'Ajustar gastos urgente' : 'Disponible para ahorro e inversión'}</span>
          </div>
        </div>
      </div>

      {/* Health Score Banner */}
      <div className={styles.healthCard}>
        <div className={styles.healthHeader}>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={styles.healthBadge} style={{ background: activeScoreColor.bg, color: activeScoreColor.text }}>
                {activeScoreColor.label}
              </span>
              <h3 className={styles.healthTitle}>Salud Financiera General</h3>
            </div>
            <p className={styles.healthDescription}>{props.healthScore.description}</p>
          </div>

          <div className={styles.healthScoreBox} style={{ borderColor: activeScoreColor.text }}>
            <span className={styles.healthScoreNumber} style={{ color: activeScoreColor.text }}>{props.healthScore.score}</span>
            <span className={styles.healthScoreMax}>/100</span>
          </div>
        </div>

        {/* Budget Distribution Bar (50/30/20 Rule) */}
        <div className={styles.budgetSection}>
          <div className="flex justify-between items-center mb-2">
            <span className={styles.budgetTitle}>Distribución Presupuestaria (Regla 50 / 30 / 20)</span>
            <span className={styles.budgetHint}>Actual del mes</span>
          </div>

          <div className={styles.budgetBar}>
            <div
              className={styles.budgetSegment}
              style={{ width: `${Math.min(100, props.budgetActual.needsPercent)}%`, background: 'var(--primary-500)' }}
              title={`Necesidades: ${props.budgetActual.needsPercent}%`}
            />
            <div
              className={styles.budgetSegment}
              style={{ width: `${Math.min(100, props.budgetActual.wantsPercent)}%`, background: 'var(--warning-500)' }}
              title={`Deseos: ${props.budgetActual.wantsPercent}%`}
            />
            <div
              className={styles.budgetSegment}
              style={{ width: `${Math.min(100, Math.max(0, props.budgetActual.savingsPercent))}%`, background: 'var(--success-500)' }}
              title={`Ahorro: ${Math.max(0, props.budgetActual.savingsPercent)}%`}
            />
          </div>

          <div className={styles.budgetLegend}>
            <div className={styles.legendItem}>
              <div className={styles.legendDot} style={{ background: 'var(--primary-500)' }} />
              <span>Necesidades <strong>{props.budgetActual.needsPercent}%</strong> (Obj. 50%)</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendDot} style={{ background: 'var(--warning-500)' }} />
              <span>Deseos <strong>{props.budgetActual.wantsPercent}%</strong> (Obj. 30%)</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendDot} style={{ background: 'var(--success-500)' }} />
              <span>Ahorro <strong>{Math.max(0, props.budgetActual.savingsPercent)}%</strong> (Obj. 20%)</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.contentGrid}>
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* Expenses by Category */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className="flex items-center gap-2">
                <ReceiptText size={18} className="text-primary" />
                <h3 className={styles.sectionTitle}>Gastos por Categoría</h3>
              </div>
              <Link href="/dashboard/gastos" className="btn btn-ghost btn-sm">
                <span>Gestionar</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {props.expensesByCategory.length > 0 ? (
              <div className={styles.paymentList}>
                {props.expensesByCategory.map((cat, i) => (
                  <div key={i} className={styles.paymentItem}>
                    <div className={styles.paymentIconBadge} style={{ background: `${cat.color}20`, color: cat.color }}>
                      {cat.icon}
                    </div>
                    <div className={styles.paymentInfo}>
                      <div className="flex justify-between items-center">
                        <span className={styles.paymentName}>{cat.name}</span>
                        <span className={styles.paymentAmount}>{fmt(cat.total)}</span>
                      </div>
                      <div className="progress-bar" style={{ height: 5, marginTop: 6 }}>
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.min(100, props.netIncome > 0 ? (cat.total / props.netIncome) * 100 : 0)}%`,
                            background: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
                  Aún no has registrado gastos este mes.
                </p>
                <Link href="/dashboard/gastos" className="btn btn-secondary btn-sm">
                  <PlusCircle size={15} />
                  <span>+ Registrar gasto</span>
                </Link>
              </div>
            )}
          </div>

          {/* Debt Strategy Recommendation */}
          {props.debtCount > 0 && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className="flex items-center gap-2">
                  <TrendingDown size={18} color="var(--danger-400)" />
                  <h3 className={styles.sectionTitle}>Plan de Liquidación de Deudas</h3>
                </div>
                <Link href="/dashboard/deudas" className="btn btn-ghost btn-sm">
                  <span>Simulador</span>
                  <ChevronRight size={14} />
                </Link>
              </div>

              <div className={styles.strategyBanner}>
                <div className={styles.strategyIconBox}>
                  <ShieldCheck size={24} color="var(--primary-400)" />
                </div>
                <div>
                  <div className={styles.strategyTitle}>
                    Estrategia óptima: <strong>{props.debtRecommendation === 'avalanche' ? 'Método Avalancha (Menor Interés)' : 'Método Bola de Nieve (Rápida Victoria)'}</strong>
                  </div>
                  <div className={styles.strategyDesc}>{props.debtRecommendationReason}</div>
                </div>
              </div>

              <div className={styles.debtSummaryRow}>
                <div className={styles.debtSummaryItem}>
                  <span className={styles.debtSummaryLabel}>Saldo total adeudado</span>
                  <strong className={styles.debtSummaryValue} style={{ color: 'var(--danger-400)' }}>{fmt(props.totalDebt)}</strong>
                </div>
                <div className={styles.debtSummaryItem}>
                  <span className={styles.debtSummaryLabel}>Cuota mensual acumulada</span>
                  <strong className={styles.debtSummaryValue}>{fmt(props.totalDebtPayments)}/mes</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Upcoming Payments */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className="flex items-center gap-2">
                <Calendar size={18} color="var(--warning-400)" />
                <h3 className={styles.sectionTitle}>Próximos Vencimientos</h3>
              </div>
            </div>

            {props.upcomingDebts.length > 0 ? (
              <div className={styles.paymentList}>
                {props.upcomingDebts.map(d => {
                  const days = d.daysText || 'Próximo';
                  const isUrgent = days === 'Hoy' || days === 'Mañana' || days === 'Vencido';
                  return (
                    <div key={d.id} className={styles.paymentItem}>
                      <div className={styles.debtTypeIcon}>
                        {getDebtIcon(d.type)}
                      </div>
                      <div className={styles.paymentInfo}>
                        <div className={styles.paymentName}>{d.name}</div>
                        <div
                          className={styles.paymentDueDate}
                          style={{ color: isUrgent ? 'var(--danger-400)' : 'var(--text-tertiary)' }}
                        >
                          {isUrgent ? <AlertCircle size={13} /> : <Calendar size={13} />}
                          <span>{days}</span>
                        </div>
                      </div>
                      <div className={styles.paymentAmountBadge}>
                        {fmt(d.monthlyPayment)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle2 size={28} color="var(--success-400)" style={{ margin: '0 auto 0.5rem' }} />
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  No tienes cuotas próximas en los siguientes 7 días.
                </p>
              </div>
            )}
          </div>

          {/* Quick Smart Actions */}
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle} style={{ marginBottom: '1rem' }}>Herramientas Rápidas</h3>
            <div className="flex flex-col gap-2">
              <Link href="/dashboard/consultar" className={styles.quickActionLink}>
                <div className={styles.quickActionIcon} style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary-400)' }}>
                  <HelpCircle size={18} />
                </div>
                <div className="flex-1">
                  <div className={styles.quickActionTitle}>¿Puedo comprar algo?</div>
                  <div className={styles.quickActionDesc}>Evalúa un gasto antes de pagar</div>
                </div>
                <ChevronRight size={16} className={styles.quickActionArrow} />
              </Link>

              <Link href="/dashboard/gastos" className={styles.quickActionLink}>
                <div className={styles.quickActionIcon} style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'var(--warning-400)' }}>
                  <PlusCircle size={18} />
                </div>
                <div className="flex-1">
                  <div className={styles.quickActionTitle}>Registrar Gasto Rápido</div>
                  <div className={styles.quickActionDesc}>Añade ticket o factura</div>
                </div>
                <ChevronRight size={16} className={styles.quickActionArrow} />
              </Link>

              <Link href="/dashboard/ahorro" className={styles.quickActionLink}>
                <div className={styles.quickActionIcon} style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success-400)' }}>
                  <PiggyBank size={18} />
                </div>
                <div className="flex-1">
                  <div className={styles.quickActionTitle}>Colchón de Emergencia</div>
                  <div className={styles.quickActionDesc}>Simula y monitorea metas</div>
                </div>
                <ChevronRight size={16} className={styles.quickActionArrow} />
              </Link>
            </div>
          </div>

          {/* Savings Goals */}
          {props.savingsGoals.length > 0 && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className="flex items-center gap-2">
                  <PiggyBank size={18} color="var(--success-400)" />
                  <h3 className={styles.sectionTitle}>Metas de Ahorro</h3>
                </div>
                <Link href="/dashboard/ahorro" className="btn btn-ghost btn-sm">
                  <span>Ver todas</span>
                  <ChevronRight size={14} />
                </Link>
              </div>

              <div className="flex flex-col gap-4">
                {props.savingsGoals.map(g => (
                  <div key={g.id}>
                    <div className="flex justify-between items-center mb-1">
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{g.name}</span>
                      <span className={styles.progressPercentBadge}>{g.progressPercent}%</span>
                    </div>
                    <div className="progress-bar" style={{ height: 6 }}>
                      <div
                        className={`progress-fill ${g.progressPercent >= 100 ? 'progress-fill-success' : ''}`}
                        style={{ width: `${Math.min(100, g.progressPercent)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                      <span>{fmt(g.currentAmount)}</span>
                      <span>Meta: {fmt(g.targetAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
