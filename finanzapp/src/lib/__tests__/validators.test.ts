import { describe, it, expect } from 'vitest';
import {
  incomeSchema,
  debtSchema,
  adminCreateUserSchema,
  savingsGoalSchema,
  passwordResetRequestSchema,
  otpVerifySchema,
  newPasswordSchema,
  changePasswordSchema,
} from '../validators';
import { buildResetPasswordUrl } from '../email';

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

  it('should validate password reset request, 6-digit OTP, and robust new password schemas', () => {
    expect(passwordResetRequestSchema.safeParse({ email: 'user@fin593.ec' }).success).toBe(true);
    expect(passwordResetRequestSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);

    expect(otpVerifySchema.safeParse({ email: 'user@fin593.ec', code: '123456' }).success).toBe(true);
    expect(otpVerifySchema.safeParse({ email: 'user@fin593.ec', code: '12345a' }).success).toBe(false);
    expect(otpVerifySchema.safeParse({ email: 'user@fin593.ec', code: '1234' }).success).toBe(false);

    // Valid new password with 8+ chars, uppercase, lowercase, number, and matching confirm
    expect(
      newPasswordSchema.safeParse({
        email: 'user@fin593.ec',
        code: '654321',
        newPassword: 'NuevaPassword2026',
        confirmPassword: 'NuevaPassword2026',
      }).success
    ).toBe(true);

    // Reject weak password (missing uppercase or number)
    expect(
      newPasswordSchema.safeParse({
        email: 'user@fin593.ec',
        code: '654321',
        newPassword: 'solominusculas',
        confirmPassword: 'solominusculas',
      }).success
    ).toBe(false);

    // Reject mismatched confirmPassword
    expect(
      newPasswordSchema.safeParse({
        email: 'user@fin593.ec',
        code: '654321',
        newPassword: 'NuevaPassword2026',
        confirmPassword: 'OtraPassword2026',
      }).success
    ).toBe(false);

    // Reject changePassword when newPassword equals currentPassword
    expect(
      changePasswordSchema.safeParse({
        currentPassword: 'SamePassword123',
        newPassword: 'SamePassword123',
        confirmPassword: 'SamePassword123',
      }).success
    ).toBe(false);
  });

  it('should build a valid password reset link with email and 6-digit code', () => {
    const url = buildResetPasswordUrl('Cliente@Correo.com', '482910', 'https://fin593.ec/');
    expect(url).toBe('https://fin593.ec/recuperar-password?email=cliente%40correo.com&code=482910');
  });
});
