/**
 * FinancialEngine — Barrel Export
 * Motor de cálculo financiero completo.
 * 100% puro, sin dependencias de framework ni base de datos.
 */

export {
  calculateNetIncome,
  calculateTotalPeriodIncome,
  getDefaultEcuadorDeductions,
  roundMoney,
  type Deduction,
  type IncomeInput,
  type IncomeResult,
  type DeductionResult,
} from './income';

export {
  prioritizeAvalanche,
  prioritizeSnowball,
  compareDebtStrategies,
  type DebtInput,
  type DebtPrioritized,
  type PrioritizationResult,
  type ComparisonResult,
} from './debt-prioritizer';

export {
  calculateBudget,
  calculateHealthScore,
  type BudgetInput,
  type BudgetResult,
  type BudgetRule,
  type HealthScore,
  type HealthLevel,
} from './budget';

export {
  simulateSavings,
  calculateEmergencyFund,
  type SavingsGoalInput,
  type SavingsSimulation,
  type EmergencyFundRecommendation,
} from './savings';

export {
  evaluatePurchase,
  type PurchaseInput,
  type FinancialSnapshot,
  type PurchaseRecommendation,
  type PurchaseDetail,
  type RecommendationType,
} from './purchase-advisor';
