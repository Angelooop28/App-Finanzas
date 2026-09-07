import { getDashboardData, getPurchaseHistory } from '@/lib/actions';
import ConsultarClient from './ConsultarClient';
import { calculateNetIncome, calculateBudget } from '@/lib/engine';

export default async function ConsultarPage() {
  let data, history;
  try {
    [data, history] = await Promise.all([getDashboardData(), getPurchaseHistory()]);
  } catch {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.4 }}>⚠️</div>
        <p style={{ color: 'var(--text-secondary)' }}>Error cargando datos. Recarga la página.</p>
      </div>
    );
  }

  const { incomes, deductions, debts, expenses, categories, savingsGoals } = data;

  const latestIncome = incomes[0];

  let surplus = 0;
  let netIncome = 0;
  let totalDebtPayments = 0;
  let totalSavingsMonthly = 0;

  if (latestIncome) {
    const engineDeds = deductions.map(d => ({ name: d.name, type: d.type, percentage: d.percentage ?? undefined, fixedAmount: d.fixedAmount ?? undefined, isPercentage: d.isPercentage, isActive: d.isActive }));
    const incomeResult = calculateNetIncome({ grossSalary: latestIncome.grossAmount, deductions: engineDeds });
    netIncome = incomeResult.netSalary;

    // Calculate real fixed vs variable using category types
    const fixedCategoryIds = new Set(categories.filter(c => c.type === 'FIXED').map(c => c.id));
    const fixedExpenses = expenses.filter(e => fixedCategoryIds.has(e.categoryId)).reduce((s, e) => s + e.amount, 0);
    const variableExpenses = expenses.filter(e => !fixedCategoryIds.has(e.categoryId)).reduce((s, e) => s + e.amount, 0);

    totalDebtPayments = debts.filter(d => d.status === 'ACTIVE').reduce((s, d) => s + d.monthlyPayment, 0);
    totalSavingsMonthly = savingsGoals.filter(g => g.status === 'ACTIVE' && g.monthlyContribution).reduce((s, g) => s + (g.monthlyContribution ?? 0), 0);

    const budget = calculateBudget({ netIncome, fixedExpenses, variableExpenses, totalDebtPayments });
    surplus = budget.surplus;
  }

  // Real emergency fund data from savings goals
  const emergencyGoal = savingsGoals.find(g => g.type === 'EMERGENCY_FUND' && g.status === 'ACTIVE');
  const totalSaved = savingsGoals.filter(g => g.status === 'ACTIVE').reduce((s, g) => s + g.currentAmount, 0);

  return (
    <ConsultarClient
      surplus={surplus}
      hasData={!!latestIncome}
      snapshot={{
        surplus,
        emergencyFundCurrent: emergencyGoal?.currentAmount ?? totalSaved,
        emergencyFundTarget: emergencyGoal?.targetAmount ?? netIncome * 3,
        totalDebtPaymentsNextMonth: totalDebtPayments,
        netIncome,
        savingsGoalMonthly: totalSavingsMonthly,
      }}
      history={history.map(h => ({
        id: h.id, description: h.description, amount: h.amount,
        recommendation: h.recommendation, justification: h.justification,
        createdAt: h.createdAt.toISOString(),
      }))}
    />
  );
}

