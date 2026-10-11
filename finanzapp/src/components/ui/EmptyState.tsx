import React from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  /** Use a link instead of a callback for navigation CTAs. */
  actionHref?: string;
  actionIcon?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export function EmptyState({ icon, title, description, actionText, onAction, actionHref, actionIcon, compact, className = '' }: EmptyStateProps) {
  return (
    <div className={`empty-state ${compact ? 'empty-state--compact' : ''} ${className}`} role="status">
      <div className="empty-state__icon" aria-hidden="true">{icon}</div>
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__desc">{description}</p>
      {actionText && actionHref && (
        <Link href={actionHref} className="btn btn-primary empty-state__action">
          {actionIcon}
          <span>{actionText}</span>
        </Link>
      )}
      {actionText && onAction && !actionHref && (
        <Button variant="primary" onClick={onAction} className="empty-state__action" icon={actionIcon}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
