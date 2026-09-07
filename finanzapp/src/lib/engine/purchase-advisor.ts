/**
 * FinancialEngine — Purchase Advisor
 * Evalúa si una compra es viable según la situación financiera actual.
 */

import { roundMoney } from './income';

export interface PurchaseInput {
  amount: number;
  description: string;
}

export interface FinancialSnapshot {
  surplus: number;                   // Excedente actual del mes
  emergencyFundCurrent: number;      // Fondo de emergencia actual
  emergencyFundTarget: number;       // Meta de fondo de emergencia (3 meses)
  totalDebtPaymentsNextMonth: number;// Cuotas del próximo mes
  netIncome: number;                 // Ingreso neto mensual
  savingsGoalMonthly: number;        // Ahorro mensual comprometido
}

export type RecommendationType = 'YES' | 'NO' | 'CONDITIONAL';

export interface PurchaseRecommendation {
  recommendation: RecommendationType;
  emoji: string;
  title: string;
  justification: string;
  details: PurchaseDetail[];
  alternativeSuggestion?: string;
}

export interface PurchaseDetail {
  label: string;
  value: string;
  type: 'positive' | 'negative' | 'neutral';
}

/**
 * Evalúa si el usuario puede permitirse una compra.
 * Considera: excedente actual, fondo de emergencia, deudas, ahorro.
 */
export function evaluatePurchase(
  purchase: PurchaseInput,
  snapshot: FinancialSnapshot
): PurchaseRecommendation {
  const { amount } = purchase;
  const {
    surplus,
    emergencyFundCurrent,
    emergencyFundTarget,
    totalDebtPaymentsNextMonth,
    netIncome,
    savingsGoalMonthly,
  } = snapshot;

  const details: PurchaseDetail[] = [];

  // 1. ¿Puede pagarlo con el excedente?
  const canAffordFromSurplus = amount <= surplus;
  const surplusAfterPurchase = roundMoney(surplus - amount);

  details.push({
    label: 'Excedente actual',
    value: `$${surplus.toFixed(2)}`,
    type: surplus > 0 ? 'positive' : 'negative',
  });

  details.push({
    label: 'Excedente después de la compra',
    value: `$${surplusAfterPurchase.toFixed(2)}`,
    type: surplusAfterPurchase >= 0 ? 'positive' : 'negative',
  });

  // 2. ¿Impacta el fondo de emergencia?
  const emergencyFundRatio = emergencyFundTarget > 0
    ? roundMoney((emergencyFundCurrent / emergencyFundTarget) * 100)
    : 100;
  const emergencyFundAdequate = emergencyFundCurrent >= emergencyFundTarget;

  details.push({
    label: 'Fondo de emergencia',
    value: `$${emergencyFundCurrent.toFixed(2)} (${emergencyFundRatio}% de meta)`,
    type: emergencyFundAdequate ? 'positive' : 'negative',
  });

  // 3. ¿Qué porcentaje del ingreso representa?
  const purchasePercent = netIncome > 0
    ? roundMoney((amount / netIncome) * 100)
    : 100;

  details.push({
    label: '% del ingreso mensual',
    value: `${purchasePercent}%`,
    type: purchasePercent <= 10 ? 'positive' : purchasePercent <= 25 ? 'neutral' : 'negative',
  });

  // 4. Capacidad de pago de deudas intacta
  details.push({
    label: 'Cuotas de deuda del próximo mes',
    value: `$${totalDebtPaymentsNextMonth.toFixed(2)}`,
    type: 'neutral',
  });

  // ---- Decisión ----
  let recommendation: RecommendationType;
  let emoji: string;
  let title: string;
  let justification: string;
  let alternativeSuggestion: string | undefined;

  if (canAffordFromSurplus && emergencyFundAdequate && purchasePercent <= 25) {
    // ESCENARIO 1: Todo bien
    recommendation = 'YES';
    emoji = '✅';
    title = '¡Puedes comprarlo!';
    justification = `Tienes un excedente de $${surplus.toFixed(2)} y la compra de $${amount.toFixed(2)} ` +
      `representa solo el ${purchasePercent}% de tu ingreso. Tu fondo de emergencia está completo ` +
      `y tus deudas del próximo mes están cubiertas.`;
  } else if (canAffordFromSurplus && (!emergencyFundAdequate || purchasePercent > 25)) {
    // ESCENARIO 2: Puede pero con reservas
    recommendation = 'CONDITIONAL';
    emoji = '⚠️';
    title = 'Puedes, pero con precaución';

    const warnings: string[] = [];
    if (!emergencyFundAdequate) {
      warnings.push(`tu fondo de emergencia está al ${emergencyFundRatio}% de la meta`);
    }
    if (purchasePercent > 25) {
      warnings.push(`esta compra representa el ${purchasePercent}% de tu ingreso mensual`);
    }
    if (savingsGoalMonthly > 0 && amount > surplusAfterPurchase) {
      warnings.push(`reducirás tu capacidad de ahorro este mes`);
    }

    justification = `Técnicamente puedes pagarlo con tu excedente de $${surplus.toFixed(2)}, pero ` +
      warnings.join(' y ') + '. Considera si es una necesidad o puede esperar.';

    if (purchasePercent > 25) {
      alternativeSuggestion = `Podrías ahorrar $${roundMoney(amount / 3).toFixed(2)}/mes durante 3 meses para comprarlo sin impactar tus finanzas.`;
    }
  } else {
    // ESCENARIO 3: No puede
    recommendation = 'NO';
    emoji = '🚫';
    title = 'No es recomendable ahora';

    justification = `Tu excedente actual es de $${surplus.toFixed(2)} y la compra cuesta $${amount.toFixed(2)}. `;

    if (surplus <= 0) {
      justification += 'Actualmente no tienes excedente disponible. Necesitas reducir gastos o aumentar ingresos antes de considerar esta compra.';
    } else {
      justification += `Te faltarían $${roundMoney(amount - surplus).toFixed(2)}. `;
      const monthsNeeded = Math.ceil(amount / Math.max(surplus, 1));
      justification += `Si ahorras tu excedente completo, podrías comprarlo en ${monthsNeeded} mes(es).`;
    }

    alternativeSuggestion = surplus > 0
      ? `Ahorra $${roundMoney(amount / Math.max(Math.ceil(amount / surplus), 2)).toFixed(2)}/mes y podrás comprarlo sin desequilibrar tus finanzas.`
      : 'Primero enfócate en equilibrar tu presupuesto y pagar deudas prioritarias.';
  }

  return {
    recommendation,
    emoji,
    title,
    justification,
    details,
    alternativeSuggestion,
  };
}
