import { getAdminUserFinancialProfile } from '@/lib/actions/admin';
import Link from 'next/link';
import PrintButton from '@/components/PrintButton';
import {
  ArrowLeft,
  ShieldCheck,
  Wallet,
  CreditCard,
  Receipt,
  PiggyBank,
  Crown,
} from 'lucide-react';
import styles from './reporte.module.css';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserReportPage({ params }: PageProps) {
  const { id } = await params;
  const dossier = await getAdminUserFinancialProfile(id);

  const { user, income, debts, expenses, savings, diagnosis } = dossier;

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      {/* Top Toolbar (Hidden on Print) */}
      <div
        className={styles.noPrint}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-6)',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <Link
          href="/admin/usuarios"
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft size={16} />
          <span>Volver a Lista de Clientes</span>
        </Link>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <PrintButton />
        </div>
      </div>

      {/* Main Report Document Container */}
      <div className={styles.reportContainer} id="financial-report-doc">
        {/* Header with Branding */}
        <div className={styles.reportHeader}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <ShieldCheck size={18} />
              </div>
              <h1 className={styles.brandTitle}>Fin593 Ecuador</h1>
            </div>
            <p className={styles.brandSubtitle}>
              Informe Oficial de Salud Financiera, Amortización y Plan de Ahorro (USD)
            </p>
          </div>

          <div className={styles.reportMetadata}>
            <div>
              <strong>Fecha de Emisión:</strong>{' '}
              {new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div>
              <strong>ID Expediente:</strong> {user.id.slice(0, 12)}
            </div>
            <div style={{ marginTop: '0.25rem' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  background: user.plan === 'PRO' ? '#FEF3C7' : '#F1F5F9',
                  color: user.plan === 'PRO' ? '#B45309' : '#475569',
                }}
              >
                {user.plan === 'PRO' && <Crown size={11} />}
                PLAN {user.plan}
              </span>
            </div>
          </div>
        </div>

        {/* Client Profile Summary Box */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.25rem',
            marginBottom: '1.75rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            fontSize: '0.85rem',
          }}
        >
          <div>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
              Titular del Informe
            </span>
            <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem' }}>
              {user.name || 'Sin nombre registrado'}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{user.email}</div>
          </div>

          <div>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
              Ubicación & Frecuencia
            </span>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.city || 'Ecuador (USD)'}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Pago: {user.payFrequency}</div>
          </div>

          <div>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
              Diagnóstico Financiero
            </span>
            <div
              style={{
                fontWeight: 800,
                color:
                  diagnosis.healthScore === 'SALUDABLE'
                    ? 'var(--success-600)'
                    : diagnosis.healthScore === 'MODERADO'
                    ? 'var(--warning-600)'
                    : 'var(--danger-600)',
              }}
            >
              ● {diagnosis.healthScore}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              Endeudamiento: {diagnosis.debtToIncomeRatio}%
            </div>
          </div>
        </div>

        {/* 1. Resumen Ejecutivo (KPIs) */}
        <h2 className={styles.sectionTitle}>
          <Wallet size={18} />
          <span>1. Resumen Financiero Mensual</span>
        </h2>

        <div className={styles.kpiGrid}>
          <div className={styles.kpiBox}>
            <div className={styles.kpiLabel}>Salario Neto (USD)</div>
            <div className={styles.kpiValue} style={{ color: 'var(--success-600)' }}>
              ${income.netIncome.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
              Bruto: ${income.grossIncome.toFixed(2)}
            </div>
          </div>

          <div className={styles.kpiBox}>
            <div className={styles.kpiLabel}>Cuotas de Deuda</div>
            <div className={styles.kpiValue} style={{ color: 'var(--danger-600)' }}>
              ${debts.totalMonthlyPayment.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
              Saldo total: ${debts.totalBalance.toFixed(2)}
            </div>
          </div>

          <div className={styles.kpiBox}>
            <div className={styles.kpiLabel}>Gastos Totales Mes</div>
            <div className={styles.kpiValue} style={{ color: 'var(--warning-600)' }}>
              ${expenses.totalExpenses.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
              Fijos: ${expenses.fixedTotal.toFixed(2)} | Var: ${expenses.variableTotal.toFixed(2)}
            </div>
          </div>

          <div className={styles.kpiBox}>
            <div className={styles.kpiLabel}>Superávit / Déficit</div>
            <div
              className={styles.kpiValue}
              style={{ color: diagnosis.netSurplus >= 0 ? 'var(--success-600)' : 'var(--danger-600)' }}
            >
              ${diagnosis.netSurplus.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
              Capacidad de ahorro mensual
            </div>
          </div>
        </div>

        {/* 2. Matriz de Deudas y Créditos */}
        <h2 className={styles.sectionTitle}>
          <CreditCard size={18} />
          <span>2. Matriz de Deudas y Pasivos ({debts.count} créditos)</span>
        </h2>

        {debts.list.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', fontStyle: 'italic', marginBottom: '1.5rem' }}>
            El usuario no tiene deudas activas registradas.
          </p>
        ) : (
          <table className={styles.reportTable}>
            <thead>
              <tr>
                <th>Obligación / Acreedor</th>
                <th>Tipo</th>
                <th>Monto Original</th>
                <th>Saldo Pendiente</th>
                <th>Cuota Mensual</th>
                <th>Tasa Anual</th>
                <th>Cuotas Restantes</th>
              </tr>
            </thead>
            <tbody>
              {debts.list.map((d) => (
                <tr key={d.id}>
                  <td>
                    <strong>{d.name}</strong>
                    {d.creditor && <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{d.creditor}</div>}
                  </td>
                  <td>{d.type}</td>
                  <td>${d.originalAmount ? d.originalAmount.toFixed(2) : '—'}</td>
                  <td style={{ fontWeight: 700, color: 'var(--danger-600)' }}>${d.totalOwed.toFixed(2)}</td>
                  <td style={{ fontWeight: 700 }}>${d.monthlyPayment.toFixed(2)}</td>
                  <td>{d.interestRate ? `${d.interestRate}%` : '0%'}</td>
                  <td>{d.remainingInstallments ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* 3. Desglose de Gastos por Categoría */}
        <h2 className={styles.sectionTitle}>
          <Receipt size={18} />
          <span>3. Estructura de Gastos y Costo de Vida</span>
        </h2>

        {expenses.byCategory.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', fontStyle: 'italic', marginBottom: '1.5rem' }}>
            No hay gastos clasificados en el período.
          </p>
        ) : (
          <table className={styles.reportTable}>
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Clasificación</th>
                <th>Monto Mensual</th>
                <th>% del Gasto Total</th>
              </tr>
            </thead>
            <tbody>
              {expenses.byCategory.map((cat) => {
                const pct = expenses.totalExpenses > 0 ? ((cat.amount / expenses.totalExpenses) * 100).toFixed(1) : '0';
                return (
                  <tr key={cat.name}>
                    <td>
                      <span style={{ fontWeight: 600 }}>{cat.name}</span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.4rem',
                          borderRadius: '4px',
                          background: cat.type === 'FIXED' ? 'var(--info-50)' : 'var(--warning-50)',
                          color: cat.type === 'FIXED' ? 'var(--info-700)' : 'var(--warning-700)',
                        }}
                      >
                        {cat.type === 'FIXED' ? 'Costo Fijo (Necesidad)' : 'Variable (Deseo)'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>${cat.amount.toFixed(2)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* 4. Plan de Ahorro y Fondo de Emergencia */}
        <h2 className={styles.sectionTitle}>
          <PiggyBank size={18} />
          <span>4. Fondo de Emergencia y Metas de Ahorro</span>
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              padding: '1rem',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-secondary)',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Fondo de Emergencia
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-600)', margin: '0.35rem 0' }}>
              ${savings.emergencyFund?.currentAmount.toFixed(2) || '0.00'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Meta recomendada (3-6 meses de gastos fijos):{' '}
              <strong>${(expenses.fixedTotal * 3).toFixed(2)}</strong>
            </div>
          </div>

          <div
            style={{
              padding: '1rem',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-secondary)',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Ahorro Total Acumulado
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--success-600)', margin: '0.35rem 0' }}>
              ${savings.totalCurrent.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Objetivo agregado de metas: <strong>${savings.totalTarget.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* Footer for PDF */}
        <div className={styles.reportFooter}>
          <div>
            Fin593 Ecuador • Plataforma de Inteligencia Financiera Personal (USD)
          </div>
          <div>
            Documento emitido por la Administración de Fin593 • Confidencial
          </div>
        </div>
      </div>
    </div>
  );
}
