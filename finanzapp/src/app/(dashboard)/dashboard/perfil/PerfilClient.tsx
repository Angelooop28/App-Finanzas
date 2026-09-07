'use client';

import { useState, useTransition } from 'react';
import { updateProfile } from '@/lib/actions';
import {
  User,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Check,
  Save,
  AlertCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';

interface UserData {
  name: string;
  email: string;
  age: number | null;
  city: string | null;
  currency: string;
  payFrequency: string;
  payrollCutoffDay: number | null;
  createdAt: string;
}

const FREQ_LABELS: Record<string, string> = {
  MONTHLY: 'Mensual',
  BIWEEKLY: 'Quincenal',
  WEEKLY: 'Semanal',
};

export default function PerfilClient({ user }: { user: UserData }) {
  const [form, setForm] = useState({
    name: user.name,
    age: user.age || 0,
    city: user.city || '',
    payFrequency: user.payFrequency,
    payrollCutoffDay: user.payrollCutoffDay || 28,
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setError('');
    if (!form.name.trim()) {
      setError('El nombre es requerido');
      return;
    }
    if (form.age && (form.age < 15 || form.age > 120)) {
      setError('La edad debe estar entre 15 y 120');
      return;
    }
    if (form.payrollCutoffDay < 1 || form.payrollCutoffDay > 31) {
      setError('El día de corte debe estar entre 1 y 31');
      return;
    }

    startTransition(async () => {
      await updateProfile({
        name: form.name.trim(),
        age: form.age || undefined,
        city: form.city.trim() || undefined,
        payFrequency: form.payFrequency,
        payrollCutoffDay: form.payrollCutoffDay,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  };

  const initials = form.name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease-out', maxWidth: 680 }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.65rem', borderRadius: 'var(--radius-full)', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-400)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <User size={13} />
          Configuración de Cuenta
        </div>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Perfil Personal</h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Personaliza tu información y frecuencia de ingresos para afinar las proyecciones financieras.
        </p>
      </div>

      {/* Avatar Header Card */}
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--text-2xl)',
            fontWeight: 800,
            color: 'white',
            margin: '0 auto 1rem',
            boxShadow: '0 0 25px rgba(99, 102, 241, 0.35)',
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          {initials || 'FA'}
        </div>
        <h2 style={{ fontWeight: 800, fontSize: 'var(--text-xl)', margin: '0 0 0.25rem' }}>{form.name}</h2>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          <Mail size={14} /> {user.email}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '0.75rem' }}>
          Miembro activo desde {new Date(user.createdAt).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Form Card */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontWeight: 700, fontSize: 'var(--text-base)', marginBottom: '1.25rem' }}>Parámetros de Nómina y Usuario</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div className="input-group">
            <label className="input-label">Nombre Completo</label>
            <input
              className="input"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Edad</label>
              <input
                className="input"
                type="number"
                min="15"
                max="100"
                value={form.age || ''}
                onChange={e => setForm(p => ({ ...p, age: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Ciudad de Residencia</label>
              <input
                className="input"
                placeholder="Ej: Quito, Guayaquil, Cuenca"
                value={form.city}
                onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Frecuencia de Pago</label>
              <select
                className="select"
                value={form.payFrequency}
                onChange={e => setForm(p => ({ ...p, payFrequency: e.target.value }))}
              >
                {Object.entries(FREQ_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Día de Corte de Nómina</label>
              <input
                className="input"
                type="number"
                min="1"
                max="31"
                value={form.payrollCutoffDay}
                onChange={e => setForm(p => ({ ...p, payrollCutoffDay: parseInt(e.target.value) || 28 }))}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Moneda Operativa</label>
            <input className="input" value={user.currency} disabled style={{ opacity: 0.6 }} />
          </div>
        </div>

        {error && (
          <div
            style={{
              marginTop: '1.25rem',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: 'var(--danger-400)',
              fontSize: 'var(--text-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <button
          className={`btn btn-primary w-full ${isPending ? 'btn-loading' : ''}`}
          onClick={handleSave}
          disabled={isPending}
          style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.85rem' }}
        >
          {saved ? (
            <>
              <Check size={18} /> ¡Cambios Guardados!
            </>
          ) : isPending ? (
            'Guardando datos...'
          ) : (
            <>
              <Save size={18} /> Guardar Cambios
            </>
          )}
        </button>
      </div>
    </div>
  );
}
