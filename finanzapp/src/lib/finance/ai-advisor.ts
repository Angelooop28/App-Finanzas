/**
 * Fin593 AI — Asesor Financiero Inteligente y Explicable
 * Evaluación de capacidad crediticia, simulación de nueva deuda y respuestas financieras contextuales.
 */

export interface LoanSimulationInput {
  amount: number;
  monthlyPayment?: number;
  termMonths: number;
  annualInterestRate: number; // e.g. 16.0% (Crédito consumo Ecuador)
  institutionType: 'BANCO' | 'COOPERATIVA' | 'BIESS' | 'COMERCIO' | 'INFORMAL';
  purpose: string;
}

export interface LoanEvaluationResult {
  isCompatible: boolean;
  verdict: 'COMPATIBLE' | 'MODERATE_RISK' | 'HIGH_RISK';
  badge: { label: string; color: string; bg: string };
  calculatedMonthlyPayment: number;
  totalInterestToPay: number;
  totalRepayment: number;
  newDebtToIncomeRatio: number;
  currentDebtToIncomeRatio: number;
  surplusBefore: number;
  surplusAfter: number;
  diagnosis: string;
  recommendation: string;
  alternative: string;
}

export interface AIQueryResponse {
  question: string;
  verdict: 'YES' | 'NO' | 'CONDITIONAL' | 'INFO';
  title: string;
  diagnosis: {
    income: number;
    committedExpenses: number;
    currentDebts: number;
    surplus: number;
    debtRatio: number;
  };
  recommendation: string;
  reasoning: string;
  alternativeAction: string;
  suggestedPrompts: string[];
}

/**
 * Evalúa la viabilidad de adquirir un nuevo préstamo / deuda
 */
export function evaluateNewDebt(
  input: LoanSimulationInput,
  userFinance: {
    netIncome: number;
    fixedExpenses: number;
    variableExpenses: number;
    currentMonthlyDebtPayments: number;
    emergencyFund: number;
  }
): LoanEvaluationResult {
  const { netIncome, fixedExpenses, variableExpenses, currentMonthlyDebtPayments } = userFinance;
  const { amount, termMonths, annualInterestRate, institutionType, purpose } = input;

  // Cálculo de cuota mensual (Fórmula francesa amortización si no se especifica cuota fija)
  let monthlyPayment = input.monthlyPayment ?? 0;
  if (monthlyPayment <= 0 && termMonths > 0) {
    const monthlyRate = annualInterestRate / 100 / 12;
    if (monthlyRate === 0) {
      monthlyPayment = amount / termMonths;
    } else {
      monthlyPayment = (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));
    }
  }

  const totalRepayment = monthlyPayment * termMonths;
  const totalInterestToPay = Math.max(0, totalRepayment - amount);

  const currentCommitted = fixedExpenses + variableExpenses + currentMonthlyDebtPayments;
  const surplusBefore = netIncome - currentCommitted;
  const surplusAfter = surplusBefore - monthlyPayment;

  const currentDebtRatio = netIncome > 0 ? (currentMonthlyDebtPayments / netIncome) * 100 : 0;
  const newDebtRatio = netIncome > 0 ? ((currentMonthlyDebtPayments + monthlyPayment) / netIncome) * 100 : 0;

  let verdict: 'COMPATIBLE' | 'MODERATE_RISK' | 'HIGH_RISK';
  let isCompatible = false;
  let badge = { label: 'No Recomendable', color: 'var(--danger-600)', bg: 'var(--danger-50)' };
  let diagnosis = '';
  let recommendation = '';
  let alternative = '';

  const purposeText = purpose ? ` para "${purpose}"` : '';
  const institutionLabel = institutionType === 'BIESS' ? 'BIESS' : institutionType === 'COOPERATIVA' ? 'Cooperativa' : institutionType === 'COMERCIO' ? 'Crédito Comercial' : institutionType === 'INFORMAL' ? 'Crédito Informal' : 'Banco Privado';

  if (surplusAfter >= netIncome * 0.1 && newDebtRatio <= 35) {
    verdict = 'COMPATIBLE';
    isCompatible = true;
    badge = { label: 'Compatible y Seguro 🟢', color: 'var(--success-600)', bg: 'var(--success-50)' };
    diagnosis = `Tu ingreso de $${netIncome.toFixed(2)} cubre holgadamente la nueva cuota de $${monthlyPayment.toFixed(2)}/mes en ${institutionLabel}${purposeText}. Tu ratio de endeudamiento pasará de ${currentDebtRatio.toFixed(0)}% a ${newDebtRatio.toFixed(0)}%, manteniéndose en zona verde.`;
    recommendation = `Puedes asumir este crédito con tranquilidad. Mantén tu excedente remanente de $${surplusAfter.toFixed(2)} para ahorro.`;
    alternative = 'Si puedes negociar una tasa menor o dar un anticipo mayor, ahorrarás más en intereses.';
  } else if (surplusAfter >= 0 && newDebtRatio <= 48) {
    verdict = 'MODERATE_RISK';
    isCompatible = true;
    badge = { label: 'Riesgo Moderado 🟠', color: 'var(--warning-600)', bg: 'var(--warning-50)' };
    diagnosis = `La nueva cuota de $${monthlyPayment.toFixed(2)} en ${institutionLabel}${purposeText} eleva tu nivel de endeudamiento al ${newDebtRatio.toFixed(0)}% de tu ingreso neto, reduciendo tu excedente a $${surplusAfter.toFixed(2)}.`;
    recommendation = `Técnicamente viable, pero compromete tu capacidad ante imprevistos. Solo recomendable si el destino es inversión patrimonial (vivienda, educación, negocio) y no consumo prescindible.`;
    alternative = `Considera extender el plazo a ${termMonths + 12} meses para reducir la cuota mensual o postergar la adquisición hasta liquidar una deuda previa.`;
  } else {
    verdict = 'HIGH_RISK';
    isCompatible = false;
    badge = { label: 'Crítico / No Recomendado 🔴', color: 'var(--danger-600)', bg: 'var(--danger-50)' };
    diagnosis = surplusAfter < 0
      ? `Asumir esta cuota de $${monthlyPayment.toFixed(2)} en ${institutionLabel}${purposeText} provocará un déficit mensual de $${Math.abs(surplusAfter).toFixed(2)}. No tienes liquidez para pagarla sin endeudarte más.`
      : `Tu ratio de endeudamiento treparía al ${newDebtRatio.toFixed(0)}% en ${institutionLabel}, sobrepasando el límite de seguridad crediticia (40%).`;
    recommendation = `No es prudente solicitar este crédito en este momento. Afectará gravemente tu estabilidad financiera.`;
    alternative = `Prioriza primero amortizar deudas existentes para liberar mínimo $${monthlyPayment.toFixed(2)} de flujo de caja antes de solicitar nuevos fondos.`;
  }

  return {
    isCompatible,
    verdict,
    badge,
    calculatedMonthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalInterestToPay: Math.round(totalInterestToPay * 100) / 100,
    totalRepayment: Math.round(totalRepayment * 100) / 100,
    newDebtToIncomeRatio: Math.round(newDebtRatio),
    currentDebtToIncomeRatio: Math.round(currentDebtRatio),
    surplusBefore: Math.round(surplusBefore * 100) / 100,
    surplusAfter: Math.round(surplusAfter * 100) / 100,
    diagnosis,
    recommendation,
    alternative,
  };
}

/**
 * Procesa consultas financieras interactivas con contexto en tiempo real
 */
export function processFinancialAIQuery(
  question: string,
  userFinance: {
    netIncome: number;
    fixedExpenses: number;
    variableExpenses: number;
    totalDebtPayments: number;
    emergencyFund: number;
    debtsCount: number;
  }
): AIQueryResponse {
  const q = question.toLowerCase();
  const { netIncome, fixedExpenses, variableExpenses, totalDebtPayments, emergencyFund } = userFinance;
  const totalCommitted = fixedExpenses + variableExpenses + totalDebtPayments;
  const surplus = netIncome - totalCommitted;
  const debtRatio = netIncome > 0 ? (totalDebtPayments / netIncome) * 100 : 0;

  const diagnosis = {
    income: netIncome,
    committedExpenses: fixedExpenses + variableExpenses,
    currentDebts: totalDebtPayments,
    surplus: Math.max(0, surplus),
    debtRatio: Math.round(debtRatio),
  };

  const defaultPrompts = [
    '¿Qué deuda debería pagar primero?',
    '¿Cuánto dinero tendré disponible a fin de mes?',
    '¿Dónde estoy gastando demasiado?',
    '¿Puedo comprar un electrodoméstico de $600?',
    '¿Cómo mejorar mi fondo de emergencia?',
  ];

  if (q.includes('pagar primero') || q.includes('prioriz') || q.includes('deuda')) {
    return {
      question,
      verdict: 'INFO',
      title: 'Estrategia de Pagos Prioritarios',
      diagnosis,
      recommendation: debtRatio > 35
        ? 'Aplica el Método Avalancha inmediatamente para reducir la sangría en intereses.'
        : 'Tu nivel de deuda es manejable; puedes usar el Método Bola de Nieve para liquidar saldos pequeños y ganar impulso.',
      reasoning: `Tus deudas mensuales consumen $${totalDebtPayments.toFixed(2)} (${debtRatio.toFixed(0)}% del ingreso). La prioridad número uno en Ecuador es pagar cualquier obligación legal/SUPA, seguida de tarjetas de crédito (tasas cercanas al 16-17%).`,
      alternativeAction: 'Dirígete al módulo de Deudas para ver el desglose comparativo de Avalancha vs Bola de Nieve con tu ahorro exacto en dólares.',
      suggestedPrompts: defaultPrompts,
    };
  }

  if (q.includes('disponible') || q.includes('fin de mes') || q.includes('excedente') || q.includes('flujo')) {
    const isPositive = surplus > 0;
    return {
      question,
      verdict: isPositive ? 'YES' : 'NO',
      title: 'Proyección de Flujo de Caja Mensual',
      diagnosis,
      recommendation: isPositive
        ? `Se proyecta un excedente neto positivo de $${surplus.toFixed(2)} al cierre del ciclo.`
        : `Atención: Se proyecta un déficit de -$${Math.abs(surplus).toFixed(2)}.`,
      reasoning: `De tus $${netIncome.toFixed(2)} de ingreso neto, $${(fixedExpenses + variableExpenses).toFixed(2)} están destinados a gastos y $${totalDebtPayments.toFixed(2)} a cuotas de deuda.`,
      alternativeAction: isPositive
        ? 'Destina mínimo el 50% de ese excedente ($' + (surplus * 0.5).toFixed(2) + ') al Fondo de Emergencia antes de incurrir en gastos discrecionales.'
        : 'Revisa de inmediato tus gastos variables en el módulo de Gastos para recortar servicios no esenciales.',
      suggestedPrompts: defaultPrompts,
    };
  }

  if (q.includes('ahorr') || q.includes('emergencia') || q.includes('meta')) {
    const targetFund = fixedExpenses * 3;
    const bufferMonths = fixedExpenses > 0 ? (emergencyFund / fixedExpenses).toFixed(1) : '0';
    return {
      question,
      verdict: 'INFO',
      title: 'Diagnóstico de Ahorro y Contingencias',
      diagnosis,
      recommendation: `Tu fondo de emergencia actual cubre ${bufferMonths} meses de gastos fijos. La meta recomendada para Ecuador es de 3 meses ($${targetFund.toFixed(2)}).`,
      reasoning: `Mantener un colchón de 3 meses te protege ante demoras de pago de nómina o imprevistos médicos sin recurrir a tarjetas de crédito de alto interés.`,
      alternativeAction: `Programa un ahorro automático mensual de $${Math.max(25, Math.round(surplus * 0.4)).toFixed(2)} en el módulo de Ahorro.`,
      suggestedPrompts: defaultPrompts,
    };
  }

  // Respuesta general de diagnóstico
  return {
    question,
    verdict: 'INFO',
    title: 'Diagnóstico Integral Fin593 AI',
    diagnosis,
    recommendation: surplus > 0
      ? `Tus finanzas operan con un excedente de $${surplus.toFixed(2)}. Tu ratio de deuda está al ${debtRatio.toFixed(0)}%.`
      : `Tus finanzas se encuentran en zona de déficit (-$${Math.abs(surplus).toFixed(2)}).`,
    reasoning: `Con un ingreso neto de $${netIncome.toFixed(2)}, tus costos totales ascienden a $${totalCommitted.toFixed(2)}. La regla 50/30/20 sugiere no superar el 50% en necesidades básicas ni el 30% en deudas.`,
    alternativeAction: 'Explora las opciones de simulador de compras o deudas para evaluar movimientos específicos antes de ejecutarlos.',
    suggestedPrompts: defaultPrompts,
  };
}
