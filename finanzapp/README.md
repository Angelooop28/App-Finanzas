# Fin593 / FinanzApp Ecuador

Aplicación de gestión financiera personal adaptada a Ecuador (USD $, IESS, SUPA, BIESS, etc.) construida sobre Next.js 16 (App Router), React 19, TypeScript, y Prisma ORM.

## Instalación en Desarrollo

1. Clona el repositorio e instala las dependencias:
   ```bash
   npm install
   ```

2. Configura las variables de entorno. Crea un archivo `.env` basado en `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Corre las migraciones de Prisma y rellena la base de datos (seeds):
   ```bash
   npx prisma generate
   npm run db:migrate
   npm run db:seed
   ```

4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Arquitectura de Carpetas

- `/src/app`: Rutas del App Router de Next.js (Dashboard, Admin, Auth).
- `/src/components/ui`: Componentes del Design System (`Button`, `Input`, `Combobox`, etc.).
- `/src/lib/actions.ts`: Server Actions para manejo seguro y sin intermediarios de CRUD.
- `/src/lib/engine`: Algoritmos financieros (Nómina Ecuador, Deudas Avalancha, Presupuesto).
- `/src/lib/validators.ts`: Validaciones Zod estrictas para el cliente y el servidor.
- `/prisma`: Esquema de la base de datos relacional (PostgreSQL).

## Despliegue en Producción (Vercel + Neon/Supabase)

1. En Vercel, crea un nuevo proyecto e importa el repositorio de Github.
2. Configura las siguientes variables de entorno requeridas:
   - `DATABASE_URL`: URI de conexión a tu base de datos PostgreSQL (p. ej., Neon o Supabase).
   - `AUTH_SECRET`: Genera uno con `npx auth secret` u `openssl rand -base64 32`.
   - `AUTH_URL`: La URL pública de la aplicación.
   - Variables de SMTP (si aplica): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` o `RESEND_API_KEY`.
3. Vercel detectará el comando de Build (`npm run build`) y ejecutará la compilación de Prisma en su paso previo de cacheo y compilación automática.
4. Para correr la primera migración en producción usando una Github Action, o manualmente usa: `npx prisma migrate deploy`. Nunca ejecutes `db push` en producción.
5. El flujo de Github Actions provisto en `.github/workflows/ci.yml` ejecutará `tsc`, `lint`, y `test` ante cualquier merge request o push a la rama `main`.

## Crear el primer Administrador

Para crear el primer rol administrativo, entra al dashboard normal y eleva tus permisos directamente desde la base de datos corriendo el siguiente query SQL crudo:
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'tu_correo@ejemplo.com';
```

## © 2026 Desarrollado por Anedcode S.A.
Todos los derechos reservados. Fin593 es una marca registrada en Ecuador.
