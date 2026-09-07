'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';
import styles from '../auth.module.css';

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
        setError('Correo o contraseña incorrectos');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('demo@finanzapp.ec');
    setPassword('Demo1234');
    setError('');
  };

  return (
    <div className={styles.authPage}>
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
          <h1 className={styles.authTitle}>FinanzApp</h1>
          <p className={styles.authSubtitle}>
            Gestión financiera inteligente para Ecuador. Salario neto, IESS, deudas y metas de ahorro.
          </p>
        </div>

        <div className={styles.authCard}>
          {/* Quick Demo Access Bar */}
          <button
            type="button"
            onClick={handleFillDemo}
            className={styles.demoFillBtn}
            title="Autocompletar con usuario de prueba"
          >
            <Sparkles size={15} className={styles.demoSparkle} />
            <span>Acceso rápido: <strong>demo@finanzapp.ec</strong></span>
          </button>

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
            <Link href="/registro">Regístrate gratis</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
