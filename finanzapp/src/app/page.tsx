import Link from 'next/link';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <div className={styles.landing}>
      {/* Hero Section */}
      <header className={styles.hero}>
        <div className={styles.heroBackground} />
        <nav className={styles.nav}>
          <div className={styles.navBrand}>
            <span className={styles.navLogo}>💰</span>
            <span className={styles.navTitle}>FinanzApp</span>
          </div>
          <div className={styles.navActions}>
            <Link href="/login" className="btn btn-ghost">
              Iniciar Sesión
            </Link>
            <Link href="/registro" className="btn btn-primary">
              Empezar Gratis
            </Link>
          </div>
        </nav>

        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Toma el control de{' '}
            <span className={styles.heroHighlight}>tus finanzas</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Registra tu salario, gestiona deudas, controla gastos y recibe asesoría financiera 
            automatizada. Diseñado para trabajadores en Ecuador con cálculos IESS incluidos.
          </p>
          <div className={styles.heroCta}>
            <Link href="/registro" className="btn btn-primary btn-lg">
              🚀 Crear Cuenta Gratis
            </Link>
            <Link href="/login" className="btn btn-secondary btn-lg">
              Ya tengo cuenta
            </Link>
          </div>
        </div>

        {/* Feature cards */}
        <div className={styles.features}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📊</div>
            <h3 className={styles.featureTitle}>Salario Neto Real</h3>
            <p className={styles.featureDesc}>
              Calcula tu ingreso real con descuentos IESS, quirografarios y más.
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎯</div>
            <h3 className={styles.featureTitle}>Prioriza Deudas</h3>
            <p className={styles.featureDesc}>
              Métodos Avalancha y Bola de Nieve para pagar deudas de forma inteligente.
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🛡️</div>
            <h3 className={styles.featureTitle}>Plan de Ahorro</h3>
            <p className={styles.featureDesc}>
              Fondo de emergencia y metas personalizadas con simulador incluido.
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🤔</div>
            <h3 className={styles.featureTitle}>¿Puedo comprarlo?</h3>
            <p className={styles.featureDesc}>
              Evalúa compras contra tu realidad financiera con respuesta instantánea.
            </p>
          </div>
        </div>
      </header>
    </div>
  );
}
