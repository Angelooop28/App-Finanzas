'use client';

import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  PiggyBank,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import PrintButton from '@/components/PrintButton';
import { FinancialHealthReport } from '@/lib/finance/health-index';

interface ReportesClientProps {
  user: {
    name: string;
    email: string;
    plan: string;
    city: string;
  };
  financialSummary: {
    grossIncome: number;
    netIncome: number;
    fixedExpensesTotal: number;
    variableExpensesTotal: number;
    totalExpenses: number;
    totalMonthlyDebtPayments: number;
    totalDebtBalance: number;
    totalSavingsBalance: number;
    emergencyFundBalance: number;
    expensesByCategory: Array<{ name: string; amount: number }>;
    debtsList: Array<{
      name: string;
      creditor?: string | null;
      totalOwed: number;
      monthlyPayment: number;
      interestRate: number;
      type: string;
    }>;
  };
  healthIndex: FinancialHealthReport;
}

export default function ReportesClient({ user, financialSummary, healthIndex }: ReportesClientProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' });

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const exportCSV = () => {
    const rows = [
      ['INFORME FINANCIERO FIN593 ECUADOR'],
      ['Cliente:', user.name],
      ['Email:', user.email],
      ['Fecha:', dateStr],
      ['Score de Salud Financiera:', `${healthIndex.overallScore}/100`],
      [],
      ['RESUMEN DE FLUJO DE CAJA'],
      ['Ingreso Bruto Mensual', financialSummary.grossIncome.toFixed(2)],
      ['Ingreso Neto Disponible', financialSummary.netIncome.toFixed(2)],
      ['Gastos Fijos Totales', financialSummary.fixedExpensesTotal.toFixed(2)],
      ['Gastos Variables Totales', financialSummary.variableExpensesTotal.toFixed(2)],
      ['Cuotas Mensuales de Deuda', financialSummary.totalMonthlyDebtPayments.toFixed(2)],
      ['Total Deuda Pendiente', financialSummary.totalDebtBalance.toFixed(2)],
      ['Saldo Total de Ahorros', financialSummary.totalSavingsBalance.toFixed(2)],
      ['Fondo de Emergencia', financialSummary.emergencyFundBalance.toFixed(2)],
      [],
      ['DESGLOSE DE DEUDAS ACTIVAS'],
      ['Nombre Obligación', 'Entidad / Acreedor', 'Saldo Pendiente', 'Cuota Mensual', 'Tasa Anual (%)'],
      ...financialSummary.debtsList.map(d => [
        d.name,
        d.creditor || 'N/A',
        d.totalOwed.toFixed(2),
        d.monthlyPayment.toFixed(2),
        `${d.interestRate}%`,
      ]),
      [],
      ['DESGLOSE DE GASTOS POR CATEGORÍA'],
      ['Categoría', 'Monto del Período'],
      ...financialSummary.expensesByCategory.map(c => [c.name, c.amount.toFixed(2)]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fin593_Informe_${user.name.replace(/\s+/g, '_')}_${now.toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ animation: 'fadeInUp 0.35s ease-out', maxWidth: 960, margin: '0 auto' }}>
      {/* Top Toolbar */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-6)',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, margin: '0 0 0.25rem' }}>
            Centro de Reportes Financieros
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
            Genera informes oficiales, descarga balances y exporta a Excel/CSV.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={exportCSV} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Download size={16} />
            <span>Exportar CSV</span>
          </button>
          <PrintButton />
        </div>
      </div>

      {/* Main Printable Document Card */}
      <div
        className="glass-card"
        style={{
          padding: '2.5rem',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-primary)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {/* Document Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid var(--border-color)',
            paddingBottom: '1.5rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  background: 'var(--primary-600)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck size={18} />
              </div>
              <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Fin593 Ecuador
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              Informe Ejecutivo de Salud Financiera & Patrimonio (USD)
            </p>
          </div>

          <div style={{ textAlign: 'right', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            <div><strong>Titular:</strong> {user.name}</div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Emisión:</strong> {dateStr}</div>
          </div>
        </div>

        {/* Health Score Banner */}
        <div
          style={{
            background: healthIndex.level === 'green' ? 'var(--success-50)' : healthIndex.level === 'yellow' ? 'var(--warning-50)' : 'var(--danger-50)',
            border: `1px solid ${healthIndex.level === 'green' ? 'var(--success-200)' : healthIndex.level === 'yellow' ? 'var(--warning-200)' : 'var(--danger-200)'}`,
            borderRadius: 'var(--radius-xl)',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: 'var(--text-base)', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              {healthIndex.statusTitle}
            </div>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', maxWidth: 600 }}>
              {healthIndex.summary}
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>
              Score Global
            </div>
            <div
              style={{
                fontSize: '2.25rem',
                fontWeight: 900,
                fontFamily: 'var(--font-mono)',
                color: healthIndex.level === 'green' ? 'var(--success-600)' : healthIndex.level === 'yellow' ? 'var(--warning-600)' : 'var(--danger-600)',
                lineHeight: 1,
              }}
            >
              {healthIndex.overallScore}<span style={{ fontSize: '1rem', color: 'var(--text-tertiary)' }}>/100</span>
            </div>
          </div>
        </div>

        {/* 4 Pillars Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {healthIndex.pillars.map(p => (
            <div
              key={p.name}
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 700 }}>
                {p.name}
              </div>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
                {p.metric}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {p.tip}
              </div>
            </div>
          ))}
        </div>

        {/* Key Metrics Summary Table */}
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800, marginBottom: '0.75rem' }}>
          Resumen de Flujo Mensual
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <div style={{ padding: '1rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Ingreso Neto</div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--success-600)' }}>
              {fmt(financialSummary.netIncome)}
            </div>
          </div>

          <div style={{ padding: '1rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Gastos Totales</div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
              {fmt(financialSummary.totalExpenses)}
            </div>
          </div>

          <div style={{ padding: '1rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Cuotas de Deuda</div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--danger-600)' }}>
              {fmt(financialSummary.totalMonthlyDebtPayments)}
            </div>
          </div>

          <div style={{ padding: '1rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Saldo Total Deudas</div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--danger-600)' }}>
              {fmt(financialSummary.totalDebtBalance)}
            </div>
          </div>
        </div>

        {/* Debts Table */}
        {financialSummary.debtsList.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800, marginBottom: '0.75rem' }}>
              Obligaciones y Deudas Activas ({financialSummary.debtsList.length})
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Obligación</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Acreedor</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Saldo Total</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Cuota Mensual</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Tasa Anual</th>
                </tr>
              </thead>
              <tbody>
                {financialSummary.debtsList.map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>{d.name}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)' }}>{d.creditor || 'Directo'}</td>
                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {fmt(d.totalOwed)}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {fmt(d.monthlyPayment)}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {d.interestRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          Fin593 Ecuador — Plataforma de Gestión Financiera y Amortización Inteligente. Documento confidencial.
        </div>
      </div>
    </div>
  );
}
