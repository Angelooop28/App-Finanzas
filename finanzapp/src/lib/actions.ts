'use server';

/**
 * Server Actions — FinanzApp
 * All database operations centralized here.
 * Mutating actions return { success, error } for clean client handling.
 */

import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// ---- Types ----
type ActionResult = { success: true } | { success: false; error: string };

// ---- Helper: get current user ID ----
async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('No autenticado');
  return session.user.id;
}

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// =============================================
// DASHBOARD DATA
// =============================================

export async function getDashboardData() {
  const userId = await getUserId();

  const [user, incomes, deductions, debts, expenses, categories, savingsGoals] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.income.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 1 }),
    prisma.payrollDeduction.findMany({ where: { userId, isActive: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.debt.findMany({ where: { userId, status: 'ACTIVE' }, orderBy: { nextDueDate: 'asc' } }),
    prisma.expense.findMany({
      where: { userId, period: getCurrentPeriod() },
      include: { category: true },
      orderBy: { date: 'desc' },
    }),
    prisma.expenseCategory.findMany({ where: { userId } }),
    prisma.savingsGoal.findMany({ where: { userId, status: 'ACTIVE' } }),
  ]);

  return { user, incomes, deductions, debts, expenses, categories, savingsGoals };
}

// =============================================
// INCOME & DEDUCTIONS
// =============================================

export async function getIncomeData() {
  const userId = await getUserId();

  const [incomes, deductions] = await Promise.all([
    prisma.income.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.payrollDeduction.findMany({ where: { userId }, orderBy: { sortOrder: 'asc' } }),
  ]);

  return { incomes, deductions };
}

export async function saveIncome(data: {
  grossAmount: number;
  netAmount: number;
  period: string;
  type?: string;
  description?: string;
}): Promise<ActionResult> {
  try {
    if (data.grossAmount <= 0) return { success: false, error: 'El salario bruto debe ser mayor a 0' };
    if (!data.period || !/^\d{4}-\d{2}$/.test(data.period)) return { success: false, error: 'Período inválido' };

    const userId = await getUserId();

    const existing = await prisma.income.findFirst({
      where: { userId, period: data.period, type: 'SALARY' },
    });

    if (existing) {
      await prisma.income.update({
        where: { id: existing.id },
        data: { grossAmount: data.grossAmount, netAmount: data.netAmount },
      });
    } else {
      await prisma.income.create({
        data: {
          userId,
          grossAmount: data.grossAmount,
          netAmount: data.netAmount,
          period: data.period,
          type: 'SALARY',
          description: data.description || 'Salario mensual',
        },
      });
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/ingresos');
    return { success: true };
  } catch (error) {
    console.error('saveIncome error:', error);
    return { success: false, error: 'Error al guardar el ingreso' };
  }
}

export async function addDeduction(data: {
  name: string;
  type: string;
  isPercentage: boolean;
  percentage?: number;
  fixedAmount?: number;
}): Promise<ActionResult> {
  try {
    if (!data.name.trim()) return { success: false, error: 'El nombre es requerido' };

    const userId = await getUserId();
    const count = await prisma.payrollDeduction.count({ where: { userId } });

    await prisma.payrollDeduction.create({
      data: {
        userId,
        name: data.name.trim(),
        type: data.type as 'OTHER',
        isPercentage: data.isPercentage,
        percentage: data.isPercentage ? data.percentage : null,
        fixedAmount: !data.isPercentage ? data.fixedAmount : null,
        isActive: true,
        sortOrder: count,
      },
    });

    revalidatePath('/dashboard/ingresos');
    return { success: true };
  } catch (error) {
    console.error('addDeduction error:', error);
    return { success: false, error: 'Error al agregar el descuento' };
  }
}

export async function toggleDeduction(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const userId = await getUserId();
    await prisma.payrollDeduction.updateMany({
      where: { id, userId },
      data: { isActive },
    });
    revalidatePath('/dashboard/ingresos');
    return { success: true };
  } catch (error) {
    console.error('toggleDeduction error:', error);
    return { success: false, error: 'Error al cambiar el estado del descuento' };
  }
}

export async function deleteDeduction(id: string): Promise<ActionResult> {
  try {
    const userId = await getUserId();
    await prisma.payrollDeduction.deleteMany({ where: { id, userId } });
    revalidatePath('/dashboard/ingresos');
    return { success: true };
  } catch (error) {
    console.error('deleteDeduction error:', error);
    return { success: false, error: 'Error al eliminar el descuento' };
  }
}

// =============================================
// DEBTS
// =============================================

export async function getDebts() {
  const userId = await getUserId();
  return prisma.debt.findMany({
    where: { userId },
    include: { payments: { orderBy: { paymentDate: 'desc' }, take: 5 } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function addDebt(data: {
  name: string;
  creditor?: string;
  type: string;
  totalOwed: number;
  originalAmount?: number;
  monthlyPayment: number;
  interestRate: number;
  nextDueDate?: string;
  remainingInstallments?: number;
}): Promise<ActionResult> {
  try {
    if (!data.name.trim()) return { success: false, error: 'El nombre es requerido' };
    if (data.totalOwed <= 0) return { success: false, error: 'El saldo debe ser mayor a 0' };
    if (data.monthlyPayment <= 0) return { success: false, error: 'La cuota mensual debe ser mayor a 0' };

    const userId = await getUserId();

    await prisma.debt.create({
      data: {
        userId,
        name: data.name.trim(),
        creditor: data.creditor?.trim() || null,
        type: data.type as 'OTHER',
        totalOwed: data.totalOwed,
        originalAmount: data.originalAmount || data.totalOwed,
        monthlyPayment: data.monthlyPayment,
        interestRate: data.interestRate,
        nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null,
        remainingInstallments: data.remainingInstallments || null,
        status: 'ACTIVE',
      },
    });

    revalidatePath('/dashboard/deudas');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('addDebt error:', error);
    return { success: false, error: 'Error al agregar la deuda' };
  }
}

export async function updateDebt(id: string, data: {
  name?: string;
  creditor?: string;
  type?: string;
  totalOwed?: number;
  monthlyPayment?: number;
  interestRate?: number;
  nextDueDate?: string;
  remainingInstallments?: number;
  status?: string;
}): Promise<ActionResult> {
  try {
    const userId = await getUserId();

    await prisma.debt.updateMany({
      where: { id, userId },
      data: {
        ...data,
        name: data.name?.trim(),
        type: data.type as 'OTHER' | undefined,
        status: data.status as 'ACTIVE' | undefined,
        nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : undefined,
      },
    });

    revalidatePath('/dashboard/deudas');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('updateDebt error:', error);
    return { success: false, error: 'Error al actualizar la deuda' };
  }
}

export async function deleteDebt(id: string): Promise<ActionResult> {
  try {
    const userId = await getUserId();
    await prisma.debt.deleteMany({ where: { id, userId } });
    revalidatePath('/dashboard/deudas');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('deleteDebt error:', error);
    return { success: false, error: 'Error al eliminar la deuda' };
  }
}

export async function markDebtPaid(debtId: string, amount: number): Promise<ActionResult> {
  try {
    if (amount <= 0) return { success: false, error: 'El monto debe ser mayor a 0' };

    const userId = await getUserId();
    const debt = await prisma.debt.findFirst({ where: { id: debtId, userId } });
    if (!debt) return { success: false, error: 'Deuda no encontrada' };

    await prisma.debtPayment.create({
      data: { debtId, amount, paymentDate: new Date(), type: 'REGULAR' },
    });

    const newBalance = Math.max(0, debt.totalOwed - amount);
    await prisma.debt.update({
      where: { id: debtId },
      data: {
        totalOwed: newBalance,
        remainingInstallments: debt.remainingInstallments ? Math.max(0, debt.remainingInstallments - 1) : null,
        status: newBalance <= 0 ? 'PAID_OFF' : 'ACTIVE',
      },
    });

    revalidatePath('/dashboard/deudas');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('markDebtPaid error:', error);
    return { success: false, error: 'Error al registrar el pago' };
  }
}

// =============================================
// EXPENSES
// =============================================

export async function getExpenses(period?: string) {
  const userId = await getUserId();
  const p = period || getCurrentPeriod();

  const [expenses, categories] = await Promise.all([
    prisma.expense.findMany({
      where: { userId, period: p },
      include: { category: true },
      orderBy: { date: 'desc' },
    }),
    prisma.expenseCategory.findMany({ where: { userId }, orderBy: { name: 'asc' } }),
  ]);

  return { expenses, categories, period: p };
}

export async function addExpense(data: {
  categoryId: string;
  description?: string;
  amount: number;
  date: string;
  isRecurring?: boolean;
  recurringDay?: number;
}): Promise<ActionResult> {
  try {
    if (data.amount <= 0) return { success: false, error: 'El monto debe ser mayor a 0' };
    if (!data.categoryId) return { success: false, error: 'Selecciona una categoría' };

    const userId = await getUserId();
    const dateObj = new Date(data.date);
    const period = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

    await prisma.expense.create({
      data: {
        userId,
        categoryId: data.categoryId,
        description: data.description?.trim() || null,
        amount: data.amount,
        date: dateObj,
        isRecurring: data.isRecurring || false,
        recurringDay: data.recurringDay || null,
        period,
      },
    });

    revalidatePath('/dashboard/gastos');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('addExpense error:', error);
    return { success: false, error: 'Error al agregar el gasto' };
  }
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  try {
    const userId = await getUserId();
    await prisma.expense.deleteMany({ where: { id, userId } });
    revalidatePath('/dashboard/gastos');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('deleteExpense error:', error);
    return { success: false, error: 'Error al eliminar el gasto' };
  }
}

// =============================================
// SAVINGS
// =============================================

export async function getSavingsGoals() {
  const userId = await getUserId();
  return prisma.savingsGoal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}

export async function addSavingsGoal(data: {
  name: string;
  type: string;
  targetAmount: number;
  currentAmount?: number;
  monthlyContribution?: number;
  targetMonths?: number;
}): Promise<ActionResult> {
  try {
    if (!data.name.trim()) return { success: false, error: 'El nombre es requerido' };
    if (data.targetAmount <= 0) return { success: false, error: 'La meta debe ser mayor a 0' };

    const userId = await getUserId();

    await prisma.savingsGoal.create({
      data: {
        userId,
        name: data.name.trim(),
        type: data.type as 'CUSTOM',
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount || 0,
        monthlyContribution: data.monthlyContribution || null,
        targetMonths: data.targetMonths || null,
        status: 'ACTIVE',
      },
    });

    revalidatePath('/dashboard/ahorro');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('addSavingsGoal error:', error);
    return { success: false, error: 'Error al crear la meta de ahorro' };
  }
}

export async function updateSavingsGoal(id: string, data: { currentAmount?: number; status?: string }): Promise<ActionResult> {
  try {
    const userId = await getUserId();
    await prisma.savingsGoal.updateMany({
      where: { id, userId },
      data: { ...data, status: data.status as 'ACTIVE' | undefined },
    });
    revalidatePath('/dashboard/ahorro');
    return { success: true };
  } catch (error) {
    console.error('updateSavingsGoal error:', error);
    return { success: false, error: 'Error al actualizar la meta' };
  }
}

export async function deleteSavingsGoal(id: string): Promise<ActionResult> {
  try {
    const userId = await getUserId();
    await prisma.savingsGoal.deleteMany({ where: { id, userId } });
    revalidatePath('/dashboard/ahorro');
    return { success: true };
  } catch (error) {
    console.error('deleteSavingsGoal error:', error);
    return { success: false, error: 'Error al eliminar la meta' };
  }
}

// =============================================
// PURCHASE QUERIES
// =============================================

export async function savePurchaseQuery(data: {
  description: string;
  amount: number;
  recommendation: string;
  justification: string;
  surplusAtTime: number;
}): Promise<ActionResult> {
  try {
    const userId = await getUserId();

    await prisma.purchaseQuery.create({
      data: {
        userId,
        description: data.description.trim(),
        amount: data.amount,
        recommendation: data.recommendation as 'YES',
        justification: data.justification,
        surplusAtTime: data.surplusAtTime,
      },
    });

    revalidatePath('/dashboard/consultar');
    return { success: true };
  } catch (error) {
    console.error('savePurchaseQuery error:', error);
    return { success: false, error: 'Error al guardar la consulta' };
  }
}

export async function getPurchaseHistory() {
  const userId = await getUserId();
  return prisma.purchaseQuery.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
}

// =============================================
// PROFILE
// =============================================

export async function getProfile() {
  const userId = await getUserId();
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function updateProfile(data: {
  name?: string;
  age?: number;
  city?: string;
  payFrequency?: string;
  payrollCutoffDay?: number;
}): Promise<ActionResult> {
  try {
    if (data.name !== undefined && !data.name.trim()) return { success: false, error: 'El nombre es requerido' };
    if (data.age !== undefined && (data.age < 15 || data.age > 120)) return { success: false, error: 'La edad debe estar entre 15 y 120' };
    if (data.payrollCutoffDay !== undefined && (data.payrollCutoffDay < 1 || data.payrollCutoffDay > 31)) return { success: false, error: 'El día de corte debe estar entre 1 y 31' };

    const userId = await getUserId();
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name?.trim(),
        age: data.age,
        city: data.city?.trim(),
        payFrequency: data.payFrequency as 'MONTHLY' | undefined,
        payrollCutoffDay: data.payrollCutoffDay,
      },
    });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('updateProfile error:', error);
    return { success: false, error: 'Error al actualizar el perfil' };
  }
}
