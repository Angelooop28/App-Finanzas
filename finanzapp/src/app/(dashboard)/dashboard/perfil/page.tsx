import { getProfile } from '@/lib/actions';
import PerfilClient from './PerfilClient';

export default async function PerfilPage() {
  let user;
  try {
    user = await getProfile();
  } catch {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.4 }}>⚠️</div>
        <p style={{ color: 'var(--text-secondary)' }}>Error cargando perfil. Recarga la página.</p>
      </div>
    );
  }

  if (!user) return <div style={{ padding: '4rem', textAlign: 'center' }}>No se pudo cargar el perfil.</div>;

  return (
    <PerfilClient
      user={{
        name: user.name || '',
        email: user.email,
        age: user.age,
        city: user.city,
        currency: user.currency,
        payFrequency: user.payFrequency,
        payrollCutoffDay: user.payrollCutoffDay,
        createdAt: user.createdAt.toISOString(),
      }}
    />
  );
}
