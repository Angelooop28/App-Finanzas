'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import styles from '../auth.module.css';

export default function RegistroPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const getPasswordStrength = (pwd: string): number => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    try {
      const response = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          setFieldErrors(data.details);
        } else {
          setError(data.error || 'Error al crear la cuenta');
        }
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 1800);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.authPage}>
        <div className={styles.topControls}>
          <ThemeToggle />
        </div>
        <div className="ambient-glow">
          <div className="ambient-glow-orb-1" />
          <div className="ambient-glow-orb-2" />
        </div>
        <div className={styles.authContainer}>
          <div className={styles.authLogo}>
            <div className={styles.authLogoBadge}>
              <div className={styles.authLogoIcon} style={{ background: 'linear-gradient(135deg, var(--success-500), var(--success-700))' }}>
                <CheckCircle2 size={32} color="white" />
              </div>
            </div>
            <h1 className={styles.authTitle}>¡Bienvenido a Fin593!</h1>
            <p className={styles.authSubtitle}>
              Tu cuenta ha sido creada exitosamente. Redirigiendo al inicio de sesión...
            </p>
          </div>
          <div className={styles.authCard}>
            <div className={styles.authSuccess}>
              <CheckCircle2 size={18} />
              <span>Registro completado con éxito. Redirigiendo...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authPage}>
      {/* Top Controls */}
      <div className={styles.topControls}>
        <ThemeToggle />
        <Link href="/" className="btn btn-secondary btn-sm">
          Inicio
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
          <h1 className={styles.authTitle}>Crear Cuenta Fin593</h1>
          <p className={styles.authSubtitle}>
            Toma el control de tu salario neto, IESS (9.45%) y deudas en Ecuador.
          </p>
        </div>

        <div className={styles.authCard}>
          <form className={styles.authForm} onSubmit={handleSubmit} id="register-form">
            {error && (
              <div className={styles.authError} role="alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="input-group">
              <label className="input-label" htmlFor="register-name">
                Nombre completo
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <User size={18} />
                </span>
                <input
                  id="register-name"
                  type="text"
                  className="input"
                  placeholder="Juan Pérez"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  required
                  autoFocus
                />
              </div>
              {fieldErrors.name && (
                <span style={{ color: 'var(--danger-600)', fontSize: '0.75rem', marginTop: '0.2rem' }}>{fieldErrors.name[0]}</span>
              )}
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="register-email">
                Correo electrónico
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Mail size={18} />
                </span>
                <input
                  id="register-email"
                  type="email"
                  className="input"
                  placeholder="nombre@correo.com"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              {fieldErrors.email && (
                <span style={{ color: 'var(--danger-600)', fontSize: '0.75rem', marginTop: '0.2rem' }}>{fieldErrors.email[0]}</span>
              )}
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="register-password">
                Contraseña
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Lock size={18} />
                </span>
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  required
                  autoComplete="new-password"
                  style={{ paddingRight: '2.85rem' }}
                />
                <button
                  type="button"
                  className="input-action-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formData.password && (
                <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                  {[1, 2, 3, 4].map(level => (
                    <div
                      key={level}
                      style={{
                        flex: 1,
                        height: 3,
                        borderRadius: '4px',
                        background: passwordStrength >= level
                          ? passwordStrength <= 1
                            ? 'var(--danger-500)'
                            : passwordStrength <= 2
                              ? 'var(--warning-500)'
                              : 'var(--success-500)'
                          : 'var(--bg-tertiary)',
                        transition: 'background 0.2s',
                      }}
                    />
                  ))}
                </div>
              )}
              {fieldErrors.password && (
                <span style={{ color: 'var(--danger-600)', fontSize: '0.75rem', marginTop: '0.2rem' }}>{fieldErrors.password[0]}</span>
              )}
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="register-confirm">
                Confirmar contraseña
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Lock size={18} />
                </span>
                <input
                  id="register-confirm"
                  type="password"
                  className="input"
                  placeholder="Repite tu contraseña"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              {fieldErrors.confirmPassword && (
                <span style={{ color: 'var(--danger-600)', fontSize: '0.75rem', marginTop: '0.2rem' }}>{fieldErrors.confirmPassword[0]}</span>
              )}
            </div>

            <button
              type="submit"
              className={`btn btn-primary btn-lg w-full ${loading ? styles.btnLoading : ''}`}
              disabled={loading}
              id="register-submit"
            >
              <span>{loading ? 'Creando cuenta...' : 'Crear Cuenta'}</span>
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className={styles.authFooter}>
            ¿Ya tienes cuenta?{' '}
            <Link href="/login">Inicia sesión en Fin593</Link>
          </div>
        </div>
      </div>

      <footer className={styles.authLegalFooter}>
        © 2026 Anedcode S.A. Todos los derechos reservados. - Fin593 es una marca registrada en Ecuador.
      </footer>
    </div>
  );
}
