import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import {
  ShieldCheck,
  TrendingUp,
  Wallet,
  CreditCard,
  PiggyBank,
  CheckCircle2,
  ArrowRight,
  Calculator,
  Lock,
  Sparkles,
} from 'lucide-react';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <div className={styles.landing}>
      {/* Ambient background glow */}
      <div className="ambient-glow">
        <div className="ambient-glow-orb-1" />
        <div className="ambient-glow-orb-2" />
      </div>

      {/* Top Navigation */}
      <header className={styles.nav}>
        <div className={styles.navBrand}>
          <div className={styles.navLogoBadge} style={{ overflow: 'hidden' }}>
            <img src="/logo.jpg" alt="Fin593 Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div className={styles.navBrandMeta}>
            <span className={styles.navTitle}>Fin593</span>
            <span className={styles.navCountryBadge}>Ecuador 🇪🇨 (USD)</span>
          </div>
        </div>

        <div className={styles.navActions}>
          <ThemeToggle />
          <Link href="/login" className={`btn btn-secondary btn-sm ${styles.navLoginBtn}`}>
            <span>Iniciar Sesión</span>
          </Link>
          <Link href="/registro" className={`btn btn-primary btn-sm ${styles.navRegisterBtn}`}>
            <span className={styles.registerBtnTextFull}>Empezar Gratis</span>
            <span className={styles.registerBtnTextShort}>Empezar</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className={styles.hero}>
        <div className={styles.heroGrid}>
          {/* Left Column: Headlines & CTA */}
          <div>
            <div className={styles.heroTagline}>
              <Sparkles size={14} />
              <span>Plataforma Financiera Inteligente de Ecuador</span>
            </div>

            <h1 className={styles.heroTitle}>
              Toma el control absoluto de{' '}
              <span className={styles.heroHighlight}>tu dinero</span>
            </h1>

            <p className={styles.heroSubtitle}>
              Calcula tu salario neto real con aportes al <strong>IESS (9.45%)</strong>, liquida deudas con estrategias matemáticas y optimiza tu ahorro con la regla 50/30/20.
            </p>

            <div className={styles.heroCta}>
              <Link href="/registro" className="btn btn-primary btn-lg">
                <span>Crear Cuenta en Fin593</span>
                <ArrowRight size={18} />
              </Link>
              <Link href="/login" className="btn btn-secondary btn-lg">
                Acceder a mi Panel
              </Link>
            </div>

            <div className={styles.heroStats}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>9.45%</span>
                <span className={styles.statLabel}>IESS Personal Oficial</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>50/30/20</span>
                <span className={styles.statLabel}>Regla Presupuestaria</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>100% USD</span>
                <span className={styles.statLabel}>Moneda Ecuatoriana</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Card Teaser */}
          <div>
            <div className={styles.heroCard}>
              <div className={styles.heroCardHeader}>
                <div className={styles.heroCardTitle}>
                  <Calculator size={18} style={{ color: 'var(--brand-navy-600)' }} />
                  <span>Simulador de Salario Neto</span>
                </div>
                <div className={styles.liveBadge}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success-500)' }} />
                  <span>En vivo</span>
                </div>
              </div>

              {/* Sample Calculation Box */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Salario Bruto Mensual:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-primary)' }}>$1,200.00</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', background: 'var(--danger-50)', borderRadius: 'var(--radius-lg)', color: 'var(--danger-700)' }}>
                  <span style={{ fontSize: '0.85rem' }}>(-) Descuento IESS (9.45%):</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>-$113.40</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', background: 'var(--warning-50)', borderRadius: 'var(--radius-lg)', color: 'var(--warning-700)' }}>
                  <span style={{ fontSize: '0.85rem' }}>(-) Préstamo Quirografario IESS:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>-$85.00</span>
                </div>

                <div style={{ borderTop: '2px dashed var(--glass-border)', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                      Salario Neto Disponible
                    </span>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--success-600)' }}>
                      $1,001.60
                    </div>
                  </div>
                  <Link href="/registro" className="btn btn-primary btn-sm">
                    Probar con mi sueldo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Core Features Grid */}
      <section className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            Diseñado para la realidad económica de Ecuador
          </h2>
          <p className={styles.sectionSubtitle}>
            Herramientas financieras especializadas para trabajadores, emprendedores y familias en Ecuador.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          {/* Feature 1 */}
          <div className={styles.featureCard}>
            <div className={styles.featureIconBox} style={{ background: 'var(--success-50)', color: 'var(--success-600)' }}>
              <Wallet size={24} />
            </div>
            <h3 className={styles.featureTitle}>Rol de Pagos & IESS</h3>
            <p className={styles.featureDesc}>
              Cálculo automatizado de aportes personales al IESS, préstamos quirografarios, hipotecarios y fondos de reserva.
            </p>
          </div>

          {/* Feature 2 */}
          <div className={styles.featureCard}>
            <div className={styles.featureIconBox} style={{ background: 'var(--danger-50)', color: 'var(--danger-600)' }}>
              <CreditCard size={24} />
            </div>
            <h3 className={styles.featureTitle}>Estrategia de Deudas</h3>
            <p className={styles.featureDesc}>
              Prioriza tus tarjetas de crédito y préstamos con los métodos Avalancha (menor interés) y Bola de Nieve (mayor motivación).
            </p>
          </div>

          {/* Feature 3 */}
          <div className={styles.featureCard}>
            <div className={styles.featureIconBox} style={{ background: 'var(--warning-50)', color: 'var(--warning-600)' }}>
              <PiggyBank size={24} />
            </div>
            <h3 className={styles.featureTitle}>Fondo de Emergencia</h3>
            <p className={styles.featureDesc}>
              Construye un colchón financiero blindado de 3 a 6 meses de costos fijos y visualiza tu avance en tiempo real.
            </p>
          </div>

          {/* Feature 4 */}
          <div className={styles.featureCard}>
            <div className={styles.featureIconBox} style={{ background: 'var(--info-50)', color: 'var(--info-600)' }}>
              <TrendingUp size={24} />
            </div>
            <h3 className={styles.featureTitle}>¿Puedo Comprarlo?</h3>
            <p className={styles.featureDesc}>
              Asesor inteligente antes de gastar. Analiza tu liquidez del mes y te dice de inmediato si la compra compromete tus metas.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div>
          <strong>Fin593</strong> • Inteligencia Financiera Personal para Ecuador (USD)
        </div>
        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.8 }}>
          © 2026 Anedcode S.A. Todos los derechos reservados. - Fin593 es una marca registrada en Ecuador.
        </div>
      </footer>
    </div>
  );
}
