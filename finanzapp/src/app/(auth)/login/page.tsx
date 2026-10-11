'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';
import styles from '../auth.module.css';

// Inlined at build time by Next.js; false in production builds.
const IS_DEV = process.env.NODE_ENV === 'development';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: email.toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Correo o contraseña incorrectos o cuenta bloqueada');
      } else {
        const res = await fetch('/api/auth/session');
        const session = await res.json();
        if (session?.user?.role === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      }
    } catch {
      setError('Error de conexión con el servidor. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillAdmin = () => {
    if (!IS_DEV) return;
    setEmail('admin@finanzapp.ec');
    setPassword(IS_DEV ? 'Admin1234' : '');
    setError('');
  };

  return (
    <div className={styles.authPage}>
      {/* Top Controls (Theme Toggle & Home Link) */}
      <div className={styles.topControls}>
        <ThemeToggle />
        <Link href="/" className="btn btn-secondary btn-sm">
          Inicio
        </Link>
      </div>

      {/* Ambient background glow */}
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
          <h1 className={styles.authTitle}>Fin593</h1>
          <p className={styles.authSubtitle}>
            Inteligencia financiera para Ecuador. Salario neto, IESS (9.45%), deudas y metas de ahorro.
          </p>
        </div>

        <div className={styles.authCard}>
          {/* Quick Admin Access Bar — development only, never shipped to production */}
          {IS_DEV && (
            <button
              type="button"
              onClick={handleFillAdmin}
              className={styles.demoFillBtn}
              title="Autocompletar con usuario Administrador (solo desarrollo)"
            >
              <Sparkles size={15} className={styles.demoSparkle} />
              <span>Acceso Admin (dev): <strong>admin@finanzapp.ec</strong></span>
            </button>
          )}

          <form className={styles.authForm} onSubmit={handleSubmit} id="login-form">
            {error && (
              <div className={styles.authError} role="alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="input-group">
              <label className="input-label" htmlFor="login-email">
                Correo electrónico
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Mail size={18} />
                </span>
                <input
                  id="login-email"
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

            <div className="input-group">
              <div className="flex justify-between items-center">
                <label className="input-label" htmlFor="login-password">
                  Contraseña
                </label>
                <Link
                  href="/recuperar-password"
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--brand-navy-600)',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                  className="hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Lock size={18} />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
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
            </div>

            <button
              type="submit"
              className={`btn btn-primary btn-lg w-full ${loading ? styles.btnLoading : ''}`}
              disabled={loading}
              id="login-submit"
            >
              <span>{loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}</span>
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className={styles.authFooter}>
            ¿No tienes cuenta?{' '}
            <Link href="/registro">Regístrate en Fin593 gratis</Link>
          </div>
        </div>
      </div>

      <footer className={styles.authLegalFooter}>
        © 2026 Anedcode S.A. Todos los derechos reservados. - Fin593 es una marca registrada en Ecuador.
      </footer>
    </div>
  );
}
