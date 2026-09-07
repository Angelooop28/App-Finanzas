import { getDashboardData } from '@/lib/actions';
import { calculateNetIncome, calculateBudget, compareDebtStrategies } from '@/lib/engine';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  let data;
  try {
    data = await getDashboardData();
  } catch {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Error cargando datos. Recarga la página.</p>
      </div>
    );
  }

  const { user, incomes, deductions, debts, expenses, savingsGoals } = data;
  const latestIncome = incomes[0];

  // Calculate net income from engine
  let netIncome = 0;
  let grossIncome = 0;
  if (latestIncome) {
    grossIncome = latestIncome.grossAmount;
    const engineDeductions = deductions.map(d => ({
      name: d.name,
      type: d.type,
      percentage: d.percentage ?? undefined,
      fixedAmount: d.fixedAmount ?? undefined,
      isPercentage: d.isPercentage,
      isActive: d.isActive,
    }));
    const result = calculateNetIncome({ grossSalary: grossIncome, deductions: engineDeductions });
    netIncome = result.netSalary;
  }

  // Calculate budget
  const fixedExpenses = expenses
    .filter(e => e.category?.type === 'FIXED')
    .reduce((s, e) => s + e.amount, 0);
  const variableExpenses = expenses
    .filter(e => e.category?.type === 'VARIABLE')
    .reduce((s, e) => s + e.amount, 0);
  const totalDebtPayments = debts.reduce((s, d) => s + d.monthlyPayment, 0);
  const totalExpenses = fixedExpenses + variableExpenses;

  const budget = calculateBudget({
    netIncome,
    fixedExpenses,
    variableExpenses,
    totalDebtPayments,
  });

  // Debt strategy
  const debtInputs = debts.map(d => ({
    id: d.id,
    name: d.name,
    totalOwed: d.totalOwed,
    monthlyPayment: d.monthlyPayment,
    interestRate: d.interestRate ?? 0,
    remainingInstallments: d.remainingInstallments ?? undefined,
  }));
  const debtStrategy = compareDebtStrategies(debtInputs);

  // Upcoming payments (next 7 days)
  const now = new Date();
  const next7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingDebts = debts
    .filter(d => d.nextDueDate && new Date(d.nextDueDate) <= next7)
    .sort((a, b) => new Date(a.nextDueDate!).getTime() - new Date(b.nextDueDate!).getTime());

  const props = {
    userName: user?.name || 'Usuario',
    hasData: !!latestIncome,
    grossIncome,
    netIncome,
    totalExpenses,
    totalDebtPayments,
    totalDebt: debts.reduce((s, d) => s + d.totalOwed, 0),
    surplus: budget.surplus,
    deficit: budget.deficit,
    isDeficit: budget.isDeficit,
    healthScore: budget.healthScore,
    budgetActual: budget.actual,
    budgetSuggested: budget.suggested,
    debtCount: debts.length,
    debtRecommendation: debtStrategy.recommendation,
    debtRecommendationReason: debtStrategy.recommendationReason,
    upcomingDebts: upcomingDebts.map(d => {
      const diff = Math.ceil((new Date(d.nextDueDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      let daysText = `En ${diff} días`;
      if (diff < 0) daysText = 'Vencido';
      else if (diff === 0) daysText = 'Hoy';
      else if (diff === 1) daysText = 'Mañana';
      return {
        id: d.id,
        name: d.name,
        monthlyPayment: d.monthlyPayment,
        nextDueDate: d.nextDueDate!.toISOString(),
        daysText,
        type: d.type,
      };
    }),
    savingsGoals: savingsGoals.map(g => ({
      id: g.id,
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      progressPercent: g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0,
    })),
    expensesByCategory: Object.values(
      expenses.reduce((acc: Record<string, { name: string; icon: string; color: string; total: number }>, e) => {
        const cat = e.category;
        if (!cat) return acc;
        if (!acc[cat.id]) acc[cat.id] = { name: cat.name, icon: cat.icon || '📦', color: cat.color || '#64748B', total: 0 };
        acc[cat.id].total += e.amount;
        return acc;
      }, {})
    ).sort((a, b) => b.total - a.total),
  };

  return <DashboardClient {...props} />;
}
