'use server';

/**
 * Admin Server Actions — FinanzApp
 * All operations strictly validate ADMIN role and audit system events.
 */

import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import {
  adminCreateUserSchema,
  adminUserUpdateSchema,
  adminResetPasswordSchema,
  AdminCreateUserInput,
  AdminUserUpdateInput,
  AdminResetPasswordInput,
} from '@/lib/validators';
import { DEFAULT_CONFIGS, EXPENSE_CATEGORIES_DEFAULT } from '@/lib/config/defaults';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

type ActionResult<T = unknown> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string };

/**
 * Verify current session has ADMIN role. Throws if unauthorized.
 */
async function requireAdmin(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('No autenticado');
  if (session.user.role !== 'ADMIN') throw new Error('Acceso denegado: Se requiere rol de Administrador');
  return session.user.id;
}

// =============================================
// ADMIN DASHBOARD METRICS
// =============================================

export async function getAdminDashboardData() {
  await requireAdmin();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    blockedUsers,
    proPlanUsers,
    registrationsToday,
    loginsToday,
    totalDebts,
    totalSavingsGoals,
    debtsAggregate,
    savingsAggregate,
    recentRegistrations,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { status: 'BLOCKED' } }),
    prisma.user.count({ where: { plan: 'PRO' } }),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.auditLog.count({ where: { action: 'LOGIN', createdAt: { gte: todayStart } } }),
    prisma.debt.count({ where: { status: 'ACTIVE' } }),
    prisma.savingsGoal.count({ where: { status: 'ACTIVE' } }),
    prisma.debt.aggregate({
      _sum: { totalOwed: true, monthlyPayment: true },
      where: { status: 'ACTIVE' },
    }),
    prisma.savingsGoal.aggregate({
      _sum: { currentAmount: true, targetAmount: true },
      where: { status: 'ACTIVE' },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.auditLog.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const registrationsByDay: Record<string, number> = {};
  recentRegistrations.forEach(u => {
    const day = u.createdAt.toISOString().split('T')[0];
    registrationsByDay[day] = (registrationsByDay[day] || 0) + 1;
  });

  return {
    totalUsers,
    activeUsers,
    blockedUsers,
    proPlanUsers,
    registrationsToday,
    loginsToday,
    totalDebts,
    totalSavingsGoals,
    totalDebtOwed: debtsAggregate._sum.totalOwed ?? 0,
    totalMonthlyDebtPayments: debtsAggregate._sum.monthlyPayment ?? 0,
    totalSavingsAmount: savingsAggregate._sum.currentAmount ?? 0,
    registrationsByDay,
    recentAuditLogs,
  };
}

// =============================================
// ADMIN USERS LIST & PAGINATION
// =============================================

export async function getAdminUsers(options: {
  page?: number;
  search?: string;
  pageSize?: number;
  statusFilter?: string;
  planFilter?: string;
}) {
  await requireAdmin();

  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 15;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
  if (options.search) {
    where.OR = [
      { name: { contains: options.search, mode: 'insensitive' } },
      { email: { contains: options.search, mode: 'insensitive' } },
      { city: { contains: options.search, mode: 'insensitive' } },
    ];
  }

  if (options.statusFilter) {
    where.status = options.statusFilter;
  }

  if (options.planFilter) {
    where.plan = options.planFilter;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        plan: true,
        city: true,
        createdAt: true,
        _count: {
          select: {
            incomes: true,
            debts: true,
            expenses: true,
            savingsGoals: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// =============================================
// ADMIN USER CRUD & SECURITY
// =============================================

/**
 * Create a user manually from Admin Panel.
 */
export async function adminCreateUser(input: AdminCreateUserInput): Promise<ActionResult<{ userId: string }>> {
  try {
    const adminId = await requireAdmin();

    const parsed = adminCreateUserSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
    }

    const { name, email, password, role, status, plan, city } = parsed.data;

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return { success: false, error: 'Ya existe una cuenta con este correo electrónico' };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role,
        status,
        plan,
        city: city || null,
        onboardingCompleted: true,
        financialConfigs: {
          create: Object.entries(DEFAULT_CONFIGS).map(([key, config]) => ({
            key,
            value: config.value,
            description: config.description,
          })),
        },
        expenseCategories: {
          create: EXPENSE_CATEGORIES_DEFAULT.map(cat => ({
            name: cat.name,
            type: cat.type,
            icon: cat.icon,
            color: cat.color,
            isSystem: true,
          })),
        },
        payrollDeductions: {
          create: [{
            name: 'Aporte Personal IESS',
            type: 'IESS',
            percentage: 9.45,
            isPercentage: true,
            isActive: true,
            sortOrder: 0,
          }],
        },
      },
    });

    await logAudit('ADMIN_ACTION', adminId, `Usuario creado manualmente por admin: ${email} (${role}, ${plan})`);
    revalidatePath('/admin/usuarios');

    return { success: true, data: { userId: newUser.id }, message: 'Usuario creado exitosamente' };
  } catch (error) {
    console.error('adminCreateUser error:', error);
    return { success: false, error: 'Error al crear el usuario en el servidor' };
  }
}

/**
 * Update user details from Admin Panel.
 */
export async function adminUpdateUser(input: AdminUserUpdateInput): Promise<ActionResult> {
  try {
    const adminId = await requireAdmin();

    const parsed = adminUserUpdateSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
    }

    const { userId, name, email, role, status, plan, city } = parsed.data;

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    // Prevent admin from removing their own admin status or blocking themselves
    if (userId === adminId) {
      if (role && role !== 'ADMIN') {
        return { success: false, error: 'No puedes degradar tu propia cuenta de Administrador' };
      }
      if (status && status !== 'ACTIVE') {
        return { success: false, error: 'No puedes bloquear tu propia cuenta de Administrador' };
      }
    }

    // Check if new email is already taken by another user
    if (email && email.toLowerCase() !== targetUser.email.toLowerCase()) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (emailTaken) {
        return { success: false, error: 'El nuevo correo ya está registrado en otra cuenta' };
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email: email.toLowerCase() }),
        ...(role !== undefined && { role }),
        ...(status !== undefined && { status }),
        ...(plan !== undefined && { plan }),
        ...(city !== undefined && { city }),
      },
    });

    await logAudit('ADMIN_ACTION', adminId, `Usuario actualizado: ${userId} (${email || targetUser.email})`);
    revalidatePath('/admin/usuarios');

    return { success: true, message: 'Usuario actualizado correctamente' };
  } catch (error) {
    console.error('adminUpdateUser error:', error);
    return { success: false, error: 'Error al actualizar usuario' };
  }
}

/**
 * Emergency Password Reset by Admin.
 */
export async function adminResetUserPassword(input: AdminResetPasswordInput): Promise<ActionResult> {
  try {
    const adminId = await requireAdmin();

    const parsed = adminResetPasswordSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Contraseña inválida' };
    }

    const { userId, newPassword } = parsed.data;
    const newHash = await bcrypt.hash(newPassword, 12);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
      select: { email: true },
    });

    await logAudit('ADMIN_ACTION', adminId, `Contraseña restablecida de emergencia para ${user.email}`);
    revalidatePath('/admin/usuarios');

    return { success: true, message: `Contraseña actualizada para ${user.email}` };
  } catch (error) {
    console.error('adminResetUserPassword error:', error);
    return { success: false, error: 'Error al restablecer contraseña' };
  }
}

/**
 * Toggle user status between ACTIVE and BLOCKED.
 */
export async function adminToggleUserStatus(userId: string): Promise<ActionResult<{ newStatus: string }>> {
  try {
    const adminId = await requireAdmin();

    if (userId === adminId) {
      return { success: false, error: 'No puedes bloquear tu propia cuenta de Administrador' };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: 'Usuario no encontrado' };

    const nextStatus = user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';

    await prisma.user.update({
      where: { id: userId },
      data: { status: nextStatus },
    });

    await logAudit('ADMIN_ACTION', adminId, `Estado de ${user.email} cambiado a ${nextStatus}`);
    revalidatePath('/admin/usuarios');

    return { success: true, data: { newStatus: nextStatus }, message: `Usuario ${nextStatus === 'ACTIVE' ? 'desbloqueado' : 'bloqueado'}` };
  } catch (error) {
    console.error('adminToggleUserStatus error:', error);
    return { success: false, error: 'Error al cambiar estado' };
  }
}

/**
 * Delete user and all associated financial records.
 */
export async function adminDeleteUser(userId: string): Promise<ActionResult> {
  try {
    const adminId = await requireAdmin();

    if (userId === adminId) {
      return { success: false, error: 'No puedes eliminar tu propia cuenta de Administrador' };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: 'Usuario no encontrado' };

    // Delete related records (cascade cleanup)
    await prisma.$transaction([
      prisma.income.deleteMany({ where: { userId } }),
      prisma.payrollDeduction.deleteMany({ where: { userId } }),
      prisma.debt.deleteMany({ where: { userId } }),
      prisma.expense.deleteMany({ where: { userId } }),
      prisma.expenseCategory.deleteMany({ where: { userId } }),
      prisma.savingsGoal.deleteMany({ where: { userId } }),
      prisma.alert.deleteMany({ where: { userId } }),
      prisma.purchaseQuery.deleteMany({ where: { userId } }),
      prisma.financialConfig.deleteMany({ where: { userId } }),
      prisma.passwordResetToken.deleteMany({ where: { userId } }),
      prisma.account.deleteMany({ where: { userId } }),
      prisma.session.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    await logAudit('ADMIN_ACTION', adminId, `Usuario eliminado permanentemente: ${user.email}`);
    revalidatePath('/admin/usuarios');

    return { success: true, message: 'Usuario y todos sus registros han sido eliminados' };
  } catch (error) {
    console.error('adminDeleteUser error:', error);
    return { success: false, error: 'Error al eliminar usuario' };
  }
}

// =============================================
// USER FINANCIAL 360° DOSSIER & PDF REPORT DATA
// =============================================

export async function getAdminUserFinancialProfile(userId: string) {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      incomes: { orderBy: { createdAt: 'desc' }, take: 1 },
      payrollDeductions: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      debts: { where: { status: 'ACTIVE' }, orderBy: { totalOwed: 'desc' } },
      expenseCategories: { include: { expenses: true } },
      expenses: { orderBy: { date: 'desc' }, take: 30 },
      savingsGoals: { orderBy: { createdAt: 'desc' } },
      financialConfigs: true,
    },
  });

  if (!user) throw new Error('Usuario no encontrado');

  // Compute Financial Metrics
  const latestIncome = user.incomes[0];
  const grossIncome = latestIncome?.grossAmount ?? 0;
  const netIncome = latestIncome?.netAmount ?? 0;

  const totalDeductions = user.payrollDeductions.reduce((sum, d) => {
    if (d.isPercentage && d.percentage) {
      return sum + (grossIncome * d.percentage) / 100;
    }
    return sum + (d.fixedAmount ?? 0);
  }, 0);

  const totalDebtBalance = user.debts.reduce((sum, d) => sum + d.totalOwed, 0);
  const totalMonthlyDebtPayments = user.debts.reduce((sum, d) => sum + d.monthlyPayment, 0);

  // Group Expenses
  let fixedExpensesTotal = 0;
  let variableExpensesTotal = 0;
  const expensesByCategory: Record<string, { name: string; amount: number; type: string; color: string }> = {};

  user.expenses.forEach(exp => {
    const cat = user.expenseCategories.find(c => c.id === exp.categoryId);
    const catName = cat?.name || 'Otros';
    const catType = cat?.type || 'VARIABLE';
    const catColor = cat?.color || '#64748b';

    if (catType === 'FIXED') {
      fixedExpensesTotal += exp.amount;
    } else {
      variableExpensesTotal += exp.amount;
    }

    if (!expensesByCategory[catName]) {
      expensesByCategory[catName] = { name: catName, amount: 0, type: catType, color: catColor };
    }
    expensesByCategory[catName].amount += exp.amount;
  });

  const totalExpenses = fixedExpensesTotal + variableExpensesTotal;

  // Savings
  const emergencyGoal = user.savingsGoals.find(g => g.type === 'EMERGENCY_FUND');
  const totalSavingsCurrent = user.savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalSavingsTarget = user.savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);

  // Financial Diagnosis (50/30/20 Rule)
  const availableIncome = netIncome > 0 ? netIncome : grossIncome;
  const needsRatio = availableIncome > 0 ? (fixedExpensesTotal / availableIncome) * 100 : 0;
  const wantsRatio = availableIncome > 0 ? (variableExpensesTotal / availableIncome) * 100 : 0;
  const debtToIncomeRatio = availableIncome > 0 ? (totalMonthlyDebtPayments / availableIncome) * 100 : 0;
  const netSurplus = availableIncome - (totalExpenses + totalMonthlyDebtPayments);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      plan: user.plan,
      city: user.city,
      age: user.age,
      currency: user.currency,
      payFrequency: user.payFrequency,
      createdAt: user.createdAt,
    },
    income: {
      grossIncome,
      netIncome,
      period: latestIncome?.period || 'Actual',
      deductions: user.payrollDeductions,
      totalDeductions,
    },
    debts: {
      list: user.debts,
      totalBalance: totalDebtBalance,
      totalMonthlyPayment: totalMonthlyDebtPayments,
      count: user.debts.length,
    },
    expenses: {
      list: user.expenses,
      byCategory: Object.values(expensesByCategory),
      fixedTotal: fixedExpensesTotal,
      variableTotal: variableExpensesTotal,
      totalExpenses,
    },
    savings: {
      goals: user.savingsGoals,
      emergencyFund: emergencyGoal,
      totalCurrent: totalSavingsCurrent,
      totalTarget: totalSavingsTarget,
    },
    diagnosis: {
      needsRatio: Math.round(needsRatio),
      wantsRatio: Math.round(wantsRatio),
      debtToIncomeRatio: Math.round(debtToIncomeRatio),
      netSurplus: Math.round(netSurplus * 100) / 100,
      healthScore:
        debtToIncomeRatio > 40
          ? 'ALTO RIESGO'
          : debtToIncomeRatio > 25
          ? 'MODERADO'
          : 'SALUDABLE',
    },
  };
}

// =============================================
// ADMIN AUDIT LOGS
// =============================================

export async function getAdminAuditLogs(options: {
  page?: number;
  action?: string;
  pageSize?: number;
}) {
  await requireAdmin();

  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 25;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
  if (options.action) where.action = options.action;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
