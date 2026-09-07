import { getSavingsGoals } from '@/lib/actions';
import AhorroClient from './AhorroClient';

export default async function AhorroPage() {
  let goals;
  try {
    goals = await getSavingsGoals();
  } catch {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.4 }}>⚠️</div>
        <p style={{ color: 'var(--text-secondary)' }}>Error cargando metas de ahorro. Recarga la página.</p>
      </div>
    );
  }

  return (
    <AhorroClient
      initialGoals={goals.map(g => ({
        id: g.id, name: g.name, type: g.type,
        targetAmount: g.targetAmount, currentAmount: g.currentAmount,
        monthlyContribution: g.monthlyContribution, targetMonths: g.targetMonths,
        status: g.status,
      }))}
    />
  );
}

