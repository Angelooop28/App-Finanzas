'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Mail, KeyRound, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { requestPasswordReset, verifyOTP, resetPassword } from '@/lib/actions/password-reset';
import ThemeToggle from '@/components/ThemeToggle';
import styles from '../auth.module.css';

type Step = 'email' | 'otp' | 'newPassword' | 'success';

export default function RecuperarPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Step 1: Request OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await requestPasswordReset({ email });
      if (result.success) {
        setStep('otp');
        setCountdown(60);
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
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
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
      const result = await verifyOTP({ email, code });
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

  // Step 3: Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      const code = otp.join('');
      const result = await resetPassword({ email, code, newPassword, confirmPassword });
      if (result.success) {
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
      const result = await requestPasswordReset({ email });
      if (result.success) {
        setCountdown(60);
        setOtp(['', '', '', '', '', '']);
      } else {
        setError(result.error);
      }
    } catch {
      setError('Error al reenviar el código');
    } finally {
      setLoading(false);
    }
  };

  // Password strength
  const getPasswordStrength = () => {
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    return score;
  };

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
            {step === 'success' ? '¡Listo!' : 'Recuperar Contraseña'}
          </h1>
          <p className={styles.authSubtitle}>
            {step === 'email' && 'Ingresa tu correo y te enviaremos un código de verificación.'}
            {step === 'otp' && `Enviamos un código de 6 dígitos a ${email}`}
            {step === 'newPassword' && 'Crea una nueva contraseña segura para tu cuenta.'}
            {step === 'success' && 'Tu contraseña ha sido actualizada exitosamente.'}
          </p>
        </div>

        <div className={styles.authCard}>
          {error && (
            <div className={styles.authError} role="alert" style={{ marginBottom: 'var(--space-4)' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Email */}
          {step === 'email' && (
            <form className={styles.authForm} onSubmit={handleRequestOTP} id="reset-email-form">
              <div className="input-group">
                <label className="input-label" htmlFor="reset-email">Correo electrónico</label>
                <div className="input-wrapper">
                  <span className="input-icon"><Mail size={18} /></span>
                  <input
                    id="reset-email"
                    type="email"
                    className="input"
                    placeholder="nombre@correo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
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
                <span>{loading ? 'Enviando...' : 'Enviar Código'}</span>
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'otp' && (
            <form className={styles.authForm} onSubmit={handleVerifyOTP} id="reset-otp-form">
              <div className="input-group" style={{ alignItems: 'center' }}>
                <label className="input-label">Código de verificación</label>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }} onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="input"
                      style={{
                        width: '3rem',
                        height: '3.5rem',
                        textAlign: 'center',
                        fontSize: 'var(--text-2xl)',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        padding: '0',
                      }}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      id={`otp-digit-${i}`}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 'var(--space-2)' }}>
                  <KeyRound size={14} style={{ color: 'var(--text-tertiary)' }} />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    {countdown > 0
                      ? `Reenviar código en ${countdown}s`
                      : (
                        <button type="button" onClick={handleResend} disabled={loading} style={{ color: 'var(--primary-500)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-xs)' }}>
                          Reenviar código
                        </button>
                      )
                    }
                  </span>
                </div>
              </div>
              <button
                type="submit"
                className={`btn btn-primary btn-lg w-full ${loading ? styles.btnLoading : ''}`}
                disabled={loading || otp.join('').length !== 6}
                id="reset-verify-otp"
              >
                <span>{loading ? 'Verificando...' : 'Verificar Código'}</span>
                {!loading && <ArrowRight size={18} />}
              </button>
              <button type="button" className="btn btn-ghost w-full" onClick={() => { setStep('email'); setError(''); }}>
                <ArrowLeft size={16} /> Cambiar correo
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 'newPassword' && (
            <form className={styles.authForm} onSubmit={handleResetPassword} id="reset-password-form">
              <div className="input-group">
                <label className="input-label" htmlFor="new-password">Nueva contraseña</label>
                <div className="input-wrapper">
                  <span className="input-icon"><Lock size={18} /></span>
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    className="input"
                    placeholder="Mínimo 8 caracteres"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
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
                  {[1, 2, 3, 4].map(level => (
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
                <label className="input-label" htmlFor="confirm-password">Confirmar contraseña</label>
                <div className="input-wrapper">
                  <span className="input-icon"><Lock size={18} /></span>
                  <input
                    id="confirm-password"
                    type="password"
                    className="input"
                    placeholder="Repite la contraseña"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <button
                type="submit"
                className={`btn btn-primary btn-lg w-full ${loading ? styles.btnLoading : ''}`}
                disabled={loading || newPassword.length < 8}
                id="reset-save-password"
              >
                <span>{loading ? 'Guardando...' : 'Guardar Nueva Contraseña'}</span>
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'var(--success-50)', border: '2px solid var(--success-200)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 'var(--space-4)'
              }}>
                <CheckCircle2 size={32} style={{ color: 'var(--success-600)' }} />
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)', lineHeight: 1.6 }}>
                Tu contraseña ha sido actualizada. Ya puedes iniciar sesión con tu nueva contraseña.
              </p>
              <Link href="/login" className="btn btn-primary btn-lg w-full" id="reset-go-login">
                Ir a Iniciar Sesión <ArrowRight size={18} />
              </Link>
            </div>
          )}

          {step !== 'success' && (
            <div className={styles.authFooter}>
              ¿Recuerdas tu contraseña?{' '}
              <Link href="/login">Iniciar Sesión</Link>
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
