import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  passwordResetToken: {
    deleteMany: vi.fn(),
    create: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  session: {
    deleteMany: vi.fn(),
  },
  $transaction: vi.fn(async (ops: unknown[]) => Promise.all(ops)),
}));

vi.mock('@/lib/db', () => ({
  default: mockPrisma,
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Map([['origin', 'https://fin593.ec']])),
}));

import {
  requestPasswordReset,
  verifyOTP,
  resetPassword,
} from '../actions/password-reset';

describe('Password Recovery & Replacement Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a 6-digit OTP and recovery link when requesting password reset', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'cliente@fin593.ec',
      name: 'Cliente Fin593',
      status: 'ACTIVE',
    });
    mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 1 });
    mockPrisma.passwordResetToken.create.mockResolvedValue({ id: 'tok-1' });

    const res = await requestPasswordReset({ email: 'Cliente@Fin593.ec' });
    expect(res.success).toBe(true);
    expect(mockPrisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(mockPrisma.passwordResetToken.create).toHaveBeenCalledTimes(1);

    if (res.success && res.fallbackCode && res.fallbackResetUrl) {
      expect(res.fallbackCode).toMatch(/^\d{6}$/);
      expect(res.fallbackResetUrl).toContain(
        `recuperar-password?email=cliente%40fin593.ec&code=${res.fallbackCode}`
      );
    }
  });

  it('verifies valid 6-digit OTP and tracks failed attempts accurately', async () => {
    const validCode = '492817';
    const hashedCode = await bcrypt.hash(validCode, 4);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'cliente@fin593.ec',
    });

    mockPrisma.passwordResetToken.findFirst.mockResolvedValue({
      id: 'tok-1',
      userId: 'user-1',
      code: hashedCode,
      used: false,
      attempts: 0,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Wrong code increments attempts
    const badRes = await verifyOTP({ email: 'cliente@fin593.ec', code: '000000' });
    expect(badRes.success).toBe(false);
    expect(mockPrisma.passwordResetToken.update).toHaveBeenCalledWith({
      where: { id: 'tok-1' },
      data: { attempts: 1, used: false },
    });

    // Correct code succeeds without incrementing attempts
    mockPrisma.passwordResetToken.update.mockClear();
    const okRes = await verifyOTP({ email: 'cliente@fin593.ec', code: validCode });
    expect(okRes.success).toBe(true);
    expect(mockPrisma.passwordResetToken.update).not.toHaveBeenCalled();
  });

  it('rejects reusing the old password and eliminates old password + sessions when saving a new one', async () => {
    const validCode = '839201';
    const hashedCode = await bcrypt.hash(validCode, 4);
    const oldPasswordHash = await bcrypt.hash('OldPass123', 4);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'cliente@fin593.ec',
      passwordHash: oldPasswordHash,
    });

    mockPrisma.passwordResetToken.findFirst.mockResolvedValue({
      id: 'tok-1',
      userId: 'user-1',
      code: hashedCode,
      used: false,
      attempts: 0,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Attempt to reuse the exact same old password -> must fail
    const samePassRes = await resetPassword({
      email: 'cliente@fin593.ec',
      code: validCode,
      newPassword: 'OldPass123',
      confirmPassword: 'OldPass123',
    });
    expect(samePassRes.success).toBe(false);
    if (!samePassRes.success) {
      expect(samePassRes.error).toContain('no puede ser igual a la contraseña anterior');
    }

    // Valid new password -> eliminates old passwordHash, tokens, and sessions
    mockPrisma.user.update.mockResolvedValue({ id: 'user-1' });
    mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 1 });
    mockPrisma.session.deleteMany.mockResolvedValue({ count: 2 });

    const newPassRes = await resetPassword({
      email: 'cliente@fin593.ec',
      code: validCode,
      newPassword: 'NewSecurePass2026',
      confirmPassword: 'NewSecurePass2026',
    });
    expect(newPassRes.success).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledTimes(1);
    expect(mockPrisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });

    // Verify the saved hash matches the new password and NOT the old password
    const savedHash = mockPrisma.user.update.mock.calls[0][0].data.passwordHash;
    expect(await bcrypt.compare('NewSecurePass2026', savedHash)).toBe(true);
    expect(await bcrypt.compare('OldPass123', savedHash)).toBe(false);
  }, 15000);
});
