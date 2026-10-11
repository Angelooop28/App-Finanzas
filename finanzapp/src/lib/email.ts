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

/**
 * Send a password reset OTP email.
 */
export async function sendOTPEmail(email: string, code: string, userName?: string): Promise<void> {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || 'Fin593 <noreply@fin593.ec>';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0B192C; color: #1E293B; margin: 0; padding: 20px; }
          .container { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #0B192C, #1E3A8A); padding: 32px 24px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; }
          .header p { color: #94A3B8; margin: 4px 0 0; font-size: 13px; }
          .body { padding: 32px 24px; }
          .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
          .code-box { background: #F1F5F9; border: 2px dashed #0B192C; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0B192C; font-family: monospace; }
          .expiry { font-size: 12px; color: #64748B; margin-top: 8px; }
          .warning { font-size: 13px; color: #64748B; line-height: 1.5; margin-top: 16px; }
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
            <p style="color: #475569; font-size: 14px; line-height: 1.5;">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta Fin593.
              Usa el siguiente código de verificación de 6 dígitos:
            </p>
            <div class="code-box">
              <div class="code">${code}</div>
              <div class="expiry">⏱ Este código expira en 15 minutos</div>
            </div>
            <p class="warning">
              Si no solicitaste este cambio, puedes ignorar este correo de forma segura. Tu contraseña actual seguirá siendo válida.
            </p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Fin593 — Gestión financiera inteligente para Ecuador (USD)
          </div>
        </div>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from,
    to: email,
    subject: `${code} — Código de verificación Fin593`,
    html,
    text: `Tu código de verificación para Fin593 es: ${code}. Expira en 15 minutos. Si no solicitaste este cambio, ignora este correo.`,
  });
}
