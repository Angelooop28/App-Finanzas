import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Leading dot. Status is always conveyed by text too, never by color alone. */
  dot?: boolean;
  children: React.ReactNode;
}

export function Badge({ variant = 'primary', size = 'md', dot = false, children, className = '', ...props }: BadgeProps) {
  const classes = [
    'badge',
    `badge-${variant}`,
    size === 'sm' ? 'badge-sm' : size === 'lg' ? 'badge-lg' : '',
    dot ? 'badge-dot' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}
