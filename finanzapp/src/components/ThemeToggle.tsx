'use client';

import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ThemeToggle({ className, showLabel = false }: { className?: string; showLabel?: boolean }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="secondary"
      onClick={toggleTheme}
      className={className}
      aria-label={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
      title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
      icon={
        theme === 'dark' 
          ? <Sun size={17} style={{ color: '#FBBF24' }} /> 
          : <Moon size={17} style={{ color: 'var(--brand-navy-700)' }} />
      }
      style={{
        borderRadius: 'var(--radius-full)',
        padding: showLabel ? '0.4rem 0.8rem' : '0.45rem',
      }}
    >
      {showLabel && (
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
          {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
        </span>
      )}
    </Button>
  );
}
