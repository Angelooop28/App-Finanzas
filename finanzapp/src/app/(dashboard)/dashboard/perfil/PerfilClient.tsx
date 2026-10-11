'use client';

import { useState, useTransition } from 'react';
import { updateProfile } from '@/lib/actions';
import { useTheme } from '@/components/ThemeProvider';
import {
  User,
  Mail,
  Check,
  Save,
  AlertCircle,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { Combobox } from '@/components/ui/Combobox';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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
  const { theme, setTheme } = useTheme();
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
      const res = await updateProfile({
        name: form.name.trim(),
        age: form.age || undefined,
        city: form.city.trim() || undefined,
        payFrequency: form.payFrequency,
        payrollCutoffDay: form.payrollCutoffDay,
      });
      if (res.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(res.error || 'Error al actualizar el perfil');
      }
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
    <div style={{ animation: 'fadeInUp 0.4s ease-out', maxWidth: 720 }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.65rem', borderRadius: 'var(--radius-full)', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-600)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <User size={13} />
          Configuración Fin593
        </div>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Perfil de Usuario</h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Personaliza tu información, apariencia visual del sistema y frecuencia de nómina para Ecuador (USD).
        </p>
      </div>

      {/* Avatar Header Card */}
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary-700), var(--accent-500))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--text-2xl)',
            fontWeight: 800,
            color: 'white',
            margin: '0 auto 1rem',
            boxShadow: 'var(--shadow-glow-accent)',
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          {initials || '593'}
        </div>
        <h2 style={{ fontWeight: 800, fontSize: 'var(--text-xl)', margin: '0 0 0.25rem' }}>{form.name}</h2>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          <Mail size={14} /> {user.email}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '0.75rem' }}>
          Fin593 • Miembro activo desde {new Date(user.createdAt).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Theme Preference Card */}
      <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} color="var(--accent-500)" />
          <h3 style={{ fontWeight: 700, fontSize: 'var(--text-base)', margin: 0 }}>Tema Visual del Sistema</h3>
        </div>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Elige entre la paleta Blanco Puro / Azul Marino o la experiencia Midnight Navy de alta concentración.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <button
            type="button"
            onClick={() => setTheme('light')}
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-xl)',
              border: `2px solid ${theme === 'light' ? 'var(--accent-500)' : 'var(--glass-border)'}`,
              background: theme === 'light' ? 'var(--accent-50)' : 'var(--bg-secondary)',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-lg)', background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Sun size={20} />
              </div>
              {theme === 'light' && <Check size={18} color="var(--accent-600)" />}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Modo Claro (Fin593)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fondo blanco con contraste Azul Marino</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-xl)',
              border: `2px solid ${theme === 'dark' ? 'var(--accent-500)' : 'var(--glass-border)'}`,
              background: theme === 'dark' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-secondary)',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-lg)', background: '#1E3A8A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Moon size={20} />
              </div>
              {theme === 'dark' && <Check size={18} color="var(--accent-500)" />}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Modo Oscuro (Midnight)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Azul marino profundo para trabajo nocturno</div>
            </div>
          </button>
        </div>
      </div>

      {/* Form Card */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontWeight: 700, fontSize: 'var(--text-base)', marginBottom: '1.25rem' }}>Parámetros de Nómina y Usuario</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <Input
            label="Nombre Completo"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <Input
              label="Edad"
              type="text"
              inputMode="decimal"
              value={form.age || ''}
              onChange={e => setForm(p => ({ ...p, age: parseInt(e.target.value) || 0 }))}
            />
            <Input
              label="Ciudad de Residencia"
              placeholder="Ej: Quito, Guayaquil, Cuenca"
              value={form.city}
              onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <Combobox
              label="Frecuencia de Pago"
              options={Object.entries(FREQ_LABELS).map(([v, l]) => ({ value: v, label: l }))}
              value={form.payFrequency}
              onChange={val => setForm(p => ({ ...p, payFrequency: val }))}
            />
            <Input
              label="Día de Corte de Nómina"
              type="text"
              inputMode="decimal"
              value={form.payrollCutoffDay}
              onChange={e => setForm(p => ({ ...p, payrollCutoffDay: parseInt(e.target.value) || 28 }))}
            />
          </div>

          <Input
            label="Moneda Operativa"
            value={user.currency}
            disabled
            style={{ opacity: 0.6 }}
          />
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

        <Button
          variant="primary"
          fullWidth
          isLoading={isPending}
          onClick={handleSave}
          disabled={isPending}
          style={{ marginTop: '1.5rem', padding: '0.85rem' }}
          icon={saved ? <Check size={18} /> : <Save size={18} />}
        >
          {saved ? '¡Cambios Guardados!' : 'Guardar Cambios'}
        </Button>
      </div>
    </div>
  );
}
