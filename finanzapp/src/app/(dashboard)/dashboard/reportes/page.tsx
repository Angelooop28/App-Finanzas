import { getDashboardData } from '@/lib/actions';
import { computeFinancialHealthIndex } from '@/lib/finance/health-index';
import ReportesClient from './ReportesClient';

export const dynamic = 'force-dynamic';

export default async function ReportesPage() {
  const data = await getDashboardData();
  const latestIncome = data.incomes[0];
  const grossIncome = latestIncome?.grossAmount ?? 0;
  const netIncome = latestIncome?.netAmount ?? grossIncome;

  let fixedExpensesTotal = 0;
  let variableExpensesTotal = 0;
  const expensesByCategory: Record<string, number> = {};

  data.expenses.forEach(exp => {
    const isFixed = exp.category?.type === 'FIXED';
    if (isFixed) {
      fixedExpensesTotal += exp.amount;
    } else {
      variableExpensesTotal += exp.amount;
    }
    const catName = exp.category?.name || 'Otros';
    expensesByCategory[catName] = (expensesByCategory[catName] || 0) + exp.amount;
  });

  const totalMonthlyDebtPayments = data.debts.reduce((sum, d) => sum + d.monthlyPayment, 0);
  const totalDebtBalance = data.debts.reduce((sum, d) => sum + d.totalOwed, 0);
  const emergencyGoal = data.savingsGoals.find(g => g.type === 'EMERGENCY_FUND');
  const emergencyFundBalance = emergencyGoal?.currentAmount ?? 0;
  const totalSavingsBalance = data.savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);

  const healthIndex = computeFinancialHealthIndex({
    netIncome,
    fixedExpenses: fixedExpensesTotal,
    variableExpenses: variableExpensesTotal,
    totalMonthlyDebtPayments,
    totalDebtBalance,
    emergencyFundBalance,
  });

  return (
    <ReportesClient
      user={{
        name: data.user?.name || 'Usuario Fin593',
        email: data.user?.email || 'usuario@fin593.ec',
        plan: data.user?.plan || 'FREE',
        city: data.user?.city || 'Ecuador',
      }}
      financialSummary={{
        grossIncome,
        netIncome,
        fixedExpensesTotal,
        variableExpensesTotal,
        totalExpenses: fixedExpensesTotal + variableExpensesTotal,
        totalMonthlyDebtPayments,
        totalDebtBalance,
        totalSavingsBalance,
        emergencyFundBalance,
        expensesByCategory: Object.entries(expensesByCategory).map(([name, amount]) => ({ name, amount })),
        debtsList: data.debts.map(d => ({
          name: d.name,
          creditor: d.creditor,
          totalOwed: d.totalOwed,
          monthlyPayment: d.monthlyPayment,
          interestRate: d.interestRate ?? 0,
          type: d.type,
        })),
      }}
      healthIndex={healthIndex}
    />
  );
}
