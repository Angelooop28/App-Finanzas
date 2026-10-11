import { describe, it, expect } from 'vitest';
import { evaluateNewDebt, processFinancialAIQuery } from '../../finance/ai-advisor';
import { computeFinancialHealthIndex } from '../../finance/health-index';
import { generateActionPlan } from '../../finance/recommendation-engine';

describe('Fin593 AI Advisor & Health Engines', () => {
  const healthyFinance = {
    netIncome: 1800,
    fixedExpenses: 600,
    variableExpenses: 300,
    currentMonthlyDebtPayments: 150,
    emergencyFund: 2400,
  };

  const criticalFinance = {
    netIncome: 1000,
    fixedExpenses: 700,
    variableExpenses: 250,
    currentMonthlyDebtPayments: 350,
    emergencyFund: 0,
  };

  it('evaluates loan feasibility and approves compatible loans', () => {
    const res = evaluateNewDebt(
      {
        amount: 1000,
        termMonths: 12,
        annualInterestRate: 15.0,
        institutionType: 'BANCO',
        purpose: 'Herramientas de trabajo',
      },
      healthyFinance
    );

    expect(res.isCompatible).toBe(true);
    expect(res.verdict).toBe('COMPATIBLE');
    expect(res.calculatedMonthlyPayment).toBeGreaterThan(0);
    expect(res.newDebtToIncomeRatio).toBeLessThan(40);
  });

  it('detects high risk on deficit-causing loans', () => {
    const res = evaluateNewDebt(
      {
        amount: 8000,
        termMonths: 24,
        annualInterestRate: 16.5,
        institutionType: 'BANCO',
        purpose: 'Consumo',
      },
      criticalFinance
    );

    expect(res.isCompatible).toBe(false);
    expect(res.verdict).toBe('HIGH_RISK');
    expect(res.surplusAfter).toBeLessThan(0);
  });

  it('processes natural language financial queries with explainable diagnosis', () => {
    const res = processFinancialAIQuery('¿Qué deuda debería pagar primero?', {
      ...healthyFinance,
      totalDebtPayments: healthyFinance.currentMonthlyDebtPayments,
      debtsCount: 2,
    });

    expect(res.verdict).toBe('INFO');
    expect(res.diagnosis.income).toBe(1800);
    expect(res.reasoning).toBeDefined();
    expect(res.alternativeAction).toBeDefined();
  });

  it('computes composite health index correctly across all 4 pillars', () => {
    const health = computeFinancialHealthIndex({
      netIncome: 2000,
      fixedExpenses: 600,
      variableExpenses: 400,
      totalMonthlyDebtPayments: 200,
      totalDebtBalance: 1200,
      emergencyFundBalance: 2000,
    });

    expect(health.overallScore).toBeGreaterThanOrEqual(70);
    expect(health.level).toBe('green');
    expect(health.pillars).toHaveLength(4);
  });

  it('prioritizes SUPA legal obligations in the daily action plan', () => {
    const plan = generateActionPlan({
      netIncome: 1200,
      fixedExpenses: 500,
      variableExpenses: 200,
      debts: [
        {
          id: 'supa-1',
          name: 'Pensión Alimenticia SUPA',
          type: 'INFORMAL',
          totalOwed: 250,
          monthlyPayment: 250,
          interestRate: 0,
          status: 'ACTIVE',
        },
        {
          id: 'card-1',
          name: 'Tarjeta Visa Banco Pichincha',
          type: 'CREDIT_CARD',
          totalOwed: 1000,
          monthlyPayment: 80,
          interestRate: 16.5,
          status: 'ACTIVE',
        },
      ],
      savingsGoals: [],
    });

    expect(plan.length).toBeGreaterThan(0);
    expect(plan[0].type).toBe('SUPA_LEGAL');
    expect(plan[0].severity).toBe('CRITICAL');
  });
});
