/**
 * FinancialEngine — Debt Prioritizer
 * Implementa los métodos Avalancha y Bola de Nieve para priorización de deudas.
 */

import { roundMoney } from './income';

export interface DebtInput {
  id: string;
  name: string;
  totalOwed: number;
  monthlyPayment: number;
  interestRate: number;   // Tasa anual %
  remainingInstallments?: number;
  manualPriority?: number;
}

export interface DebtPrioritized extends DebtInput {
  rank: number;
  totalInterestPaid: number;
  monthsToPayoff: number;
  totalPaid: number;
}

export interface PrioritizationResult {
  method: 'avalanche' | 'snowball';
  methodName: string;
  description: string;
  debts: DebtPrioritized[];
  totalInterest: number;
  totalMonths: number;
  totalPaid: number;
}

export interface ComparisonResult {
  avalanche: PrioritizationResult;
  snowball: PrioritizationResult;
  interestSaved: number;       // Avalanche saves this much vs Snowball
  monthsDifference: number;    // Months difference
  recommendation: 'avalanche' | 'snowball';
  recommendationReason: string;
}

/**
 * Prioriza deudas usando el método AVALANCHA.
 * Ordena por tasa de interés descendente (paga primero la de mayor tasa).
 * Matemáticamente óptimo: minimiza intereses totales.
 */
export function prioritizeAvalanche(debts: DebtInput[]): PrioritizationResult {
  const sorted = [...debts].sort((a, b) => b.interestRate - a.interestRate);

  const prioritized = sorted.map((debt, index) => calculateDebtPayoff(debt, index + 1));

  return {
    method: 'avalanche',
    methodName: 'Método Avalancha',
    description: 'Paga primero la deuda con mayor tasa de interés. Minimiza el total de intereses pagados.',
    debts: prioritized,
    totalInterest: roundMoney(prioritized.reduce((sum, d) => sum + d.totalInterestPaid, 0)),
    totalMonths: Math.max(...prioritized.map(d => d.monthsToPayoff)),
    totalPaid: roundMoney(prioritized.reduce((sum, d) => sum + d.totalPaid, 0)),
  };
}

/**
 * Prioriza deudas usando el método BOLA DE NIEVE.
 * Ordena por saldo adeudado ascendente (paga primero la más pequeña).
 * Motivacionalmente óptimo: genera victorias rápidas.
 */
export function prioritizeSnowball(debts: DebtInput[]): PrioritizationResult {
  const sorted = [...debts].sort((a, b) => a.totalOwed - b.totalOwed);

  const prioritized = sorted.map((debt, index) => calculateDebtPayoff(debt, index + 1));

  return {
    method: 'snowball',
    methodName: 'Método Bola de Nieve',
    description: 'Paga primero la deuda más pequeña. Genera motivación con victorias rápidas.',
    debts: prioritized,
    totalInterest: roundMoney(prioritized.reduce((sum, d) => sum + d.totalInterestPaid, 0)),
    totalMonths: Math.max(...prioritized.map(d => d.monthsToPayoff)),
    totalPaid: roundMoney(prioritized.reduce((sum, d) => sum + d.totalPaid, 0)),
  };
}

/**
 * Compara ambos métodos y genera una recomendación.
 */
export function compareDebtStrategies(debts: DebtInput[]): ComparisonResult {
  if (debts.length === 0) {
    return {
      avalanche: {
        method: 'avalanche',
        methodName: 'Método Avalancha',
        description: 'No hay deudas registradas.',
        debts: [],
        totalInterest: 0,
        totalMonths: 0,
        totalPaid: 0,
      },
      snowball: {
        method: 'snowball',
        methodName: 'Método Bola de Nieve',
        description: 'No hay deudas registradas.',
        debts: [],
        totalInterest: 0,
        totalMonths: 0,
        totalPaid: 0,
      },
      interestSaved: 0,
      monthsDifference: 0,
      recommendation: 'avalanche',
      recommendationReason: 'No hay deudas registradas.',
    };
  }

  const avalanche = prioritizeAvalanche(debts);
  const snowball = prioritizeSnowball(debts);

  const interestSaved = roundMoney(snowball.totalInterest - avalanche.totalInterest);
  const monthsDifference = snowball.totalMonths - avalanche.totalMonths;

  // Heurística de recomendación:
  // - Si la diferencia en intereses es significativa (> 5% del total), recomendar avalancha
  // - Si hay muchas deudas pequeñas y la diferencia es mínima, recomendar bola de nieve
  const interestDiffPercent = avalanche.totalInterest > 0
    ? (interestSaved / avalanche.totalInterest) * 100
    : 0;

  const smallDebtsCount = debts.filter(d => d.totalOwed < 500).length;
  const totalDebts = debts.length;

  let recommendation: 'avalanche' | 'snowball';
  let recommendationReason: string;

  if (interestSaved > 50 || interestDiffPercent > 5) {
    recommendation = 'avalanche';
    recommendationReason = `El método Avalancha te ahorra $${interestSaved.toFixed(2)} en intereses` +
      (monthsDifference > 0 ? ` y ${monthsDifference} mes(es) menos de deuda.` : '.');
  } else if (smallDebtsCount >= totalDebts / 2) {
    recommendation = 'snowball';
    recommendationReason = `Tienes ${smallDebtsCount} deuda(s) pequeña(s). La Bola de Nieve te dará victorias rápidas ` +
      `con una diferencia mínima de $${interestSaved.toFixed(2)} en intereses.`;
  } else {
    recommendation = 'avalanche';
    recommendationReason = 'El método Avalancha es la opción más eficiente para tu perfil de deudas.';
  }

  return {
    avalanche,
    snowball,
    interestSaved,
    monthsDifference,
    recommendation,
    recommendationReason,
  };
}

/**
 * Calcula cuánto se pagará en total por una deuda (capital + intereses).
 */
function calculateDebtPayoff(debt: DebtInput, rank: number): DebtPrioritized {
  const { totalOwed, monthlyPayment, interestRate } = debt;

  if (monthlyPayment <= 0 || totalOwed <= 0) {
    return {
      ...debt,
      rank,
      totalInterestPaid: 0,
      monthsToPayoff: 0,
      totalPaid: 0,
    };
  }

  const monthlyRate = interestRate / 100 / 12;

  if (monthlyRate === 0) {
    // Sin interés — pago directo
    const months = Math.ceil(totalOwed / monthlyPayment);
    return {
      ...debt,
      rank,
      totalInterestPaid: 0,
      monthsToPayoff: months,
      totalPaid: totalOwed,
    };
  }

  // Simulación mes a mes (más preciso que fórmula cerrada con pagos variables)
  let balance = totalOwed;
  let totalInterest = 0;
  let months = 0;
  const maxMonths = 360; // 30 años max

  while (balance > 0 && months < maxMonths) {
    const interest = roundMoney(balance * monthlyRate);
    totalInterest += interest;
    balance = roundMoney(balance + interest - monthlyPayment);
    months++;

    if (balance < 0) {
      balance = 0;
    }
  }

  return {
    ...debt,
    rank,
    totalInterestPaid: roundMoney(totalInterest),
    monthsToPayoff: months,
    totalPaid: roundMoney(totalOwed + totalInterest),
  };
}
