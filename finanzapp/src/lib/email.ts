/**
 * Email service — Fin593
 * Uses Nodemailer for SMTP email delivery.
 * Configured via environment variables for provider flexibility.
 */
import nodemailer from 'nodemailer';

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

function getTransporterConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      'SMTP configuration incomplete. Set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.'
    );
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  };
}

function createTransporter() {
  const config = getTransporterConfig();
  return nodemailer.createTransport(config);
}

export function buildResetPasswordUrl(email: string, code: string, baseUrl?: string): string {
  const rawBase =
    baseUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    'http://localhost:3000';
  const cleanBase = rawBase.replace(/\/+$/, '');
  const params = new URLSearchParams({
    email: email.toLowerCase().trim(),
    code: code.trim(),
  });
  return `${cleanBase}/recuperar-password?${params.toString()}`;
}

/**
 * Send a password reset OTP + direct link email.
 */
export async function sendOTPEmail(
  email: string,
  code: string,
  userName?: string,
  baseUrl?: string
): Promise<{ delivered: boolean; resetUrl: string }> {
  const resetUrl = buildResetPasswordUrl(email, code, baseUrl);
  const from = process.env.SMTP_FROM || 'Fin593 <noreply@fin593.ec>';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0B192C; color: #1E293B; margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.12); }
          .header { background: linear-gradient(135deg, #0B192C, #1E3A8A); padding: 32px 24px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; }
          .header p { color: #94A3B8; margin: 4px 0 0; font-size: 13px; }
          .body { padding: 32px 24px; }
          .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #0F172A; }
          .cta-wrapper { text-align: center; margin: 24px 0; }
          .cta-btn { display: inline-block; background: linear-gradient(135deg, #1E3A8A, #2563EB); color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); }
          .code-box { background: #F1F5F9; border: 2px dashed #0B192C; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
          .code-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748B; font-weight: 700; margin-bottom: 6px; }
          .code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0B192C; font-family: monospace; }
          .expiry { font-size: 12px; color: #64748B; margin-top: 8px; }
          .link-fallback { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 12px; font-size: 11px; color: #475569; word-break: break-all; margin-top: 16px; }
          .warning { font-size: 13px; color: #64748B; line-height: 1.5; margin-top: 18px; }
          .footer { background: #F8FAFC; padding: 16px 24px; text-align: center; font-size: 11px; color: #94A3B8; border-top: 1px solid #E2E8F0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Fin593</h1>
            <p>Finanzas Personales Inteligentes • Ecuador</p>
          </div>
          <div class="body">
            <div class="greeting">Hola, ${userName || 'Usuario'}</div>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Fin593</strong>.
              Puedes abrir directamente el enlace seguro de recuperación o ingresar el código de 6 dígitos en el formulario:
            </p>
            <div class="cta-wrapper">
              <a href="${resetUrl}" class="cta-btn" target="_blank" rel="noopener noreferrer">
                Restablecer mi Contraseña →
              </a>
            </div>
            <div class="code-box">
              <div class="code-label">Código de verificación</div>
              <div class="code">${code}</div>
              <div class="expiry">⏱ Este código y enlace expiran en 15 minutos</div>
            </div>
            <div class="link-fallback">
              <strong>¿No funciona el botón?</strong> Copia y pega este enlace en tu navegador:<br/>
              <a href="${resetUrl}" style="color: #2563EB;">${resetUrl}</a>
            </div>
            <p class="warning">
              Al guardar tu nueva contraseña, la contraseña anterior será eliminada automáticamente. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
            </p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Fin593 — Gestión financiera inteligente para Ecuador (USD)
          </div>
        </div>
      </body>
    </html>
  `;

  const text = [
    `Hola, ${userName || 'Usuario'}.`,
    `Recibimos una solicitud para restablecer tu contraseña en Fin593.`,
    `Código de verificación de 6 dígitos: ${code}`,
    `Enlace directo para restablecer tu contraseña: ${resetUrl}`,
    `Este código y enlace expiran en 15 minutos.`,
    `Al guardar tu nueva contraseña, la anterior será eliminada automáticamente.`,
  ].join('\n\n');

  if (!isSmtpConfigured()) {
    console.warn('[PasswordReset] SMTP not configured. Generated reset link:', resetUrl);
    return { delivered: false, resetUrl };
  }

  const transporter = createTransporter();
  await transporter.sendMail({
    from,
    to: email,
    subject: `${code} — Recuperación de contraseña Fin593`,
    html,
    text,
  });

  return { delivered: true, resetUrl };
}
