import { describe, it, expect } from 'vitest';
import { incomeSchema, debtSchema, adminCreateUserSchema, savingsGoalSchema } from '../validators';

describe('Zod Validators', () => {
  it('should validate correct income data', () => {
    const data = {
      grossAmount: 1200,
      period: '2026-10',
      type: 'SALARY'
    };
    const result = incomeSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should reject invalid gross amount in income', () => {
    const data = {
      grossAmount: -500,
      period: '2026-10',
      type: 'SALARY'
    };
    const result = incomeSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should validate correct debt data', () => {
    const data = {
      name: 'Tarjeta Visa',
      totalOwed: 5000,
      monthlyPayment: 200,
      interestRate: 15
    };
    const result = debtSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should validate admin user creation schema correctly', () => {
    const validData = {
      name: 'Admin User',
      email: 'admin@finanzapp.ec',
      password: 'SecurePassword123'
    };
    expect(adminCreateUserSchema.safeParse(validData).success).toBe(true);

    const invalidData = {
      name: 'A',
      email: 'invalid-email',
      password: 'short'
    };
    expect(adminCreateUserSchema.safeParse(invalidData).success).toBe(false);
  });

  it('should gracefully handle savingsGoal with 0 or empty targetMonths without throwing Too small error', () => {
    const dataWithZero = {
      name: 'Viaje',
      type: 'CUSTOM',
      targetAmount: 100,
      monthlyContribution: 0,
      targetMonths: 0,
    };
    const result = savingsGoalSchema.safeParse(dataWithZero);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.targetMonths).toBeUndefined();
    }
  });
});
