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
  User,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import styles from './dashboard.module.css';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/ingresos', label: 'Ingresos', icon: Wallet },
  { href: '/dashboard/deudas', label: 'Deudas', icon: CreditCard },
  { href: '/dashboard/gastos', label: 'Gastos', icon: ReceiptText },
];

const NAV_TOOLS = [
  { href: '/dashboard/ahorro', label: 'Plan de Ahorro', icon: PiggyBank },
  { href: '/dashboard/consultar', label: '¿Puedo comprarlo?', icon: HelpCircle },
  { href: '/dashboard/alertas', label: 'Alertas', icon: Bell, badge: 0 },
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
    const routes: Record<string, { title: string; subtitle: string }> = {
      '/dashboard': { title: 'Dashboard General', subtitle: 'Panorama financiero mensual' },
      '/dashboard/ingresos': { title: 'Ingresos & Rol de Pagos', subtitle: 'Salario, IESS y aportes' },
      '/dashboard/deudas': { title: 'Gestión de Deudas', subtitle: 'Estrategias de amortización y pagos' },
      '/dashboard/gastos': { title: 'Control de Gastos', subtitle: 'Clasificación de costos fijos y variables' },
      '/dashboard/ahorro': { title: 'Plan de Ahorro', subtitle: 'Fondo de emergencia y metas' },
      '/dashboard/consultar': { title: '¿Puedo comprarlo?', subtitle: 'Asesor inteligente de compra previa' },
      '/dashboard/alertas': { title: 'Alertas y Recordatorios', subtitle: 'Vencimientos y sobregiros' },
      '/dashboard/perfil': { title: 'Mi Perfil', subtitle: 'Configuración de cuenta' },
    };
    return routes[pathname] || { title: 'FinanzApp', subtitle: 'Finanzas Personales' };
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
            <span className={styles.sidebarTitle}>FinanzApp</span>
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
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/dashboard/perfil" className={styles.userInfo} onClick={() => setSidebarOpen(false)}>
            <div className={styles.userAvatar}>{initials}</div>
            <div className={styles.userDetails}>
              <div className={styles.userName}>{user?.name || 'Usuario'}</div>
              <div className={styles.userEmail}>{user?.email || 'demo@finanzapp.ec'}</div>
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
          <div className="flex items-center gap-3">
            <button
              className={styles.menuToggle}
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 className={styles.topBarTitle}>{pageInfo.title}</h1>
              <p className={styles.topBarSubtitle}>{pageInfo.subtitle}</p>
            </div>
          </div>

          <div className={styles.topBarActions}>
            <div className={styles.currencyBadge}>
              <span className={styles.currencyDot} />
              <span>USD ($)</span>
            </div>
            <Link href="/dashboard/perfil" className={styles.topBarProfile}>
              <div className={styles.userAvatarSm}>{initials}</div>
            </Link>
          </div>
        </header>

        {/* Page Body */}
        <div className={styles.pageContent}>
          {children}
        </div>
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
