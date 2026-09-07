/**
 * FinancialEngine — Income Calculator
 * Módulo puro (sin dependencias de DB ni framework) para cálculos de ingreso.
 * Testeable de forma independiente.
 */

export interface Deduction {
  name: string;
  type: string;
  percentage?: number;     // e.g. 9.45 for IESS
  fixedAmount?: number;    // e.g. 85.00 for quirografario
  isPercentage: boolean;
  isActive: boolean;
}

export interface IncomeInput {
  grossSalary: number;
  deductions: Deduction[];
}

export interface DeductionResult {
  name: string;
  type: string;
  amount: number;
  isPercentage: boolean;
  percentage?: number;
}

export interface IncomeResult {
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  deductionBreakdown: DeductionResult[];
  deductionPercentage: number; // % of gross that goes to deductions
}

/**
 * Calcula el ingreso neto a partir del bruto y los descuentos de nómina.
 * 
 * @param input - Salario bruto y lista de descuentos
 * @returns Desglose completo de ingreso
 * 
 * @example
 * ```ts
 * calculateNetIncome({
 *   grossSalary: 1200,
 *   deductions: [
 *     { name: 'IESS Personal', type: 'IESS', percentage: 9.45, isPercentage: true, isActive: true },
 *     { name: 'Quirografario IESS', type: 'IESS_LOAN', fixedAmount: 85, isPercentage: false, isActive: true },
 *   ]
 * })
 * // → { grossSalary: 1200, totalDeductions: 198.40, netSalary: 1001.60, ... }
 * ```
 */
export function calculateNetIncome(input: IncomeInput): IncomeResult {
  const { grossSalary, deductions } = input;

  if (grossSalary < 0) {
    throw new Error('El salario bruto no puede ser negativo');
  }

  const activeDeductions = deductions.filter(d => d.isActive);

  const deductionBreakdown: DeductionResult[] = activeDeductions.map(d => {
    let amount: number;

    if (d.isPercentage) {
      const pct = d.percentage ?? 0;
      amount = roundMoney(grossSalary * (pct / 100));
    } else {
      amount = d.fixedAmount ?? 0;
    }

    return {
      name: d.name,
      type: d.type,
      amount,
      isPercentage: d.isPercentage,
      percentage: d.isPercentage ? d.percentage : undefined,
    };
  });

  const totalDeductions = roundMoney(
    deductionBreakdown.reduce((sum, d) => sum + d.amount, 0)
  );

  const netSalary = roundMoney(grossSalary - totalDeductions);

  const deductionPercentage = grossSalary > 0
    ? roundMoney((totalDeductions / grossSalary) * 100)
    : 0;

  return {
    grossSalary,
    totalDeductions,
    netSalary,
    deductionBreakdown,
    deductionPercentage,
  };
}

/**
 * Calcula el ingreso neto total del período incluyendo ingresos adicionales.
 */
export function calculateTotalPeriodIncome(
  salaryNet: number,
  additionalIncomes: { amount: number; description: string }[]
): {
  salaryNet: number;
  additionalTotal: number;
  totalIncome: number;
  breakdown: { description: string; amount: number }[];
} {
  const additionalTotal = roundMoney(
    additionalIncomes.reduce((sum, i) => sum + i.amount, 0)
  );

  return {
    salaryNet,
    additionalTotal,
    totalIncome: roundMoney(salaryNet + additionalTotal),
    breakdown: [
      { description: 'Salario Neto', amount: salaryNet },
      ...additionalIncomes.map(i => ({
        description: i.description,
        amount: i.amount,
      })),
    ],
  };
}

/**
 * Genera los descuentos por defecto para Ecuador.
 */
export function getDefaultEcuadorDeductions(): Deduction[] {
  return [
    {
      name: 'Aporte Personal IESS',
      type: 'IESS',
      percentage: 9.45,
      isPercentage: true,
      isActive: true,
    },
  ];
}

/**
 * Redondea a 2 decimales (centavos) de forma consistente.
 */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
