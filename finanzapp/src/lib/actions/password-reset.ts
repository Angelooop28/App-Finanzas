'use server';

/**
 * Password Reset Server Actions — FinanzApp
 * OTP-based password recovery flow.
 * All operations are validated with Zod schemas.
 */

import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sendOTPEmail } from '@/lib/email';
import { logAudit } from '@/lib/audit';
import {
  passwordResetRequestSchema,
  otpVerifySchema,
  newPasswordSchema,
} from '@/lib/validators';

type ActionResult = { success: true } | { success: false; error: string };

const OTP_EXPIRY_MINUTES = 15;
const MAX_OTP_ATTEMPTS = 5;

/**
 * Generate a cryptographically random 6-digit OTP code.
 */
function generateOTP(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, '0');
}

/**
 * Step 1: Request password reset — generates OTP and sends email.
 */
export async function requestPasswordReset(data: { email: string }): Promise<ActionResult> {
  try {
    const parsed = passwordResetRequestSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Email inválido' };
    }

    const email = parsed.data.email.toLowerCase();

    // Find user — always return success to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Don't reveal that the user doesn't exist
      return { success: true };
    }

    // Invalidate previous tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Generate new OTP
    const code = generateOTP();
    const hashedCode = await bcrypt.hash(code, 10);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        code: hashedCode,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
        attempts: 0,
      },
    });

    // Send email (fire and forget — don't block on email delivery errors)
    try {
      await sendOTPEmail(email, code, user.name ?? undefined);
    } catch (emailError) {
      console.error('[PasswordReset] Email delivery failed:', emailError);
      // Still return success — the token is saved, user can retry
    }

    await logAudit('PASSWORD_RESET_REQUEST', user.id, `OTP requested for ${email}`);

    return { success: true };
  } catch (error) {
    console.error('requestPasswordReset error:', error);
    return { success: false, error: 'Error al procesar la solicitud' };
  }
}

/**
 * Step 2: Verify OTP code.
 */
export async function verifyOTP(data: { email: string; code: string }): Promise<ActionResult> {
  try {
    const parsed = otpVerifySchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
    }

    const email = parsed.data.email.toLowerCase();
    const code = parsed.data.code;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { success: false, error: 'Código inválido o expirado' };
    }

    // Find the latest unused, non-expired token
    const token = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!token) {
      return { success: false, error: 'Código expirado. Solicita uno nuevo.' };
    }

    // Check attempt limit
    if (token.attempts >= MAX_OTP_ATTEMPTS) {
      await prisma.passwordResetToken.update({
        where: { id: token.id },
        data: { used: true },
      });
      return { success: false, error: 'Demasiados intentos. Solicita un nuevo código.' };
    }

    // Increment attempts
    await prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { attempts: { increment: 1 } },
    });

    // Verify the code against the hash
    const isValid = await bcrypt.compare(code, token.code);

    if (!isValid) {
      const remaining = MAX_OTP_ATTEMPTS - (token.attempts + 1);
      return {
        success: false,
        error: remaining > 0
          ? `Código incorrecto. ${remaining} intento${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}.`
          : 'Código incorrecto. Solicita un nuevo código.',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('verifyOTP error:', error);
    return { success: false, error: 'Error al verificar el código' };
  }
}

/**
 * Step 3: Reset password — verifies OTP again and updates password.
 */
export async function resetPassword(data: {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<ActionResult> {
  try {
    const parsed = newPasswordSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
    }

    const email = parsed.data.email.toLowerCase();
    const code = parsed.data.code;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { success: false, error: 'Error al restablecer la contraseña' };
    }

    // Find the latest unused, non-expired token
    const token = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!token) {
      return { success: false, error: 'Código expirado. Solicita uno nuevo.' };
    }

    // Verify OTP one final time
    const isValid = await bcrypt.compare(code, token.code);
    if (!isValid) {
      return { success: false, error: 'Código inválido' };
    }

    // Hash and update password
    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: token.id },
        data: { used: true },
      }),
    ]);

    await logAudit('PASSWORD_RESET_COMPLETE', user.id, `Password reset for ${email}`);

    return { success: true };
  } catch (error) {
    console.error('resetPassword error:', error);
    return { success: false, error: 'Error al restablecer la contraseña' };
  }
}
