import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AuthProvider from '@/components/AuthProvider';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';
import { LayoutDashboard, Users, ScrollText, ArrowLeft, ShieldCheck } from 'lucide-react';
import './admin.module.css';

export const metadata = {
  title: 'Admin Master — Fin593',
  description: 'Consola de Administración y Gestión Fin593',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <AuthProvider>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-deep)' }}>
        {/* Admin Sidebar */}
        <aside style={{
          width: '240px',
          background: 'var(--bg-primary)',
          borderRight: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 300,
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{
            padding: '1.25rem',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, var(--accent-500), var(--primary-600))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'var(--shadow-glow-accent)',
              }}>
                <ShieldCheck size={20} style={{ color: '#fff' }} />
              </div>
              <div>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', lineHeight: 1.2 }}>
                  Admin Master
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--accent-600)', fontWeight: 700, display: 'block' }}>
                  Fin593 Enterprise
                </span>
              </div>
            </div>
            <ThemeToggle />
          </div>

          <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 0.75rem', marginBottom: '0.5rem' }}>
              Administración
            </span>
            <AdminNavLink href="/admin" icon={<LayoutDashboard size={18} />} label="Dashboard General" />
            <AdminNavLink href="/admin/usuarios" icon={<Users size={18} />} label="Gestión de Usuarios" />
            <AdminNavLink href="/admin/auditoria" icon={<ScrollText size={18} />} label="Bitácora de Auditoría" />
          </nav>

          <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)' }}>
            <Link
              href="/dashboard"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-lg)',
                color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600,
                textDecoration: 'none', transition: 'all 0.15s',
                border: '1px solid var(--glass-border)',
                background: 'var(--bg-secondary)',
              }}
            >
              <ArrowLeft size={16} />
              <span>Volver a la App</span>
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, marginLeft: '240px', minHeight: '100vh' }}>
          <div style={{ padding: 'var(--space-8)', maxWidth: '1200px', margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>
    </AuthProvider>
  );
}

function AdminNavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-lg)',
        color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500,
        textDecoration: 'none', transition: 'all 0.15s',
      }}
    >
      <span style={{ display: 'flex', color: 'var(--text-tertiary)' }}>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
