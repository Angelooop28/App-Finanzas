import { getIncomeData } from '@/lib/actions';
import IngresosClient from './IngresosClient';

export default async function IngresosPage() {
  let incomeData;
  try {
    incomeData = await getIncomeData();
  } catch {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.4 }}>⚠️</div>
        <p style={{ color: 'var(--text-secondary)' }}>Error cargando ingresos. Recarga la página.</p>
      </div>
    );
  }

  const { incomes, deductions } = incomeData;
  const latestIncome = incomes[0];

  return (
    <IngresosClient
      initialGross={latestIncome?.grossAmount ?? 0}
      initialDeductions={deductions.map(d => ({
        id: d.id,
        name: d.name,
        type: d.type,
        percentage: d.percentage ?? undefined,
        fixedAmount: d.fixedAmount ?? undefined,
        isPercentage: d.isPercentage,
        isActive: d.isActive,
      }))}
    />
  );
}
