import { getExpenses } from '@/lib/actions';
import GastosClient from './GastosClient';

export default async function GastosPage() {
  let expenseData;
  try {
    expenseData = await getExpenses();
  } catch {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.4 }}>⚠️</div>
        <p style={{ color: 'var(--text-secondary)' }}>Error cargando gastos. Recarga la página.</p>
      </div>
    );
  }

  const { expenses, categories, period } = expenseData;

  return (
    <GastosClient
      initialExpenses={expenses.map(e => ({
        id: e.id,
        description: e.description,
        amount: e.amount,
        date: e.date.toISOString().split('T')[0],
        isRecurring: e.isRecurring,
        categoryId: e.categoryId,
        categoryName: e.category?.name || 'Otro',
        categoryIcon: e.category?.icon || '📦',
        categoryColor: e.category?.color || '#64748B',
      }))}
      categories={categories.map(c => ({ id: c.id, name: c.name, icon: c.icon || '📦', color: c.color || '#64748B', type: c.type }))}
      currentPeriod={period}
    />
  );
}

