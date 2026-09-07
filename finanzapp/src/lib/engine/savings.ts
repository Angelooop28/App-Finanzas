/**
 * FinancialEngine — Savings Calculator
 * Calcula planes de ahorro y simula escenarios.
 */

import { roundMoney } from './income';

export interface SavingsGoalInput {
  targetAmount: number;
  currentAmount: number;
  monthlyContribution?: number;
  targetMonths?: number;
}

export interface SavingsSimulation {
  targetAmount: number;
  currentAmount: number;
  remaining: number;
  monthlyContribution: number;
  monthsToGoal: number;
  projectedDate: Date;
  totalContributed: number;
  progressPercent: number;
}

export interface EmergencyFundRecommendation {
  monthlyFixedExpenses: number;
  recommended3Months: number;
  recommended6Months: number;
  currentAmount: number;
  coverageMonths: number;
  isAdequate: boolean;
  recommendation: string;
}

/**
 * Simula cuánto tardará en llegar a una meta de ahorro.
 */
export function simulateSavings(input: SavingsGoalInput): SavingsSimulation {
  const { targetAmount, currentAmount, monthlyContribution, targetMonths } = input;
  const remaining = roundMoney(Math.max(0, targetAmount - currentAmount));

  let contribution: number;
  let months: number;

  if (monthlyContribution && monthlyContribution > 0) {
    // Tiene monto mensual → calcular meses
    contribution = monthlyContribution;
    months = remaining > 0 ? Math.ceil(remaining / contribution) : 0;
  } else if (targetMonths && targetMonths > 0) {
    // Tiene meses → calcular monto mensual necesario
    months = targetMonths;
    contribution = remaining > 0 ? roundMoney(remaining / months) : 0;
  } else {
    contribution = 0;
    months = 0;
  }

  const now = new Date();
  const projectedDate = new Date(now.getFullYear(), now.getMonth() + months, now.getDate());

  const progressPercent = targetAmount > 0
    ? roundMoney((currentAmount / targetAmount) * 100)
    : 0;

  return {
    targetAmount,
    currentAmount,
    remaining,
    monthlyContribution: contribution,
    monthsToGoal: months,
    projectedDate,
    totalContributed: roundMoney(contribution * months),
    progressPercent: Math.min(100, progressPercent),
  };
}

/**
 * Calcula la recomendación de fondo de emergencia.
 * Estándar: 3-6 meses de gastos fijos mensuales.
 */
export function calculateEmergencyFund(
  monthlyFixedExpenses: number,
  currentSavings: number
): EmergencyFundRecommendation {
  const recommended3Months = roundMoney(monthlyFixedExpenses * 3);
  const recommended6Months = roundMoney(monthlyFixedExpenses * 6);
  const coverageMonths = monthlyFixedExpenses > 0
    ? roundMoney(currentSavings / monthlyFixedExpenses)
    : 0;

  const isAdequate = currentSavings >= recommended3Months;

  let recommendation: string;
  if (coverageMonths >= 6) {
    recommendation = '¡Excelente! Tu fondo de emergencia cubre más de 6 meses de gastos. Considera invertir el excedente.';
  } else if (coverageMonths >= 3) {
    recommendation = `Tu fondo cubre ${coverageMonths.toFixed(1)} meses. Estás en buen camino, pero intenta llegar a 6 meses ($${recommended6Months.toFixed(2)}).`;
  } else if (coverageMonths >= 1) {
    recommendation = `Tu fondo solo cubre ${coverageMonths.toFixed(1)} mes(es). Prioriza ahorrar para llegar al mínimo de 3 meses ($${recommended3Months.toFixed(2)}).`;
  } else {
    recommendation = `No tienes fondo de emergencia suficiente. Necesitas al menos $${recommended3Months.toFixed(2)} (3 meses de gastos fijos). Esto debería ser tu prioridad #1.`;
  }

  return {
    monthlyFixedExpenses,
    recommended3Months,
    recommended6Months,
    currentAmount: currentSavings,
    coverageMonths,
    isAdequate,
    recommendation,
  };
}
