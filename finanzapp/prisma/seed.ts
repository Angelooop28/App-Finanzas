/**
 * Prisma Seed Script
 * Creates ONLY the Admin user for production/testing setup.
 * 
 * Run with: npx tsx prisma/seed.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEFAULT_CONFIGS, EXPENSE_CATEGORIES_DEFAULT } from '../src/lib/config/defaults';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Inicializando base de datos con cuenta Administrador...\n');

  const now = new Date();

  // ---- 1. Admin User ----
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@finanzapp.ec').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin1234';
  if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD) {
    throw new Error('ADMIN_PASSWORD es obligatorio para ejecutar el seed en producción.');
  }
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN',
      name: 'Administrador FinanzApp',
    },
    create: {
      email: adminEmail,
      name: 'Administrador FinanzApp',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      city: 'Quito',
      currency: 'USD',
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

  console.log(`🛡️ Usuario Admin creado exitosamente: ${admin.email} (Rol: ${admin.role})`);

  // ---- 2. Initial Audit Log ----
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'ADMIN_ACTION',
      details: 'Base de datos inicializada en Neon PostgreSQL',
      ipAddress: '127.0.0.1',
      createdAt: now,
    },
  });

  console.log('✅ Log de auditoría inicial registrado');

  console.log('\n' + '='.repeat(50));
  console.log('🎉 ¡Inicialización completada!');
  console.log('='.repeat(50));
  console.log('\n🛡️ Acceso Administrador:');
  console.log(`📧 Email:       ${adminEmail}`);
  console.log('🔑 Contraseña:  (definida en ADMIN_PASSWORD)');
  console.log('🌐 Panel Admin: /admin');
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
