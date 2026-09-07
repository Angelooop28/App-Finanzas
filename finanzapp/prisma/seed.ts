/**
 * Prisma Seed Script
 * Creates a demo user with sample data for testing.
 * 
 * Run with: npx tsx prisma/seed.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // ---- Demo User ----
  const passwordHash = await bcrypt.hash('Demo1234', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@finanzapp.ec' },
    update: {},
    create: {
      email: 'demo@finanzapp.ec',
      name: 'Juan Pérez',
      passwordHash,
      age: 28,
      city: 'Quito',
      currency: 'USD',
      payFrequency: 'MONTHLY',
      payrollCutoffDay: 28,
      onboardingCompleted: true,
    },
  });

  console.log(`✅ Usuario demo creado: ${user.email}`);

  // ---- Default Payroll Deductions ----
  await prisma.payrollDeduction.deleteMany({ where: { userId: user.id } });

  await prisma.payrollDeduction.createMany({
    data: [
      {
        userId: user.id,
        name: 'Aporte Personal IESS',
        type: 'IESS',
        percentage: 9.45,
        isPercentage: true,
        isActive: true,
        sortOrder: 0,
      },
      {
        userId: user.id,
        name: 'Préstamo Quirografario IESS',
        type: 'IESS_LOAN',
        fixedAmount: 85.00,
        isPercentage: false,
        isActive: true,
        sortOrder: 1,
      },
    ],
  });

  console.log('✅ Descuentos de nómina creados (IESS 9.45% + Quirografario $85)');

  // ---- Income (dynamic period) ----
  await prisma.income.deleteMany({ where: { userId: user.id } });

  await prisma.income.create({
    data: {
      userId: user.id,
      grossAmount: 1200.00,
      netAmount: 1001.60,
      isNetManual: false,
      period: currentPeriod,
      type: 'SALARY',
      description: 'Salario mensual',
    },
  });

  console.log(`✅ Ingreso registrado: $1,200 bruto → $1,001.60 neto (${currentPeriod})`);

  // ---- Debts (dynamic due dates) ----
  await prisma.debt.deleteMany({ where: { userId: user.id } });

  const debts = await prisma.debt.createManyAndReturn({
    data: [
      {
        userId: user.id,
        name: 'Visa Banco Pichincha',
        creditor: 'Banco Pichincha',
        type: 'CREDIT_CARD',
        totalOwed: 2400.00,
        originalAmount: 3000.00,
        monthlyPayment: 120.00,
        interestRate: 16.5,
        nextDueDate: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 15),
        remainingInstallments: 24,
        status: 'ACTIVE',
      },
      {
        userId: user.id,
        name: 'Préstamo Personal Produbanco',
        creditor: 'Produbanco',
        type: 'PERSONAL_LOAN',
        totalOwed: 5000.00,
        originalAmount: 8000.00,
        monthlyPayment: 180.00,
        interestRate: 11.2,
        nextDueDate: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 5),
        remainingInstallments: 30,
        status: 'ACTIVE',
      },
      {
        userId: user.id,
        name: 'Deuda familiar (tío Carlos)',
        type: 'INFORMAL',
        totalOwed: 500.00,
        originalAmount: 500.00,
        monthlyPayment: 50.00,
        interestRate: 0,
        remainingInstallments: 10,
        status: 'ACTIVE',
      },
    ],
  });

  console.log(`✅ ${debts.length} deudas registradas (Visa, Produbanco, familiar)`);

  // ---- Expense Categories (delete expenses first to avoid FK constraint) ----
  await prisma.expense.deleteMany({ where: { userId: user.id } });
  await prisma.expenseCategory.deleteMany({ where: { userId: user.id } });

  const categories = await prisma.expenseCategory.createManyAndReturn({
    data: [
      { userId: user.id, name: 'Arriendo', type: 'FIXED', icon: '🏠', color: '#6366F1', isSystem: true },
      { userId: user.id, name: 'Servicios básicos', type: 'FIXED', icon: '💡', color: '#F59E0B', isSystem: true },
      { userId: user.id, name: 'Internet/Teléfono', type: 'FIXED', icon: '📱', color: '#3B82F6', isSystem: true },
      { userId: user.id, name: 'Alimentación', type: 'VARIABLE', icon: '🍽️', color: '#10B981', isSystem: true },
      { userId: user.id, name: 'Transporte', type: 'VARIABLE', icon: '🚌', color: '#F97316', isSystem: true },
      { userId: user.id, name: 'Entretenimiento', type: 'VARIABLE', icon: '🎬', color: '#EC4899', isSystem: true },
      { userId: user.id, name: 'Otros', type: 'VARIABLE', icon: '📦', color: '#64748B', isSystem: true },
    ],
  });

  console.log(`✅ ${categories.length} categorías de gastos creadas`);

  // ---- Expenses (dynamic dates in current period) ----
  const catMap = Object.fromEntries(categories.map(c => [c.name, c.id]));
  const y = now.getFullYear();
  const m = now.getMonth();

  await prisma.expense.createMany({
    data: [
      { userId: user.id, categoryId: catMap['Arriendo'], description: 'Arriendo departamento', amount: 350, date: new Date(y, m, 1), isRecurring: true, recurringDay: 1, period: currentPeriod },
      { userId: user.id, categoryId: catMap['Servicios básicos'], description: 'Luz + Agua', amount: 55, date: new Date(y, m, 10), isRecurring: true, recurringDay: 10, period: currentPeriod },
      { userId: user.id, categoryId: catMap['Internet/Teléfono'], description: 'Plan celular + Internet', amount: 45, date: new Date(y, m, 15), isRecurring: true, recurringDay: 15, period: currentPeriod },
      { userId: user.id, categoryId: catMap['Alimentación'], description: 'Supermercado semanal', amount: 60, date: new Date(y, m, 2), period: currentPeriod },
      { userId: user.id, categoryId: catMap['Alimentación'], description: 'Supermercado semanal', amount: 55, date: new Date(y, m, 9), period: currentPeriod },
      { userId: user.id, categoryId: catMap['Alimentación'], description: 'Supermercado semanal', amount: 65, date: new Date(y, m, 16), period: currentPeriod },
      { userId: user.id, categoryId: catMap['Transporte'], description: 'Gasolina + bus', amount: 60, date: new Date(y, m, 5), period: currentPeriod },
      { userId: user.id, categoryId: catMap['Entretenimiento'], description: 'Cine + comida fuera', amount: 40, date: new Date(y, m, 12), period: currentPeriod },
    ],
  });

  console.log('✅ 8 gastos del mes registrados');

  // ---- Financial Config ----
  await prisma.financialConfig.deleteMany({ where: { userId: user.id } });

  await prisma.financialConfig.createMany({
    data: [
      { userId: user.id, key: 'IESS_PERSONAL_RATE', value: 9.45, description: 'Aporte personal IESS (%)' },
      { userId: user.id, key: 'BUDGET_NEEDS_PCT', value: 50, description: 'Regla 50/30/20 — Necesidades (%)' },
      { userId: user.id, key: 'BUDGET_WANTS_PCT', value: 30, description: 'Regla 50/30/20 — Deseos (%)' },
      { userId: user.id, key: 'BUDGET_SAVINGS_PCT', value: 20, description: 'Regla 50/30/20 — Ahorro (%)' },
      { userId: user.id, key: 'ALERT_DAYS_BEFORE', value: 3, description: 'Días antes del vencimiento para alertar' },
    ],
  });

  console.log('✅ Configuración financiera creada');

  // ---- Summary ----
  console.log('\n' + '='.repeat(50));
  console.log('🎉 ¡Seed completado!');
  console.log('='.repeat(50));
  console.log('\n📧 Email:      demo@finanzapp.ec');
  console.log('🔑 Contraseña: Demo1234');
  console.log('\n💵 Salario:    $1,200 bruto → $1,001.60 neto');
  console.log('💳 Deudas:     3 deudas ($350/mes en cuotas)');
  console.log('🧾 Gastos:     8 registros ($730 este mes)');
  console.log('');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error en seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
