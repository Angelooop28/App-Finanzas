/**
 * Unit Tests — Financial Engine: Income Calculator
 * Tests with realistic Ecuadorian salary data.
 */
import { describe, it, expect } from 'vitest';
import {
  calculateNetIncome,
  calculateTotalPeriodIncome,
  getDefaultEcuadorDeductions,
  roundMoney,
} from '../income';

describe('roundMoney', () => {
  it('rounds to 2 decimal places', () => {
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(1.004)).toBe(1);
    expect(roundMoney(100.999)).toBe(101);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });
});

describe('calculateNetIncome', () => {
  it('calculates net income for typical Ecuadorian salary with IESS', () => {
    const result = calculateNetIncome({
      grossSalary: 1200,
      deductions: [
        {
          name: 'Aporte Personal IESS',
          type: 'IESS',
          percentage: 9.45,
          isPercentage: true,
          isActive: true,
        },
      ],
    });

    expect(result.grossSalary).toBe(1200);
    expect(result.totalDeductions).toBe(113.40);
    expect(result.netSalary).toBe(1086.60);
    expect(result.deductionBreakdown).toHaveLength(1);
    expect(result.deductionBreakdown[0].amount).toBe(113.40);
    expect(result.deductionPercentage).toBe(9.45);
  });

  it('handles multiple deductions (IESS + quirografario + anticipo)', () => {
    const result = calculateNetIncome({
      grossSalary: 1200,
      deductions: [
        {
          name: 'Aporte Personal IESS',
          type: 'IESS',
          percentage: 9.45,
          isPercentage: true,
          isActive: true,
        },
        {
          name: 'Quirografario IESS',
          type: 'IESS_LOAN',
          fixedAmount: 85,
          isPercentage: false,
          isActive: true,
        },
        {
          name: 'Anticipo sueldo',
          type: 'ADVANCE',
          fixedAmount: 50,
          isPercentage: false,
          isActive: true,
        },
      ],
    });

    // IESS: 1200 * 9.45% = 113.40
    // Quirografario: 85.00
    // Anticipo: 50.00
    // Total deductions: 248.40
    // Net: 1200 - 248.40 = 951.60
    expect(result.totalDeductions).toBe(248.40);
    expect(result.netSalary).toBe(951.60);
    expect(result.deductionBreakdown).toHaveLength(3);
  });

  it('ignores inactive deductions', () => {
    const result = calculateNetIncome({
      grossSalary: 1200,
      deductions: [
        {
          name: 'IESS',
          type: 'IESS',
          percentage: 9.45,
          isPercentage: true,
          isActive: true,
        },
        {
          name: 'Old loan (inactive)',
          type: 'OTHER',
          fixedAmount: 200,
          isPercentage: false,
          isActive: false, // INACTIVE
        },
      ],
    });

    expect(result.totalDeductions).toBe(113.40);
    expect(result.netSalary).toBe(1086.60);
    expect(result.deductionBreakdown).toHaveLength(1); // Only active ones
  });

  it('handles zero salary', () => {
    const result = calculateNetIncome({
      grossSalary: 0,
      deductions: getDefaultEcuadorDeductions(),
    });

    expect(result.netSalary).toBe(0);
    expect(result.totalDeductions).toBe(0);
    expect(result.deductionPercentage).toBe(0);
  });

  it('throws error for negative salary', () => {
    expect(() =>
      calculateNetIncome({
        grossSalary: -100,
        deductions: [],
      })
    ).toThrow('El salario bruto no puede ser negativo');
  });

  it('handles salary with no deductions', () => {
    const result = calculateNetIncome({
      grossSalary: 1500,
      deductions: [],
    });

    expect(result.netSalary).toBe(1500);
    expect(result.totalDeductions).toBe(0);
    expect(result.deductionPercentage).toBe(0);
  });

  it('handles minimum wage Ecuador (~$460)', () => {
    const result = calculateNetIncome({
      grossSalary: 460,
      deductions: [
        {
          name: 'IESS',
          type: 'IESS',
          percentage: 9.45,
          isPercentage: true,
          isActive: true,
        },
      ],
    });

    // 460 * 9.45% = 43.47
    expect(result.totalDeductions).toBe(43.47);
    expect(result.netSalary).toBe(416.53);
  });

  it('handles high salary with multiple deductions', () => {
    const result = calculateNetIncome({
      grossSalary: 5000,
      deductions: [
        { name: 'IESS', type: 'IESS', percentage: 9.45, isPercentage: true, isActive: true },
        { name: 'Quirografario', type: 'IESS_LOAN', fixedAmount: 150, isPercentage: false, isActive: true },
        { name: 'Hipotecario IESS', type: 'IESS_LOAN', fixedAmount: 350, isPercentage: false, isActive: true },
        { name: 'Retención IR', type: 'TAX', percentage: 5, isPercentage: true, isActive: true },
      ],
    });

    // IESS: 5000 * 9.45% = 472.50
    // Quirografario: 150
    // Hipotecario: 350
    // IR: 5000 * 5% = 250
    // Total: 1222.50
    expect(result.totalDeductions).toBe(1222.50);
    expect(result.netSalary).toBe(3777.50);
  });
});

describe('calculateTotalPeriodIncome', () => {
  it('calculates total period income with additional incomes', () => {
    const result = calculateTotalPeriodIncome(1086.60, [
      { amount: 200, description: 'Freelance web' },
      { amount: 50, description: 'Venta de producto' },
    ]);

    expect(result.salaryNet).toBe(1086.60);
    expect(result.additionalTotal).toBe(250);
    expect(result.totalIncome).toBe(1336.60);
    expect(result.breakdown).toHaveLength(3);
  });

  it('handles no additional incomes', () => {
    const result = calculateTotalPeriodIncome(1000, []);

    expect(result.totalIncome).toBe(1000);
    expect(result.additionalTotal).toBe(0);
    expect(result.breakdown).toHaveLength(1);
  });
});

describe('getDefaultEcuadorDeductions', () => {
  it('returns IESS personal deduction at 9.45%', () => {
    const defaults = getDefaultEcuadorDeductions();
    
    expect(defaults).toHaveLength(1);
    expect(defaults[0].name).toBe('Aporte Personal IESS');
    expect(defaults[0].percentage).toBe(9.45);
    expect(defaults[0].isPercentage).toBe(true);
    expect(defaults[0].isActive).toBe(true);
  });
});
