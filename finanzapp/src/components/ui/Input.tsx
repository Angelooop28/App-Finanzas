import React, { forwardRef, useState } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
  prefixStr?: string;
  formatAsCurrency?: boolean;
  containerStyle?: React.CSSProperties;
  wrapperStyle?: React.CSSProperties;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      icon,
      suffix,
      prefixStr,
      formatAsCurrency,
      className = '',
      style: customInputStyle,
      containerStyle,
      wrapperStyle,
      onBlur,
      onFocus,
      onChange,
      value,
      type,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (onFocus) onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      if (onBlur) onBlur(e);
    };

    const isDecimal = type === 'number' || formatAsCurrency;
    const finalType = isDecimal ? 'text' : type;
    const inputMode = isDecimal ? 'decimal' : props.inputMode;

    const leftPadding = icon ? '2.75rem' : prefixStr ? '2.4rem' : '1rem';
    const rightPadding = suffix ? '2.75rem' : '1rem';

    return (
      <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%', ...containerStyle }}>
        {label && (
          <label
            className="input-label"
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              letterSpacing: '0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            {label} {props.required && <span style={{ color: 'var(--danger-500)' }}>*</span>}
          </label>
        )}
        <div
          className={`input-wrapper ${className}`}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            background: 'var(--bg-elevated, var(--bg-primary))',
            border: `1.5px solid ${
              error
                ? 'var(--danger-500)'
                : isFocused
                ? 'var(--brand-navy-500)'
                : 'var(--glass-border)'
            }`,
            borderRadius: 'var(--radius-xl)',
            boxShadow: isFocused
              ? '0 0 0 3px rgba(37, 99, 235, 0.18), 0 2px 6px rgba(0,0,0,0.06)'
              : 'var(--shadow-sm)',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            overflow: 'hidden',
            ...wrapperStyle,
          }}
        >
          {icon && (
            <div
              style={{
                position: 'absolute',
                left: '0.9rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: isFocused ? 'var(--brand-navy-500)' : 'var(--text-tertiary)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
                transition: 'color 0.2s ease',
                zIndex: 2,
              }}
            >
              {icon}
            </div>
          )}
          {prefixStr && !icon && (
            <div
              style={{
                position: 'absolute',
                left: '0.9rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: isFocused ? 'var(--brand-navy-500)' : 'var(--text-tertiary)',
                fontWeight: 700,
                fontSize: '0.875rem',
                pointerEvents: 'none',
                transition: 'color 0.2s ease',
                zIndex: 2,
              }}
            >
              {prefixStr}
            </div>
          )}
          <input
            ref={ref}
            type={finalType}
            inputMode={inputMode}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={{
              width: '100%',
              minHeight: '44px',
              paddingTop: '0.65rem',
              paddingBottom: '0.65rem',
              paddingLeft: leftPadding,
              paddingRight: rightPadding,
              fontSize: '0.925rem',
              lineHeight: '1.4',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: 'inherit',
              ...customInputStyle,
            }}
            {...props}
          />
          {suffix && (
            <div
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                zIndex: 2,
              }}
            >
              {suffix}
            </div>
          )}
        </div>
        {hint && !error && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' }}>
            {hint}
          </span>
        )}
        {error && (
          <span style={{ fontSize: '0.75rem', color: 'var(--danger-500)', fontWeight: 600, marginTop: '0.15rem' }}>
            {error}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
