import { getAdminDashboardData } from '@/lib/actions/admin';
import {
  Users,
  UserCheck,
  UserX,
  CreditCard,
  PiggyBank,
  ScrollText,
  DollarSign,
  TrendingUp,
  Crown,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  const userKpis = [
    { label: 'Total Clientes', value: data.totalUsers, icon: Users, color: 'var(--primary-600)', bg: 'var(--primary-50)' },
    { label: 'Cuentas Activas', value: data.activeUsers, icon: UserCheck, color: 'var(--success-600)', bg: 'var(--success-50)' },
    { label: 'Cuentas Bloqueadas', value: data.blockedUsers, icon: UserX, color: 'var(--danger-600)', bg: 'var(--danger-50)' },
    { label: 'Planes Pro (SaaS)', value: data.proPlanUsers, icon: Crown, color: 'var(--warning-600)', bg: 'var(--warning-50)' },
  ];

  const financialKpis = [
    {
      label: 'Deuda Bajo Gestión',
      value: `$${data.totalDebtOwed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `${data.totalDebts} deudas registradas`,
      icon: CreditCard,
      color: 'var(--danger-600)',
      bg: 'var(--danger-50)',
    },
    {
      label: 'Cuotas Mensuales Deuda',
      value: `$${data.totalMonthlyDebtPayments.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mes`,
      subtitle: 'Flujo mensual amortizado',
      icon: TrendingUp,
      color: 'var(--warning-600)',
      bg: 'var(--warning-50)',
    },
    {
      label: 'Volumen Total Ahorros',
      value: `$${data.totalSavingsAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `${data.totalSavingsGoals} metas de ahorro`,
      icon: PiggyBank,
      color: 'var(--success-600)',
      bg: 'var(--success-50)',
    },
  ];

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
            Centro de Control — Administración
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
            Supervisión global de clientes, estado financiero del sistema y seguridad.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/admin/usuarios" className="btn btn-primary btn-sm">
            <Users size={16} />
            <span>Gestionar Clientes</span>
          </Link>
          <Link href="/dashboard" className="btn btn-secondary btn-sm">
            <ArrowUpRight size={16} />
            <span>Ver Modo Usuario</span>
          </Link>
        </div>
      </div>

      {/* User Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-6)',
      }}>
        {userKpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-lg)',
                  background: kpi.bg, color: kpi.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} />
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {kpi.label}
                </span>
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 800,
                color: 'var(--text-primary)', lineHeight: 1,
              }}>
                {kpi.value.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* System Volume Financial Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-8)',
      }}>
        {financialKpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-lg)',
                  background: kpi.bg, color: kpi.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={20} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                    {kpi.label}
                  </span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    {kpi.subtitle}
                  </div>
                </div>
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '1.65rem', fontWeight: 800,
                color: 'var(--text-primary)', marginTop: '0.5rem',
              }}>
                {kpi.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Audit Logs Section */}
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.25rem',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ScrollText size={18} style={{ color: 'var(--text-tertiary)' }} />
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Registro de Auditoría Reciente
            </h2>
          </div>
          <Link href="/admin/auditoria" style={{ fontSize: 'var(--text-xs)', color: 'var(--primary-600)', fontWeight: 600, textDecoration: 'none' }}>
            Ver todos los eventos →
          </Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {data.recentAuditLogs.length === 0 && (
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: '2rem 0' }}>
              No hay actividad registrada aún.
            </p>
          )}
          {data.recentAuditLogs.map(log => (
            <div key={log.id} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.65rem 0.85rem', background: 'var(--bg-elevated)',
              border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--text-sm)',
            }}>
              <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{log.action}</span>
              <span style={{ flex: 1, color: 'var(--text-secondary)' }}>
                {log.details || log.user?.name || log.user?.email || 'Sistema'}
              </span>
              <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                {new Date(log.createdAt).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
