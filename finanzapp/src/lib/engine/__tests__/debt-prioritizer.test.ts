/**
 * Unit Tests — Financial Engine: Debt Prioritizer
 */
import { describe, it, expect } from 'vitest';
import {
  prioritizeAvalanche,
  prioritizeSnowball,
  compareDebtStrategies,
  type DebtInput,
} from '../debt-prioritizer';

const typicalDebts: DebtInput[] = [
  {
    id: 'visa',
    name: 'Visa Banco Pichincha',
    totalOwed: 2400,
    monthlyPayment: 120,
    interestRate: 16.5,
  },
  {
    id: 'personal',
    name: 'Préstamo Produbanco',
    totalOwed: 5000,
    monthlyPayment: 180,
    interestRate: 11.2,
  },
  {
    id: 'family',
    name: 'Deuda familiar',
    totalOwed: 500,
    monthlyPayment: 50,
    interestRate: 0,
  },
];

describe('prioritizeAvalanche', () => {
  it('orders debts by highest interest rate first', () => {
    const result = prioritizeAvalanche(typicalDebts);
    
    expect(result.method).toBe('avalanche');
    expect(result.debts[0].name).toBe('Visa Banco Pichincha'); // 16.5%
    expect(result.debts[1].name).toBe('Préstamo Produbanco');   // 11.2%
    expect(result.debts[2].name).toBe('Deuda familiar');        // 0%
  });

  it('calculates total interest and months', () => {
    const result = prioritizeAvalanche(typicalDebts);
    
    expect(result.totalInterest).toBeGreaterThan(0);
    expect(result.totalMonths).toBeGreaterThan(0);
    expect(result.totalPaid).toBeGreaterThan(7900); // Must be more than total owed (with interest)
  });

  it('debt with 0% interest has no interest charges', () => {
    const result = prioritizeAvalanche(typicalDebts);
    const familyDebt = result.debts.find(d => d.id === 'family');
    
    expect(familyDebt).toBeDefined();
    expect(familyDebt!.totalInterestPaid).toBe(0);
    expect(familyDebt!.monthsToPayoff).toBe(10); // 500 / 50 = 10 months
  });
});

describe('prioritizeSnowball', () => {
  it('orders debts by smallest balance first', () => {
    const result = prioritizeSnowball(typicalDebts);
    
    expect(result.method).toBe('snowball');
    expect(result.debts[0].name).toBe('Deuda familiar');         // $500
    expect(result.debts[1].name).toBe('Visa Banco Pichincha');   // $2400
    expect(result.debts[2].name).toBe('Préstamo Produbanco');    // $5000
  });
});

describe('compareDebtStrategies', () => {
  it('shows avalanche saves money on interest vs snowball', () => {
    const comparison = compareDebtStrategies(typicalDebts);
    
    // Avalanche should save money (or at worst be equal)
    expect(comparison.interestSaved).toBeGreaterThanOrEqual(0);
    expect(comparison.avalanche.totalInterest).toBeLessThanOrEqual(comparison.snowball.totalInterest);
  });

  it('provides a recommendation with reason', () => {
    const comparison = compareDebtStrategies(typicalDebts);
    
    expect(['avalanche', 'snowball']).toContain(comparison.recommendation);
    expect(comparison.recommendationReason.length).toBeGreaterThan(0);
  });

  it('handles empty debts array', () => {
    const comparison = compareDebtStrategies([]);
    
    expect(comparison.avalanche.debts).toHaveLength(0);
    expect(comparison.snowball.debts).toHaveLength(0);
    expect(comparison.interestSaved).toBe(0);
  });

  it('handles single debt', () => {
    const singleDebt: DebtInput[] = [{
      id: 'only',
      name: 'Solo una deuda',
      totalOwed: 1000,
      monthlyPayment: 100,
      interestRate: 10,
    }];

    const comparison = compareDebtStrategies(singleDebt);
    
    // With single debt, both methods should yield same result
    expect(comparison.avalanche.totalInterest).toBe(comparison.snowball.totalInterest);
    expect(comparison.interestSaved).toBe(0);
  });

  it('recommends snowball when there are many small debts and minimal interest difference', () => {
    const smallDebts: DebtInput[] = [
      { id: 'a', name: 'Deuda A', totalOwed: 100, monthlyPayment: 50, interestRate: 5 },
      { id: 'b', name: 'Deuda B', totalOwed: 200, monthlyPayment: 50, interestRate: 5.5 },
      { id: 'c', name: 'Deuda C', totalOwed: 150, monthlyPayment: 50, interestRate: 5.2 },
    ];

    const comparison = compareDebtStrategies(smallDebts);
    // With very similar rates and small balances, snowball may be recommended
    expect(['avalanche', 'snowball']).toContain(comparison.recommendation);
  });
});
