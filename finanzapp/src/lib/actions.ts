'use server';

/**
 * Server Actions — FinanzApp
 * All database operations centralized here.
 * All mutating actions validate with Zod schemas and return { success, error }.
 */

import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import {
  incomeSchema,
  deductionSchema,
  debtSchema,
  expenseSchema,
  savingsGoalSchema,
  purchaseQuerySchema,
  profileSchema,
} from '@/lib/validators';

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

/**
 * Extract the first Zod error message from a safeParse result and ensure it is in Spanish.
 */
function getZodError(result: { error: { issues: Array<{ message: string }> } }): string {
  const issue = result.error.issues[0];
  if (!issue) return 'Datos inválidos';
  let msg = issue.message;

  if (msg.includes('Too small: expected number to be >=')) {
    const val = msg.split('>=')[1]?.trim() || '1';
    return `El valor debe ser mayor o igual a ${val}`;
  }
  if (msg.includes('Too small: expected string to have >=')) {
    return 'El campo no puede estar vacío';
  }
  if (msg.includes('Expected number') || msg.includes('received nan')) {
    return 'Por favor ingresa un número válido';
  }
  if (msg.includes('Required')) {
    return 'Este campo es requerido';
  }

  return msg;
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
    const parsed = incomeSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: getZodError(parsed) };

    const userId = await getUserId();
    const { grossAmount, period } = parsed.data;

    const existing = await prisma.income.findFirst({
      where: { userId, period, type: 'SALARY' },
    });

    if (existing) {
      await prisma.income.update({
        where: { id: existing.id },
        data: { grossAmount, netAmount: data.netAmount },
      });
    } else {
      await prisma.income.create({
        data: {
          userId,
          grossAmount,
          netAmount: data.netAmount,
          period,
          type: 'SALARY',
          description: parsed.data.description || 'Salario mensual',
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
    const parsed = deductionSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: getZodError(parsed) };

    const userId = await getUserId();
    const count = await prisma.payrollDeduction.count({ where: { userId } });

    await prisma.payrollDeduction.create({
      data: {
        userId,
        name: parsed.data.name.trim(),
        type: parsed.data.type,
        isPercentage: parsed.data.isPercentage,
        percentage: parsed.data.isPercentage ? parsed.data.percentage : null,
        fixedAmount: !parsed.data.isPercentage ? parsed.data.fixedAmount : null,
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

const VALID_DEBT_TYPES = ['CREDIT_CARD', 'PERSONAL_LOAN', 'MORTGAGE', 'INFORMAL', 'IESS_LOAN', 'CAR_LOAN', 'STUDENT_LOAN', 'OTHER'] as const;

function mapDebtType(type: string): typeof VALID_DEBT_TYPES[number] {
  if (type === 'COOPERATIVE') return 'PERSONAL_LOAN';
  if (type === 'MORTGAGE_BIESS') return 'MORTGAGE';
  if (type === 'SUPA') return 'INFORMAL';
  if (type === 'RETAIL') return 'OTHER';
  if ((VALID_DEBT_TYPES as readonly string[]).includes(type)) {
    return type as typeof VALID_DEBT_TYPES[number];
  }
  return 'OTHER';
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
    const parsed = debtSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: getZodError(parsed) };

    const userId = await getUserId();
    const d = parsed.data;

    await prisma.debt.create({
      data: {
        userId,
        name: d.name.trim(),
        creditor: d.creditor?.trim() || null,
        type: mapDebtType(d.type),
        totalOwed: d.totalOwed,
        originalAmount: d.originalAmount || d.totalOwed,
        monthlyPayment: d.monthlyPayment,
        interestRate: d.interestRate,
        nextDueDate: d.nextDueDate ? new Date(d.nextDueDate) : null,
        remainingInstallments: d.remainingInstallments || null,
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
    const parsed = expenseSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: getZodError(parsed) };

    const userId = await getUserId();
    const d = parsed.data;
    const dateObj = new Date(d.date);
    const period = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

    await prisma.expense.create({
      data: {
        userId,
        categoryId: d.categoryId,
        description: d.description?.trim() || null,
        amount: d.amount,
        date: dateObj,
        isRecurring: d.isRecurring || false,
        recurringDay: d.recurringDay || null,
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
    const cleanData = {
      name: data.name,
      type: data.type || 'CUSTOM',
      targetAmount: Number(data.targetAmount),
      currentAmount: Number(data.currentAmount) > 0 ? Number(data.currentAmount) : 0,
      monthlyContribution: Number(data.monthlyContribution) > 0 ? Number(data.monthlyContribution) : undefined,
      targetMonths: Number(data.targetMonths) > 0 ? Number(data.targetMonths) : undefined,
    };
    const parsed = savingsGoalSchema.safeParse(cleanData);
    if (!parsed.success) return { success: false, error: getZodError(parsed) };

    const userId = await getUserId();
    const d = parsed.data;

    await prisma.savingsGoal.create({
      data: {
        userId,
        name: d.name.trim(),
        type: d.type,
        targetAmount: d.targetAmount,
        currentAmount: d.currentAmount || 0,
        monthlyContribution: d.monthlyContribution || null,
        targetMonths: d.targetMonths || null,
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
    const parsed = purchaseQuerySchema.safeParse({ description: data.description, amount: data.amount });
    if (!parsed.success) return { success: false, error: getZodError(parsed) };

    const userId = await getUserId();

    await prisma.purchaseQuery.create({
      data: {
        userId,
        description: parsed.data.description.trim(),
        amount: parsed.data.amount,
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
    const parsed = profileSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: getZodError(parsed) };

    const userId = await getUserId();
    const d = parsed.data;

    await prisma.user.update({
      where: { id: userId },
      data: {
        name: d.name?.trim(),
        age: d.age,
        city: d.city?.trim(),
        payFrequency: d.payFrequency as 'MONTHLY' | undefined,
        payrollCutoffDay: d.payrollCutoffDay,
      },
    });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('updateProfile error:', error);
    return { success: false, error: 'Error al actualizar el perfil' };
  }
}
