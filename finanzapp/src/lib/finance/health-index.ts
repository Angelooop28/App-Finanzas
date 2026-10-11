/**
 * Composite Financial Health Index — Fin593 Ecuador
 * Índice integral de salud financiera de 0 a 100 con diagnóstico explicable.
 */

export interface HealthPillar {
  name: string;
  score: number; // 0-100
  weight: number; // ponderación
  status: 'OPTIMAL' | 'MODERATE' | 'CRITICAL';
  metric: string;
  tip: string;
}

export interface FinancialHealthReport {
  overallScore: number; // 0-100
  level: 'green' | 'yellow' | 'red';
  statusTitle: string;
  summary: string;
  pillars: HealthPillar[];
  debtRatio: number;
  savingsBufferMonths: number;
}

export function computeFinancialHealthIndex(params: {
  netIncome: number;
  fixedExpenses: number;
  variableExpenses: number;
  totalMonthlyDebtPayments: number;
  totalDebtBalance: number;
  emergencyFundBalance: number;
}): FinancialHealthReport {
  const {
    netIncome,
    fixedExpenses,
    variableExpenses,
    totalMonthlyDebtPayments,
    emergencyFundBalance,
  } = params;

  if (netIncome <= 0) {
    return {
      overallScore: 0,
      level: 'red',
      statusTitle: 'Sin Ingreso Registrado',
      summary: 'Registra tus ingresos mensuales para que el motor financiero evalúe tu salud patrimonial.',
      pillars: [],
      debtRatio: 0,
      savingsBufferMonths: 0,
    };
  }

  const totalCommitted = fixedExpenses + variableExpenses + totalMonthlyDebtPayments;
  const netSurplus = netIncome - totalCommitted;
  const debtRatio = (totalMonthlyDebtPayments / netIncome) * 100;
  const savingsBufferMonths = fixedExpenses > 0 ? emergencyFundBalance / fixedExpenses : 0;
  const savingsRatio = netSurplus > 0 ? (netSurplus / netIncome) * 100 : 0;

  // Pilar 1: Capacidad de Endeudamiento (Peso: 35%)
  let debtScore = 100;
  if (debtRatio <= 20) debtScore = 100;
  else if (debtRatio <= 30) debtScore = 85;
  else if (debtRatio <= 40) debtScore = 65;
  else if (debtRatio <= 50) debtScore = 40;
  else debtScore = Math.max(0, 30 - (debtRatio - 50) * 1.5);

  const debtPillar: HealthPillar = {
    name: 'Nivel de Endeudamiento',
    score: Math.round(debtScore),
    weight: 0.35,
    status: debtRatio <= 30 ? 'OPTIMAL' : debtRatio <= 45 ? 'MODERATE' : 'CRITICAL',
    metric: `${debtRatio.toFixed(1)}% del ingreso`,
    tip: debtRatio <= 30 ? 'Excelente control de endeudamiento.' : 'Prioriza amortizar deudas con tasa alta (Avalancha).',
  };

  // Pilar 2: Liquidez y Flujo Libre (Peso: 30%)
  let liquidityScore = 50;
  if (netSurplus >= netIncome * 0.2) liquidityScore = 100;
  else if (netSurplus >= netIncome * 0.1) liquidityScore = 80;
  else if (netSurplus > 0) liquidityScore = 60;
  else liquidityScore = Math.max(0, 40 + (netSurplus / netIncome) * 100);

  const liquidityPillar: HealthPillar = {
    name: 'Liquidez & Excedente',
    score: Math.round(liquidityScore),
    weight: 0.30,
    status: netSurplus >= netIncome * 0.1 ? 'OPTIMAL' : netSurplus > 0 ? 'MODERATE' : 'CRITICAL',
    metric: netSurplus >= 0 ? `+$${netSurplus.toFixed(2)} libre` : `-$${Math.abs(netSurplus).toFixed(2)} déficit`,
    tip: netSurplus > 0 ? 'Mantienes flujo de caja positivo.' : 'Urgente: congela gastos variables para frenar el déficit.',
  };

  // Pilar 3: Blindaje y Fondo de Emergencia (Peso: 20%)
  let bufferScore = 0;
  if (savingsBufferMonths >= 3) bufferScore = 100;
  else if (savingsBufferMonths >= 2) bufferScore = 75;
  else if (savingsBufferMonths >= 1) bufferScore = 50;
  else bufferScore = Math.round((savingsBufferMonths / 1) * 40);

  const bufferPillar: HealthPillar = {
    name: 'Fondo de Emergencia',
    score: Math.min(100, Math.round(bufferScore)),
    weight: 0.20,
    status: savingsBufferMonths >= 3 ? 'OPTIMAL' : savingsBufferMonths >= 1 ? 'MODERATE' : 'CRITICAL',
    metric: `${savingsBufferMonths.toFixed(1)} meses de gastos`,
    tip: savingsBufferMonths >= 3 ? 'Fondo de contingencia completo.' : 'Apunta a acumular mínimo 3 meses de gastos fijos.',
  };

  // Pilar 4: Tasa de Ahorro y Capacidad de Crecimiento (Peso: 15%)
  let savingsScore = 0;
  if (savingsRatio >= 20) savingsScore = 100;
  else if (savingsRatio >= 10) savingsScore = 75;
  else if (savingsRatio > 0) savingsScore = 50;
  else savingsScore = 0;

  const savingsPillar: HealthPillar = {
    name: 'Capacidad de Ahorro',
    score: Math.round(savingsScore),
    weight: 0.15,
    status: savingsRatio >= 20 ? 'OPTIMAL' : savingsRatio >= 10 ? 'MODERATE' : 'CRITICAL',
    metric: `${Math.max(0, savingsRatio).toFixed(1)}% del ingreso`,
    tip: savingsRatio >= 20 ? 'Cumples la regla del 20% de ahorro.' : 'Automatiza una transferencia de ahorro a inicio de mes.',
  };

  const pillars = [debtPillar, liquidityPillar, bufferPillar, savingsPillar];
  const overallScore = Math.round(
    pillars.reduce((sum, p) => sum + p.score * p.weight, 0)
  );

  let level: 'green' | 'yellow' | 'red';
  let statusTitle: string;
  let summary: string;

  if (overallScore >= 75) {
    level = 'green';
    statusTitle = 'Salud Financiera Óptima 🟢';
    summary = `Tu perfil es sólido (Puntaje: ${overallScore}/100). Tus deudas están controladas (${debtRatio.toFixed(0)}% del ingreso) y cuentas con excedente mensual para acelerar metas patrimoniales.`;
  } else if (overallScore >= 50) {
    level = 'yellow';
    statusTitle = 'Atención y Precaución 🟠';
    summary = `Tu situación está en equilibrio moderado (Puntaje: ${overallScore}/100). Tus compromisos consumen una porción relevante de tu ingreso. Se recomienda evitar nuevas deudas de consumo.`;
  } else {
    level = 'red';
    statusTitle = 'Situación Crítica / Alto Riesgo 🔴';
    summary = `Tus finanzas presentan sobrepresión (Puntaje: ${overallScore}/100). Tus compromisos mensuales superan los umbrales de seguridad. Es momento de aplicar un plan de choque y reestructuración.`;
  }

  return {
    overallScore,
    level,
    statusTitle,
    summary,
    pillars,
    debtRatio: Math.round(debtRatio),
    savingsBufferMonths: Number(savingsBufferMonths.toFixed(1)),
  };
}
