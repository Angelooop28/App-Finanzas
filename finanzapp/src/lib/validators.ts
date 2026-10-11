/**
 * Zod validation schemas for FinanzApp.
 * Shared between client and server.
 */
import { z } from 'zod';

// ---- Auth ----

export const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  email: z.string().email('Correo electrónico no válido').max(255),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Correo electrónico no válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

// ---- Password Reset (OTP) ----

export const passwordResetRequestSchema = z.object({
  email: z.string().email('Correo electrónico no válido'),
});

export const otpVerifySchema = z.object({
  email: z.string().email('Correo electrónico no válido'),
  code: z.string().length(6, 'El código debe tener 6 dígitos').regex(/^\d{6}$/, 'El código debe contener solo números'),
});

export const newPasswordSchema = z.object({
  email: z.string().email('Correo electrónico no válido'),
  code: z.string().length(6, 'El código debe tener 6 dígitos'),
  newPassword: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// ---- Perfil / Onboarding ----

export const profileSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100).optional(),
  age: z.number().int().min(16, 'Edad mínima: 16 años').max(120).optional(),
  city: z.string().max(100).optional(),
  currency: z.string().default('USD').optional(),
  payFrequency: z.enum(['MONTHLY', 'BIWEEKLY', 'WEEKLY']).optional(),
  payrollCutoffDay: z.number().int().min(1).max(31).optional(),
});

// ---- Ingresos ----

export const incomeSchema = z.object({
  grossAmount: z.number().positive('El salario bruto debe ser mayor a 0'),
  netAmount: z.number().optional(),
  isNetManual: z.boolean().default(false),
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Formato de período: YYYY-MM'),
  type: z.enum(['SALARY', 'BONUS', 'FREELANCE', 'OTHER']).default('SALARY'),
  description: z.string().max(255).optional(),
});

export const deductionSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  type: z.enum(['IESS', 'IESS_LOAN', 'TAX', 'ADVANCE', 'OTHER']).default('OTHER'),
  percentage: z.number().min(0).max(100).optional(),
  fixedAmount: z.number().min(0).optional(),
  isPercentage: z.boolean().default(true),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

// ---- Deudas ----

export const debtSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  creditor: z.string().max(100).optional(),
  type: z.string().default('OTHER'),
  totalOwed: z.number().positive('El monto adeudado debe ser mayor a 0'),
  originalAmount: z.number().positive().optional(),
  monthlyPayment: z.number().positive('La cuota mensual debe ser mayor a 0'),
  interestRate: z.number().min(0, 'La tasa de interés no puede ser negativa').max(100).default(0),
  nextDueDate: z.string().optional(), // ISO date string
  remainingInstallments: z.number().int().min(0).optional(),
  manualPriority: z.number().int().min(1).max(10).optional(),
});

// ---- Gastos ----

export const expenseCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(50),
  type: z.enum(['FIXED', 'VARIABLE']),
  icon: z.string().max(10).optional(),
  color: z.string().max(7).optional(),
});

export const expenseSchema = z.object({
  categoryId: z.string().min(1, 'La categoría es requerida'),
  description: z.string().max(255).optional(),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  date: z.string(), // ISO date string
  isRecurring: z.boolean().default(false),
  recurringDay: z.number().int().min(1).max(31).optional(),
});

// ---- Ahorro ----

export const savingsGoalSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  type: z.enum(['EMERGENCY_FUND', 'CUSTOM']).default('CUSTOM'),
  targetAmount: z.number().positive('La meta debe ser mayor a 0'),
  currentAmount: z.number().min(0).default(0),
  monthlyContribution: z.number().min(0).optional(),
  targetDate: z.string().optional(),
  targetMonths: z.number().int().min(1).optional(),
});

// ---- ¿Puedo comprar esto? ----

export const purchaseQuerySchema = z.object({
  description: z.string().min(1, 'Describe lo que quieres comprar').max(255),
  amount: z.number().positive('El monto debe ser mayor a 0'),
});

// ---- Admin ----

export const adminCreateUserSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
  status: z.enum(['ACTIVE', 'BLOCKED', 'SUSPENDED']).default('ACTIVE'),
  plan: z.enum(['FREE', 'PRO', 'ENTERPRISE']).default('FREE'),
  city: z.string().max(100).optional(),
});

export const adminUserUpdateSchema = z.object({
  userId: z.string().min(1, 'ID de usuario requerido'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100).optional(),
  email: z.string().email('Correo electrónico inválido').optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'BLOCKED', 'SUSPENDED']).optional(),
  plan: z.enum(['FREE', 'PRO', 'ENTERPRISE']).optional(),
  city: z.string().max(100).optional().nullable(),
});

export const adminResetPasswordSchema = z.object({
  userId: z.string().min(1, 'ID de usuario requerido'),
  newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

// ---- Types ----

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type IncomeInput = z.infer<typeof incomeSchema>;
export type DeductionInput = z.infer<typeof deductionSchema>;
export type DebtInput = z.infer<typeof debtSchema>;
export type ExpenseCategoryInput = z.infer<typeof expenseCategorySchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type SavingsGoalInput = z.infer<typeof savingsGoalSchema>;
export type PurchaseQueryInput = z.infer<typeof purchaseQuerySchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;
export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;
