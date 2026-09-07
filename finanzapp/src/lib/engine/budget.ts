/**
 * FinancialEngine — Budget Calculator & Health Score
 * Calcula excedente, regla 50/30/20, y semáforo de salud financiera.
 */

import { roundMoney } from './income';

export interface BudgetInput {
  netIncome: number;
  fixedExpenses: number;
  variableExpenses: number;   // promedio mensual
  totalDebtPayments: number;
}

export interface BudgetRule {
  needsPercent: number;    // default 50
  wantsPercent: number;    // default 30
  savingsPercent: number;  // default 20
}

export interface BudgetResult {
  netIncome: number;
  fixedExpenses: number;
  variableExpenses: number;
  totalDebtPayments: number;
  totalCommitted: number;     // fixed + variable + debt
  availableReal: number;      // netIncome - totalCommitted
  surplus: number;            // max(0, availableReal)
  deficit: number;            // max(0, -availableReal)
  isDeficit: boolean;
  
  // Regla 50/30/20 sugerida
  suggested: {
    needs: number;
    wants: number;
    savings: number;
  };
  
  // Actual vs sugerido
  actual: {
    needsPercent: number;
    wantsPercent: number;
    savingsPercent: number;
  };

  healthScore: HealthScore;
}

export type HealthLevel = 'green' | 'yellow' | 'red';

export interface HealthScore {
  level: HealthLevel;
  label: string;
  description: string;
  debtRatio: number;        // totalDebtPayments / netIncome
  expenseRatio: number;     // totalCommitted / netIncome
  score: number;            // 0-100
}

const DEFAULT_RULE: BudgetRule = {
  needsPercent: 50,
  wantsPercent: 30,
  savingsPercent: 20,
};

/**
 * Calcula el presupuesto completo del período.
 */
export function calculateBudget(
  input: BudgetInput,
  rule: BudgetRule = DEFAULT_RULE
): BudgetResult {
  const { netIncome, fixedExpenses, variableExpenses, totalDebtPayments } = input;

  const totalCommitted = roundMoney(fixedExpenses + variableExpenses + totalDebtPayments);
  const availableReal = roundMoney(netIncome - totalCommitted);
  const surplus = Math.max(0, availableReal);
  const deficit = Math.max(0, -availableReal);
  const isDeficit = availableReal < 0;

  // Regla sugerida (aplicada al ingreso neto)
  const suggested = {
    needs: roundMoney(netIncome * (rule.needsPercent / 100)),
    wants: roundMoney(netIncome * (rule.wantsPercent / 100)),
    savings: roundMoney(netIncome * (rule.savingsPercent / 100)),
  };

  // Distribución real
  const needsActual = roundMoney(fixedExpenses + totalDebtPayments);
  const wantsActual = variableExpenses;
  const savingsActual = surplus;

  const actual = {
    needsPercent: netIncome > 0 ? roundMoney((needsActual / netIncome) * 100) : 0,
    wantsPercent: netIncome > 0 ? roundMoney((wantsActual / netIncome) * 100) : 0,
    savingsPercent: netIncome > 0 ? roundMoney((savingsActual / netIncome) * 100) : 0,
  };

  const healthScore = calculateHealthScore(netIncome, totalDebtPayments, totalCommitted);

  return {
    netIncome,
    fixedExpenses,
    variableExpenses,
    totalDebtPayments,
    totalCommitted,
    availableReal,
    surplus,
    deficit,
    isDeficit,
    suggested,
    actual,
    healthScore,
  };
}

/**
 * Calcula el semáforo de salud financiera.
 * 
 * 🟢 Verde:   debtRatio < 30% — saludable
 * 🟡 Amarillo: 30% ≤ debtRatio < 50% — precaución
 * 🔴 Rojo:    debtRatio ≥ 50% — peligro
 */
export function calculateHealthScore(
  netIncome: number,
  totalDebtPayments: number,
  totalCommitted: number
): HealthScore {
  if (netIncome <= 0) {
    return {
      level: 'red',
      label: 'Sin Ingresos',
      description: 'No se puede evaluar sin ingresos registrados.',
      debtRatio: 0,
      expenseRatio: 0,
      score: 0,
    };
  }

  const debtRatio = roundMoney((totalDebtPayments / netIncome) * 100);
  const expenseRatio = roundMoney((totalCommitted / netIncome) * 100);

  let level: HealthLevel;
  let label: string;
  let description: string;
  let score: number;

  if (debtRatio < 30) {
    level = 'green';
    label = 'Saludable';
    description = `Tu nivel de endeudamiento es bajo (${debtRatio}% de tu ingreso). ¡Buen trabajo!`;
    score = Math.min(100, Math.round(100 - debtRatio * 1.5));
  } else if (debtRatio < 50) {
    level = 'yellow';
    label = 'Precaución';
    description = `Tus deudas consumen el ${debtRatio}% de tu ingreso. Considera reducir gastos variables o buscar ingresos adicionales.`;
    score = Math.max(30, Math.round(80 - (debtRatio - 30) * 2));
  } else {
    level = 'red';
    label = 'Peligro';
    description = `Tus deudas consumen el ${debtRatio}% de tu ingreso. Es urgente reestructurar tu deuda o buscar asesoría financiera.`;
    score = Math.max(0, Math.round(30 - (debtRatio - 50)));
  }

  // Penalizar si los gastos totales superan el ingreso
  if (expenseRatio > 100) {
    level = 'red';
    label = 'Déficit';
    description = `Estás gastando más de lo que ganas (${expenseRatio}% de tu ingreso). Necesitas reducir gastos urgentemente.`;
    score = Math.max(0, score - 20);
  }

  return { level, label, description, debtRatio, expenseRatio, score };
}
