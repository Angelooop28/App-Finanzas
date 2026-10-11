import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { registerSchema } from '@/lib/validators';
import { DEFAULT_CONFIGS, EXPENSE_CATEGORIES_DEFAULT } from '@/lib/config/defaults';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con este correo electrónico' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with default configs and expense categories
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: 'USER',
        // Create default financial configs
        financialConfigs: {
          create: Object.entries(DEFAULT_CONFIGS).map(([key, config]) => ({
            key,
            value: config.value,
            description: config.description,
          })),
        },
        // Create default expense categories
        expenseCategories: {
          create: EXPENSE_CATEGORIES_DEFAULT.map(cat => ({
            name: cat.name,
            type: cat.type,
            icon: cat.icon,
            color: cat.color,
            isSystem: true,
          })),
        },
        // Create default IESS deduction
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
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    await logAudit('REGISTER', user.id, `Usuario registrado: ${email}`);

    return NextResponse.json(
      { message: 'Cuenta creada exitosamente', user },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
