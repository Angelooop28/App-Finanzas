import AuthProvider from '@/components/AuthProvider';
import DashboardShell from './DashboardShell';

export const metadata = {
  title: 'Dashboard — Fin593',
  description: 'Gestión Financiera Inteligente para Ecuador',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  );
}
