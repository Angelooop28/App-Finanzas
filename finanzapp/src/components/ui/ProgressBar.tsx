import React from 'react';

export type ProgressVariant = 'primary' | 'success' | 'warning' | 'danger';

interface ProgressBarProps {
  value: number;
  max?: number;
  height?: number;
  variant?: ProgressVariant;
  label?: string;
  showPercent?: boolean;
  className?: string;
}

export function ProgressBar({ value, max = 100, height = 8, variant = 'primary', label, showPercent = false, className = '' }: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const fill = variant === 'primary' ? 'progress-fill' : `progress-fill progress-fill-${variant}`;

  return (
    <div className={className} style={{ width: '100%' }}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1" style={{ fontSize: '0.75rem' }}>
          {label && <span className="text-muted" style={{ fontWeight: 600 }}>{label}</span>}
          {showPercent && <span className="t-numeric" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{Math.round(percent)}%</span>}
        </div>
      )}
      <div
        className="progress-bar"
        style={{ height }}
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className={fill} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
