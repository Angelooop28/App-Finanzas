import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge, BadgeVariant } from './Badge';

export type StatTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  variation?: {
    value: number | string;
    periodText?: string;
    /** true when an increase is good news (income, savings); false for expenses/debts. */
    isPositiveGood?: boolean;
    type?: 'increase' | 'decrease' | 'neutral';
  };
  icon?: React.ReactNode;
  tone?: StatTone;
  /** @deprecated kept for backward compatibility; use `tone`. */
  iconBg?: string;
  badge?: { text: string; variant: BadgeVariant };
  highlight?: boolean;
  critical?: boolean;
  className?: string;
  onClick?: () => void;
}

export function StatCard({ title, value, subtitle, variation, icon, tone = 'neutral', badge, highlight, critical, className = '', onClick }: StatCardProps) {
  const classes = [
    'stat-card',
    critical ? 'stat-card--critical' : highlight ? 'stat-card--highlight' : '',
    onClick ? 'stat-card--clickable' : '',
    className,
  ].filter(Boolean).join(' ');

  let trend: React.ReactNode = null;
  if (variation) {
    const numeric = typeof variation.value === 'number' ? variation.value : null;
    const dir = variation.type ?? (numeric === null || numeric === 0 ? 'neutral' : numeric > 0 ? 'increase' : 'decrease');
    const good = dir === 'neutral' ? null : (dir === 'increase') === (variation.isPositiveGood ?? false);
    const Icon = dir === 'increase' ? TrendingUp : dir === 'decrease' ? TrendingDown : Minus;
    const label = numeric !== null ? `${numeric > 0 ? '+' : ''}${numeric}%` : variation.value;
    trend = (
      <span className={`trend ${good === null ? 'trend--neutral' : good ? 'trend--good' : 'trend--bad'}`}>
        <Icon size={13} aria-hidden="true" />
        <span>{label}</span>
        {variation.periodText && <span className="text-muted" style={{ fontWeight: 500 }}>{variation.periodText}</span>}
      </span>
    );
  }

  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      className={classes}
      onClick={onClick}
      {...(onClick ? { type: 'button' as const, style: { textAlign: 'left' as const, font: 'inherit', width: '100%' } } : {})}
    >
      <div className="stat-card__head">
        <div className="stat-card__label">
          {icon && <span className={`stat-card__icon stat-card__icon--${critical ? 'danger' : tone}`} aria-hidden="true">{icon}</span>}
          <span className="t-label">{title}</span>
        </div>
        {badge && <Badge variant={badge.variant} size="sm" dot>{badge.text}</Badge>}
      </div>
      <div className="stat-card__value">{value}</div>
      {(trend || subtitle) && (
        <div className="stat-card__foot">
          {trend}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </Tag>
  );
}
