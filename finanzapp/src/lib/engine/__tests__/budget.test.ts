/**
 * Unit Tests — Financial Engine: Budget Calculator & Health Score
 */
import { describe, it, expect } from 'vitest';
import { calculateBudget, calculateHealthScore } from '../budget';

describe('calculateBudget', () => {
  it('calculates budget for typical Ecuadorian scenario', () => {
    const result = calculateBudget({
      netIncome: 1001.60,
      fixedExpenses: 455,      // arriendo + servicios + plan celular
      variableExpenses: 300,    // comida + transporte + ocio
      totalDebtPayments: 350,   // visa + produbanco + familiar
    });

    // 1001.60 - 455 - 300 - 350 = -103.40
    expect(result.totalCommitted).toBe(1105);
    expect(result.availableReal).toBe(-103.40);
    expect(result.isDeficit).toBe(true);
    expect(result.deficit).toBe(103.40);
    expect(result.surplus).toBe(0);
  });

  it('calculates budget with surplus', () => {
    const result = calculateBudget({
      netIncome: 2000,
      fixedExpenses: 500,
      variableExpenses: 300,
      totalDebtPayments: 200,
    });

    expect(result.availableReal).toBe(1000);
    expect(result.surplus).toBe(1000);
    expect(result.isDeficit).toBe(false);
    expect(result.deficit).toBe(0);
  });

  it('applies 50/30/20 rule correctly', () => {
    const result = calculateBudget({
      netIncome: 1000,
      fixedExpenses: 400,
      variableExpenses: 200,
      totalDebtPayments: 100,
    });

    expect(result.suggested.needs).toBe(500);
    expect(result.suggested.wants).toBe(300);
    expect(result.suggested.savings).toBe(200);
  });

  it('allows custom budget rule', () => {
    const result = calculateBudget(
      { netIncome: 1000, fixedExpenses: 300, variableExpenses: 200, totalDebtPayments: 100 },
      { needsPercent: 60, wantsPercent: 20, savingsPercent: 20 }
    );

    expect(result.suggested.needs).toBe(600);
    expect(result.suggested.wants).toBe(200);
    expect(result.suggested.savings).toBe(200);
  });
});

describe('calculateHealthScore', () => {
  it('returns green for low debt ratio', () => {
    const score = calculateHealthScore(2000, 400, 1200);
    
    expect(score.level).toBe('green');
    expect(score.debtRatio).toBe(20);
    expect(score.score).toBeGreaterThan(60);
  });

  it('returns yellow for moderate debt ratio', () => {
    const score = calculateHealthScore(1000, 350, 800);
    
    expect(score.level).toBe('yellow');
    expect(score.debtRatio).toBe(35);
  });

  it('returns red for high debt ratio', () => {
    const score = calculateHealthScore(1000, 600, 900);
    
    expect(score.level).toBe('red');
    expect(score.debtRatio).toBe(60);
    expect(score.score).toBeLessThan(30);
  });

  it('returns red/deficit when expenses exceed income', () => {
    const score = calculateHealthScore(1000, 300, 1200);
    
    expect(score.level).toBe('red');
    expect(score.label).toBe('Déficit');
    expect(score.expenseRatio).toBe(120);
  });

  it('handles zero income', () => {
    const score = calculateHealthScore(0, 0, 0);
    
    expect(score.level).toBe('red');
    expect(score.score).toBe(0);
  });
});
