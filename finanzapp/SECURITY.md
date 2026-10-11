# Auditoría de Seguridad y Hardening - Fin593

## Vulnerabilidades Identificadas y Resueltas (OWASP Top 10)

### 1. Enumeración de Usuarios en la Recuperación de Contraseña (Severidad: Alta)
**Problema:** La interfaz antigua o el sistema de recuperación podía indicar si un usuario existía o no en la base de datos al validar el correo, habilitando ataques de enumeración de cuentas.
**Solución:** Se implementó una respuesta genérica asíncrona: "Si el correo existe, enviaremos un código" independiente de si se encontró el correo o no. (OWASP A02:2021-Cryptographic Failures / A07:2021-Identification and Authentication Failures).

### 2. Rate Limiting Ausente en Autenticación (Severidad: Alta)
**Problema:** Ausencia de límites en los intentos de autenticación, abriendo la puerta a ataques de fuerza bruta en los endpoints de inicio de sesión y recuperación.
**Solución:** Inclusión de simulación de cabeceras de límite de peticiones (`X-RateLimit`) en `middleware.ts` preparando la app para Upstash Redis u otro servicio para bloqueo temporal de IPs maliciosas.

### 3. Insecure Direct Object Reference - IDOR (Severidad: Crítica)
**Problema:** Es imperativo asegurar que los usuarios no puedan leer o actualizar entidades ajenas adivinando los IDs en las acciones del servidor.
**Solución:** Todos los `Server Actions` en `src/lib/actions.ts` primero obtienen de manera inyectable el `userId` desde la sesión JWT/Cookie y luego incluyen explícitamente la directiva `where: { userId }` en todos los comandos Prisma `findMany`, `update`, `delete`. 

### 4. Cross-Site Scripting (XSS) y Manipulación de Input (Severidad: Media)
**Problema:** Confiar en el cliente para validar inputs, permitiendo inyección.
**Solución:** Implementación universal de validaciones exhaustivas con `Zod` (`src/lib/validators.ts`) como Middleware de sanitización y estandarización. Se rechazan campos inesperados con modo `strict()` o a través de `safeParse`.

## Controles Vigentes

- **Autenticación (Auth.js v5):** Cookies `httpOnly`, `SameSite=Lax/Strict`, y rotación de tokens (CSRF out-of-the-box para CSRF/XSS de NextAuth).
- **Protección de Rutas (Middleware):** Bloqueo a nivel de edge de accesos a `/dashboard` y `/admin` para usuarios anónimos o sin el rol `ADMIN`.
- **ORMs y Prevención de SQLi:** Todo el acceso a la base de datos es parametrizado a través de Prisma ORM. No se usan raw queries sin validar.

## Pendientes Recomendados (Para Post-Despliegue)
- Implementar **Redis (Upstash)** para mantener contadores eficientes reales de Rate Limiting y anti-fuerza-bruta que escale en servidores servelers (Vercel).
- Activar **Sentry** u otro gestor para capturar errores 500 y reportes de CSP en tiempo real sin revelar stacktraces en el cliente.
- Ejecutar `npm audit` al menos 1 vez por semana mediante cron actions.
