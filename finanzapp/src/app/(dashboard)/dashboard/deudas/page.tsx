import { getDebts } from '@/lib/actions';
import DeudasClient from './DeudasClient';

export default async function DeudasPage() {
  let debts;
  try {
    debts = await getDebts();
  } catch {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.4 }}>⚠️</div>
        <p style={{ color: 'var(--text-secondary)' }}>Error cargando deudas. Recarga la página.</p>
      </div>
    );
  }

  return (
    <DeudasClient
      initialDebts={debts.map(d => ({
        id: d.id,
        name: d.name,
        creditor: d.creditor,
        type: d.type,
        totalOwed: d.totalOwed,
        originalAmount: d.originalAmount,
        monthlyPayment: d.monthlyPayment,
        interestRate: d.interestRate ?? 0,
        nextDueDate: d.nextDueDate?.toISOString().split('T')[0] ?? null,
        remainingInstallments: d.remainingInstallments,
        status: d.status,
      }))}
    />
  );
}

