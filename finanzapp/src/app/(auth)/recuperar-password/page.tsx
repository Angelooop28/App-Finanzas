'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Check,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { requestPasswordReset, verifyOTP, resetPassword } from '@/lib/actions/password-reset';
import ThemeToggle from '@/components/ThemeToggle';
import styles from '../auth.module.css';

type Step = 'email' | 'otp' | 'newPassword' | 'success';

function RecuperarPasswordContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email')?.trim() || '';
  const initialCode = searchParams.get('code')?.replace(/\D/g, '').slice(0, 6) || '';

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(() => initialEmail);
  const [otp, setOtp] = useState<string[]>(() =>
    initialCode.length === 6 ? initialCode.split('') : ['', '', '', '', '', '']
  );
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [fallbackData, setFallbackData] = useState<{ resetUrl?: string; code?: string } | null>(null);
  const [loading, setLoading] = useState(() => Boolean(initialEmail && initialCode.length === 6));
  const [countdown, setCountdown] = useState(0);
  const [verifiedViaLink, setVerifiedViaLink] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const processedLinkRef = useRef(false);

  // Handle URL query parameters (?email=...&code=...) from recovery email link
  useEffect(() => {
    if (processedLinkRef.current) return;
    if (initialEmail && initialCode.length === 6) {
      processedLinkRef.current = true;
      verifyOTP({ email: initialEmail, code: initialCode })
        .then((res) => {
          if (res.success) {
            setVerifiedViaLink(true);
            setStep('newPassword');
          } else {
            setError(res.error);
            setStep('otp');
          }
        })
        .catch(() => {
          setError('No se pudo validar el enlace automáticamente. Verifica el código.');
          setStep('otp');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [initialEmail, initialCode]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Step 1: Request OTP + Recovery Link
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setFallbackData(null);
    setLoading(true);
    try {
      const result = await requestPasswordReset({ email: email.trim() });
      if (result.success) {
        setStep('otp');
        setCountdown(60);
        if (result.message) {
          setInfoMessage(result.message);
        }
        if (result.emailDelivered === false && (result.fallbackResetUrl || result.fallbackCode)) {
          setFallbackData({
            resetUrl: result.fallbackResetUrl,
            code: result.fallbackCode,
          });
        }
      } else {
        setError(result.error);
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit input
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const next = ['', '', '', '', '', ''];
      for (let i = 0; i < 6; i++) {
        next[i] = pasted[i] || '';
      }
      setOtp(next);
      const focusIdx = Math.min(pasted.length, 5);
      otpRefs.current[focusIdx]?.focus();
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Ingresa el código completo de 6 dígitos');
      return;
    }
    setLoading(true);
    try {
      const result = await verifyOTP({ email: email.trim(), code });
      if (result.success) {
        setStep('newPassword');
      } else {
        setError(result.error);
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Password validation rules
  const rules = {
    minLength: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    matchesConfirm: newPassword.length > 0 && newPassword === confirmPassword,
  };

  const isPasswordRobust =
    rules.minLength && rules.hasUpper && rules.hasLower && rules.hasNumber && rules.matchesConfirm;

  const getPasswordStrength = () => {
    let score = 0;
    if (rules.minLength) score++;
    if (rules.hasUpper && rules.hasLower) score++;
    if (rules.hasNumber) score++;
    if (/[^A-Za-z0-9]/.test(newPassword) || newPassword.length >= 12) score++;
    return score;
  };

  // Step 3: Reset password (eliminates old password and saves new password)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!rules.minLength) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (!rules.hasUpper) {
      setError('La contraseña debe contener al menos una letra mayúscula');
      return;
    }
    if (!rules.hasLower) {
      setError('La contraseña debe contener al menos una letra minúscula');
      return;
    }
    if (!rules.hasNumber) {
      setError('La contraseña debe contener al menos un número');
      return;
    }
    if (!rules.matchesConfirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const code = otp.join('');
      const result = await resetPassword({
        email: email.trim(),
        code,
        newPassword,
        confirmPassword,
      });
      if (result.success) {
        setFallbackData(null);
        setStep('success');
      } else {
        setError(result.error);
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (countdown > 0) return;
    setError('');
    setLoading(true);
    try {
      const result = await requestPasswordReset({ email: email.trim() });
      if (result.success) {
        setCountdown(60);
        setOtp(['', '', '', '', '', '']);
        if (result.emailDelivered === false && (result.fallbackResetUrl || result.fallbackCode)) {
          setFallbackData({
            resetUrl: result.fallbackResetUrl,
            code: result.fallbackCode,
          });
        }
      } else {
        setError(result.error);
      }
    } catch {
      setError('Error al reenviar el código');
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = step === 'email' ? 1 : step === 'otp' ? 2 : step === 'newPassword' ? 3 : 4;

  return (
    <div className={styles.authPage}>
      {/* Top Controls */}
      <div className={styles.topControls}>
        <ThemeToggle />
        <Link href="/login" className="btn btn-secondary btn-sm">
          Volver a Login
        </Link>
      </div>

      <div className="ambient-glow">
        <div className="ambient-glow-orb-1" />
        <div className="ambient-glow-orb-2" />
      </div>

      <div className={styles.authContainer}>
        <div className={styles.authLogo}>
          <div className={styles.authLogoBadge}>
            <div className={styles.authLogoIcon}>
              <ShieldCheck size={28} className={styles.shieldIcon} />
            </div>
          </div>
          <h1 className={styles.authTitle}>
            {step === 'success' ? '¡Contraseña Actualizada!' : 'Recuperar Contraseña'}
          </h1>
          <p className={styles.authSubtitle}>
            {step === 'email' &&
              'Ingresa tu correo registrado para enviarte un enlace de restablecimiento y un código de 6 dígitos.'}
            {step === 'otp' &&
              `Ingresa el código de 6 dígitos enviado a ${email} o abre el enlace directo en tu correo.`}
            {step === 'newPassword' &&
              'Configura tu nueva contraseña. Al guardarla, la contraseña anterior será eliminada permanentemente.'}
            {step === 'success' &&
              'Tu contraseña anterior fue eliminada y la nueva contraseña ya está activa.'}
          </p>
        </div>

        <div className={styles.authCard}>
          {/* Step Progress Indicator */}
          {step !== 'success' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem',
                paddingBottom: '0.85rem',
                borderBottom: '1px solid var(--glass-border)',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              {[
                { num: 1, label: '1. Correo' },
                { num: 2, label: '2. Código / Enlace' },
                { num: 3, label: '3. Nueva Clave' },
              ].map((s) => {
                const isActive = stepIndex === s.num;
                const isDone = stepIndex > s.num;
                return (
                  <div
                    key={s.num}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      color: isDone
                        ? 'var(--success-600)'
                        : isActive
                        ? 'var(--primary-600)'
                        : 'var(--text-tertiary)',
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.68rem',
                        background: isDone
                          ? 'var(--success-50)'
                          : isActive
                          ? 'var(--primary-50)'
                          : 'var(--bg-secondary)',
                        border: `1px solid ${
                          isDone
                            ? 'var(--success-500)'
                            : isActive
                            ? 'var(--primary-500)'
                            : 'var(--glass-border)'
                        }`,
                      }}
                    >
                      {isDone ? <Check size={12} /> : s.num}
                    </span>
                    <span>{s.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {error && (
            <div className={styles.authError} role="alert" style={{ marginBottom: 'var(--space-4)' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Fallback Box when SMTP is not configured in .env so user can test link & code immediately */}
          {fallbackData && (step === 'otp' || step === 'newPassword') && (
            <div
              style={{
                background: 'rgba(37, 99, 235, 0.08)',
                border: '1px solid rgba(37, 99, 235, 0.28)',
                borderRadius: 'var(--radius-lg)',
                padding: '0.85rem 1rem',
                marginBottom: '1rem',
                fontSize: '0.78rem',
                color: 'var(--text-primary)',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '0.35rem', color: 'var(--primary-600)' }}>
                📩 Vista previa de correo (Modo sin SMTP configurado):
              </div>
              {fallbackData.code && (
                <div style={{ marginBottom: '0.4rem' }}>
                  Código generado:{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setOtp(fallbackData.code!.split(''));
                    }}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      padding: '0.1rem 0.45rem',
                      borderRadius: '6px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--primary-400)',
                      cursor: 'pointer',
                      color: 'var(--primary-600)',
                    }}
                    title="Clic para autocompletar el código"
                  >
                    {fallbackData.code} (Autocompletar)
                  </button>
                </div>
              )}
              {fallbackData.resetUrl && (
                <div>
                  <a
                    href={fallbackData.resetUrl}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontWeight: 700,
                      color: 'var(--primary-600)',
                      textDecoration: 'underline',
                    }}
                  >
                    <ExternalLink size={13} /> Abrir enlace directo de recuperación
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Email */}
          {step === 'email' && (
            <form className={styles.authForm} onSubmit={handleRequestOTP} id="reset-email-form">
              <div className="input-group">
                <label className="input-label" htmlFor="reset-email">
                  Correo electrónico registrado
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <Mail size={18} />
                  </span>
                  <input
                    id="reset-email"
                    type="email"
                    className="input"
                    placeholder="nombre@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>
              <button
                type="submit"
                className={`btn btn-primary btn-lg w-full ${loading ? styles.btnLoading : ''}`}
                disabled={loading}
                id="reset-submit-email"
              >
                <span>{loading ? 'Enviando enlace y código...' : 'Enviar Enlace y Código'}</span>
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'otp' && (
            <form className={styles.authForm} onSubmit={handleVerifyOTP} id="reset-otp-form">
              {infoMessage && !fallbackData && (
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--success-700)',
                    background: 'var(--success-50)',
                    border: '1px solid var(--success-200)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{infoMessage}</span>
                </div>
              )}

              <div className="input-group" style={{ alignItems: 'center' }}>
                <label className="input-label">Código de verificación de 6 dígitos</label>
                <div
                  style={{
                    display: 'flex',
                    gap: 'clamp(0.25rem, 1.5vw, 0.5rem)',
                    justifyContent: 'center',
                    width: '100%',
                  }}
                  onPaste={handleOtpPaste}
                >
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="input"
                      style={{
                        width: 'clamp(2.35rem, 10vw, 3rem)',
                        height: 'clamp(2.85rem, 12vw, 3.5rem)',
                        textAlign: 'center',
                        fontSize: 'clamp(1.2rem, 5vw, 1.5rem)',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        padding: '0',
                      }}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      id={`otp-digit-${i}`}
                    />
                  ))}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: 'var(--space-2)',
                  }}
                >
                  <KeyRound size={14} style={{ color: 'var(--text-tertiary)' }} />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    {countdown > 0 ? (
                      `Reenviar código y enlace en ${countdown}s`
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={loading}
                        style={{
                          color: 'var(--primary-500)',
                          fontWeight: 700,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 'var(--text-xs)',
                        }}
                      >
                        Reenviar código y enlace al correo
                      </button>
                    )}
                  </span>
                </div>
              </div>
              <button
                type="submit"
                className={`btn btn-primary btn-lg w-full ${loading ? styles.btnLoading : ''}`}
                disabled={loading || otp.join('').length !== 6}
                id="reset-verify-otp"
              >
                <span>{loading ? 'Verificando código...' : 'Verificar Código y Continuar'}</span>
                {!loading && <ArrowRight size={18} />}
              </button>
              <button
                type="button"
                className="btn btn-ghost w-full"
                onClick={() => {
                  setStep('email');
                  setError('');
                }}
              >
                <ArrowLeft size={16} /> Cambiar correo electrónico
              </button>
            </form>
          )}

          {/* Step 3: New Password Form */}
          {step === 'newPassword' && (
            <form className={styles.authForm} onSubmit={handleResetPassword} id="reset-password-form">
              {/* Verification & Old Password Deletion Notice */}
              <div
                style={{
                  background: 'var(--success-50)',
                  border: '1px solid var(--success-200)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.75rem 0.9rem',
                  fontSize: '0.76rem',
                  color: 'var(--success-700)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                  <CheckCircle2 size={15} />
                  <span>
                    {verifiedViaLink
                      ? 'Enlace y código verificados correctamente'
                      : 'Código de seguridad verificado'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', opacity: 0.9 }}>
                  <Trash2 size={13} />
                  <span>
                    Cuenta: <strong>{email}</strong> — Al guardar, tu contraseña anterior será eliminada.
                  </span>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="new-password">
                  Nueva contraseña
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <Lock size={18} />
                  </span>
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    className="input"
                    placeholder="Mínimo 8 caracteres, mayúscula y número"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    style={{ paddingRight: '2.85rem' }}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="input-action-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className={styles.passwordStrength}>
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`${styles.passwordStrengthBar} ${
                        getPasswordStrength() >= level
                          ? getPasswordStrength() <= 2
                            ? styles.active
                            : getPasswordStrength() === 3
                            ? styles.medium
                            : styles.strong
                          : ''
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="confirm-password">
                  Confirmar nueva contraseña
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <Lock size={18} />
                  </span>
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="input"
                    placeholder="Repite la nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    style={{ paddingRight: '2.85rem' }}
                  />
                  <button
                    type="button"
                    className="input-action-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Real-time Robustness Checklist */}
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.75rem 0.9rem',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.35rem 0.75rem',
                  fontSize: '0.72rem',
                }}
              >
                {[
                  { ok: rules.minLength, text: 'Mínimo 8 caracteres' },
                  { ok: rules.hasUpper, text: 'Una letra mayúscula (A-Z)' },
                  { ok: rules.hasLower, text: 'Una letra minúscula (a-z)' },
                  { ok: rules.hasNumber, text: 'Al menos un número (0-9)' },
                  { ok: rules.matchesConfirm, text: 'Las contraseñas coinciden' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      color: item.ok ? 'var(--success-600)' : 'var(--text-tertiary)',
                      fontWeight: item.ok ? 700 : 500,
                      gridColumn: idx === 4 ? '1 / -1' : undefined,
                    }}
                  >
                    <CheckCircle2 size={13} />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className={`btn btn-primary btn-lg w-full ${loading ? styles.btnLoading : ''}`}
                disabled={loading || !isPasswordRobust}
                id="reset-save-password"
              >
                <span>
                  {loading
                    ? 'Eliminando anterior y guardando...'
                    : 'Eliminar Anterior y Guardar Nueva'}
                </span>
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--success-50)',
                  border: '2px solid var(--success-200)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <CheckCircle2 size={32} style={{ color: 'var(--success-600)' }} />
              </div>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--text-sm)',
                  marginBottom: 'var(--space-6)',
                  lineHeight: 1.6,
                }}
              >
                La contraseña anterior de <strong>{email}</strong> fue eliminada y reemplazada de forma
                segura. Ya puedes iniciar sesión con tu nueva contraseña.
              </p>
              <Link href="/login" className="btn btn-primary btn-lg w-full" id="reset-go-login">
                Ir a Iniciar Sesión <ArrowRight size={18} />
              </Link>
            </div>
          )}

          {step !== 'success' && (
            <div className={styles.authFooter}>
              ¿Recuerdas tu contraseña? <Link href="/login">Iniciar Sesión</Link>
            </div>
          )}
        </div>
      </div>

      <footer className={styles.authLegalFooter}>
        © 2026 Anedcode S.A. Todos los derechos reservados. - Fin593 es una marca registrada en Ecuador.
      </footer>
    </div>
  );
}

export default function RecuperarPasswordPage() {
  return (
    <Suspense fallback={<div className={styles.authPage} />}>
      <RecuperarPasswordContent />
    </Suspense>
  );
}
