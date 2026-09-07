import AuthProvider from '@/components/AuthProvider';
import DashboardShell from './DashboardShell';

export const metadata = {
  title: 'Dashboard — FinanzApp',
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
