'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth = 'md',
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getMaxWidth = () => {
    switch (maxWidth) {
      case 'sm': return '420px';
      case 'lg': return '680px';
      case 'xl': return '820px';
      case 'md': default: return '540px';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(5, 11, 20, 0.65)',
          backdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.2s ease-out forwards',
        }}
      />

      {/* Modal / Bottom Sheet on mobile container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: getMaxWidth(),
          maxHeight: '90vh',
          background: 'var(--bg-primary, #FFFFFF)',
          borderRadius: 'var(--radius-2xl, 1.25rem)',
          border: '1px solid var(--glass-border, rgba(15, 23, 42, 0.1))',
          boxShadow: '0 20px 50px rgba(5, 11, 20, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10000,
          overflow: 'hidden',
          animation: 'modalSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--glass-border, rgba(15, 23, 42, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {icon && (
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--radius-lg, 0.75rem)',
                  background: 'var(--primary-50, #EFF6FF)',
                  color: 'var(--primary-600, #2563EB)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {icon}
              </div>
            )}
            <div>
              <h2
                id="modal-title"
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                {title}
              </h2>
              {subtitle && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={onClose}
            aria-label="Cerrar ventana"
            icon={<X size={18} />}
            style={{
              padding: '0.25rem',
              color: 'var(--text-tertiary)',
              minWidth: 'auto',
            }}
          />
        </div>

        {/* Body content */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {children}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(12px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @media (max-width: 640px) {
          [role="dialog"] {
            align-items: flex-end !important;
            padding: 0 !important;
          }
          [role="dialog"] > div:nth-child(2) {
            max-height: 85vh !important;
            border-bottom-left-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
            border-top-left-radius: 1.5rem !important;
            border-top-right-radius: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}
