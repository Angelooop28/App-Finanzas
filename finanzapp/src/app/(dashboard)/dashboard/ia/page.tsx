import { getDashboardData } from '@/lib/actions';
import AIClient from './AIClient';

export const dynamic = 'force-dynamic';

export default async function AIPage() {
  const data = await getDashboardData();
  const latestIncome = data.incomes[0];
  const grossIncome = latestIncome?.grossAmount ?? 0;
  const netIncome = latestIncome?.netAmount ?? grossIncome;

  const fixedExpenses = data.expenses
    .filter(e => e.category?.type === 'FIXED')
    .reduce((sum, e) => sum + e.amount, 0);

  const variableExpenses = data.expenses
    .filter(e => e.category?.type === 'VARIABLE')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalMonthlyDebtPayments = data.debts.reduce((sum, d) => sum + d.monthlyPayment, 0);
  const emergencyGoal = data.savingsGoals.find(g => g.type === 'EMERGENCY_FUND');
  const emergencyFund = emergencyGoal?.currentAmount ?? 0;

  return (
    <AIClient
      userFinance={{
        netIncome,
        fixedExpenses,
        variableExpenses,
        totalDebtPayments: totalMonthlyDebtPayments,
        emergencyFund,
        debtsCount: data.debts.length,
      }}
    />
  );
}
