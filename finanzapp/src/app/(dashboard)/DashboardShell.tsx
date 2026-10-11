'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  ReceiptText,
  PiggyBank,
  HelpCircle,
  Bell,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import styles from './dashboard.module.css';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/ingresos', label: 'Ingresos', icon: Wallet },
  { href: '/dashboard/deudas', label: 'Deudas', icon: CreditCard },
  { href: '/dashboard/gastos', label: 'Gastos', icon: ReceiptText },
];

const NAV_TOOLS = [
  { href: '/dashboard/ia', label: 'Fin593 AI Asesor', icon: Sparkles, highlight: true },
  { href: '/dashboard/consultar', label: '¿Puedo comprarlo?', icon: HelpCircle },
  { href: '/dashboard/ahorro', label: 'Plan de Ahorro', icon: PiggyBank },
  { href: '/dashboard/reportes', label: 'Reportes & PDF', icon: FileSpreadsheet },
  { href: '/dashboard/notificaciones', label: 'Notificaciones', icon: Bell },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'US';

  const getPageTitle = () => {
    const routes: Record<string, { title: string; subtitle: string; shortTitle: string }> = {
      '/dashboard': { title: 'Centro de Inteligencia Financiera', shortTitle: 'Dashboard', subtitle: 'Diagnóstico en tiempo real y plan de acción de hoy' },
      '/dashboard/ingresos': { title: 'Ingresos & Rol de Pagos', shortTitle: 'Ingresos', subtitle: 'Salario neto, aportes IESS (9.45%) y descuentos' },
      '/dashboard/deudas': { title: 'Gestión de Obligaciones & Deudas', shortTitle: 'Deudas', subtitle: 'Amortización bancaria, SUPA, cooperativas e informales' },
      '/dashboard/gastos': { title: 'Control Inteligente de Gastos', shortTitle: 'Gastos', subtitle: 'Clasificación de costos fijos, variables y análisis de desvíos' },
      '/dashboard/ia': { title: 'Fin593 AI — Asesor Financiero', shortTitle: 'Fin593 AI', subtitle: 'Diagnóstico explicable, simulador de crédito y recomendaciones' },
      '/dashboard/ahorro': { title: 'Plan de Ahorro & Metas', shortTitle: 'Ahorro', subtitle: 'Fondo de emergencia (3 meses) y metas a futuro' },
      '/dashboard/consultar': { title: '¿Puedo comprarlo?', shortTitle: 'Consultar', subtitle: 'Asesor de impacto sobre excedente y flujo libre' },
      '/dashboard/reportes': { title: 'Centro de Reportes & PDF', shortTitle: 'Reportes', subtitle: 'Descarga de balances ejecutivos, flujo de caja y CSV' },
      '/dashboard/notificaciones': { title: 'Centro de Alertas & Notificaciones', shortTitle: 'Alertas', subtitle: 'Vencimientos críticos, desvíos y seguridad' },
      '/dashboard/perfil': { title: 'Mi Perfil Financiero', shortTitle: 'Mi Perfil', subtitle: 'Parámetros de nómina, corte y seguridad de cuenta' },
    };
    return routes[pathname] || { title: 'Fin593', shortTitle: 'Fin593', subtitle: 'Finanzas Inteligentes para Ecuador' };
  };

  const pageInfo = getPageTitle();

  return (
    <div className={styles.dashboardLayout}>
      {/* Sidebar Overlay (mobile) */}
      <div
        className={`${styles.sidebarOverlay} ${sidebarOpen ? styles.sidebarOverlayActive : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar Desktop & Drawer Mobile */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoBadge}>
            <ShieldCheck size={22} className={styles.logoIcon} />
          </div>
          <div>
            <span className={styles.sidebarTitle}>Fin593</span>
            <span className={styles.sidebarSubtitle}>Ecuador (USD)</span>
          </div>
          <button
            className={styles.closeSidebarBtn}
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          <div className={styles.navSectionLabel}>Principal</div>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className={styles.navLinkIconWrapper}>
                  <Icon size={18} />
                </span>
                <span className={styles.navLinkLabel}>{item.label}</span>
                {isActive && <ChevronRight size={14} className={styles.navLinkArrow} />}
              </Link>
            );
          })}

          <div className={styles.sidebarSection}>
            <div className={styles.navSectionLabel}>Herramientas</div>
            {NAV_TOOLS.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className={styles.navLinkIconWrapper}>
                    <Icon size={18} />
                  </span>
                  <span className={styles.navLinkLabel}>{item.label}</span>
                  {'badge' in item && typeof item.badge === 'number' && item.badge > 0 && (
                    <span className={styles.navLinkBadge}>{item.badge}</span>
                  )}
                  {isActive && <ChevronRight size={14} className={styles.navLinkArrow} />}
                </Link>
              );
            })}
          </div>

          {user?.role === 'ADMIN' && (
            <div className={styles.sidebarSection}>
              <div className={styles.navSectionLabel}>Administración</div>
              <Link
                href="/admin"
                className={`${styles.navLink} ${pathname.startsWith('/admin') ? styles.navLinkActive : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className={styles.navLinkIconWrapper} style={{ color: 'var(--accent-500)' }}>
                  <ShieldCheck size={18} />
                </span>
                <span className={styles.navLinkLabel} style={{ fontWeight: 700, color: 'var(--accent-600)' }}>
                  Panel Admin
                </span>
                <ChevronRight size={14} className={styles.navLinkArrow} />
              </Link>
            </div>
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/dashboard/perfil" className={styles.userInfo} onClick={() => setSidebarOpen(false)}>
            <div className={styles.userAvatar}>{initials}</div>
            <div className={styles.userDetails}>
              <div className={styles.userName}>{user?.name || 'Usuario'}</div>
              <div className={styles.userEmail}>{user?.email || 'usuario@fin593.ec'}</div>
            </div>
          </Link>
          <button
            className={styles.logoutBtn}
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Cerrar sesión"
          >
            <LogOut size={16} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Top Header Bar */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button
              className={styles.menuToggle}
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={22} />
            </button>
            <div className={styles.topBarTitleWrapper}>
              <h1 className={styles.topBarTitle}>
                <span className={styles.titleDesktop}>{pageInfo.title}</span>
                <span className={styles.titleMobile}>{pageInfo.shortTitle}</span>
              </h1>
              <p className={styles.topBarSubtitle}>{pageInfo.subtitle}</p>
            </div>
          </div>

          <div className={styles.topBarActions}>
            <div className={styles.currencyBadge}>
              <span className={styles.currencyDot} />
              <span>USD ($)</span>
            </div>
            <ThemeToggle />
            <Link href="/dashboard/perfil" className={styles.topBarProfile} aria-label="Mi Perfil">
              <div className={styles.userAvatarSm}>{initials}</div>
            </Link>
          </div>
        </header>

        {/* Page Body */}
        <div className={styles.pageContent}>
          {children}
        </div>

        <footer className={styles.dashboardFooter}>
          © 2026 Anedcode S.A. Todos los derechos reservados. - Fin593 es una marca registrada en Ecuador.
        </footer>
      </main>

      {/* Bottom Navigation for Mobile (Sticky Bottom Bar) */}
      <nav className="bottom-nav" aria-label="Navegación móvil">
        <Link
          href="/dashboard"
          className={`bottom-nav-item ${pathname === '/dashboard' ? 'active' : ''}`}
        >
          <div className="bottom-nav-icon">
            <LayoutDashboard size={20} />
          </div>
          <span>Inicio</span>
        </Link>
        <Link
          href="/dashboard/ingresos"
          className={`bottom-nav-item ${pathname === '/dashboard/ingresos' ? 'active' : ''}`}
        >
          <div className="bottom-nav-icon">
            <Wallet size={20} />
          </div>
          <span>Ingresos</span>
        </Link>
        <Link
          href="/dashboard/deudas"
          className={`bottom-nav-item ${pathname === '/dashboard/deudas' ? 'active' : ''}`}
        >
          <div className="bottom-nav-icon">
            <CreditCard size={20} />
          </div>
          <span>Deudas</span>
        </Link>
        <Link
          href="/dashboard/gastos"
          className={`bottom-nav-item ${pathname === '/dashboard/gastos' ? 'active' : ''}`}
        >
          <div className="bottom-nav-icon">
            <ReceiptText size={20} />
          </div>
          <span>Gastos</span>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className={`bottom-nav-item ${sidebarOpen ? 'active' : ''}`}
          style={{ background: 'none', border: 'none' }}
        >
          <div className="bottom-nav-icon">
            <Menu size={20} />
          </div>
          <span>Más</span>
        </button>
      </nav>
    </div>
  );
}
