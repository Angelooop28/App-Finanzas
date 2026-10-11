'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

export interface ComboboxOption {
  value: string;
  label: string;
  group?: string;
  icon?: React.ReactNode;
  badge?: string;
  description?: string;
}

interface ComboboxProps {
  label?: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  error?: string;
  required?: boolean;
}

export function Combobox({
  label,
  options,
  value,
  onChange,
  placeholder = 'Seleccionar opción...',
  searchPlaceholder = 'Buscar tipo u opción...',
  error,
  required,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  const filteredOptions = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.group && o.group.toLowerCase().includes(search.toLowerCase())) ||
    (o.description && o.description.toLowerCase().includes(search.toLowerCase()))
  );

  // Group options if group exists
  const groupedOptions = filteredOptions.reduce((acc, opt) => {
    const group = opt.group || 'Otras Opciones';
    if (!acc[group]) acc[group] = [];
    acc[group].push(opt);
    return acc;
  }, {} as Record<string, ComboboxOption[]>);

  return (
    <div className="input-group" ref={containerRef} style={{ position: 'relative' }}>
      {label && (
        <label className="input-label">
          {label} {required && <span style={{ color: 'var(--danger-500)' }}>*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '0.65rem 1rem',
          fontSize: 'var(--text-sm)',
          background: 'var(--bg-primary, #FFFFFF)',
          border: `1px solid ${error ? 'var(--danger-500)' : isOpen ? 'var(--brand-navy-500, #2563EB)' : 'var(--glass-border)'}`,
          borderRadius: 'var(--radius-xl, 1rem)',
          color: selectedOption ? 'var(--text-primary)' : 'var(--text-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          textAlign: 'left',
          boxShadow: isOpen ? '0 0 0 3px rgba(37, 99, 235, 0.15)' : 'var(--shadow-sm)',
          transition: 'all 0.2s ease',
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
          {selectedOption?.icon && (
            <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
              {selectedOption.icon}
            </span>
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: selectedOption ? 600 : 400 }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          size={16}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s ease',
            color: 'var(--text-tertiary)',
            flexShrink: 0,
          }}
        />
      </button>

      {error && <span style={{ fontSize: '0.72rem', color: 'var(--danger-500)', marginTop: 2 }}>{error}</span>}

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            background: 'var(--bg-primary, #FFFFFF)',
            border: '1px solid var(--glass-border, rgba(15, 23, 42, 0.1))',
            borderRadius: 'var(--radius-xl, 1rem)',
            boxShadow: '0 12px 30px rgba(5, 11, 20, 0.18)',
            maxHeight: '320px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeInUp 0.15s ease-out',
          }}
          role="listbox"
        >
          {/* Search box inside dropdown */}
          {options.length > 5 && (
            <div
              style={{
                padding: '0.5rem 0.75rem',
                borderBottom: '1px solid var(--glass-border)',
                background: 'var(--bg-secondary)',
              }}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={14} style={{ position: 'absolute', left: '0.65rem', color: 'var(--text-tertiary)' }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.6rem 0.4rem 2rem',
                    fontSize: '0.75rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--glass-border)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                  onClick={e => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* List items grouped */}
          <div style={{ overflowY: 'auto', padding: '0.35rem 0' }}>
            {Object.keys(groupedOptions).length === 0 ? (
              <div style={{ padding: '1.25rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                No se encontraron opciones
              </div>
            ) : (
              Object.entries(groupedOptions).map(([groupName, groupOpts]) => (
                <div key={groupName} style={{ marginBottom: '0.25rem' }}>
                  {Object.keys(groupedOptions).length > 1 && (
                    <div
                      style={{
                        padding: '0.35rem 0.85rem',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--text-tertiary)',
                        background: 'var(--bg-secondary)',
                      }}
                    >
                      {groupName}
                    </div>
                  )}

                  {groupOpts.map(opt => {
                    const isSelected = opt.value === value;
                    return (
                      <div
                        key={opt.value}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          onChange(opt.value);
                          setIsOpen(false);
                        }}
                        style={{
                          padding: '0.55rem 0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          background: isSelected ? 'var(--primary-50, #EFF6FF)' : 'transparent',
                          color: isSelected ? 'var(--primary-700, #1D4ED8)' : 'var(--text-primary)',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={e => {
                          if (!isSelected) e.currentTarget.style.background = 'var(--bg-secondary)';
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          {opt.icon && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                              {opt.icon}
                            </span>
                          )}
                          <div>
                            <div style={{ fontSize: 'var(--text-sm)', fontWeight: isSelected ? 700 : 500 }}>
                              {opt.label}
                            </div>
                            {opt.description && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                                {opt.description}
                              </div>
                            )}
                          </div>
                        </div>

                        {isSelected && <Check size={16} color="var(--primary-600)" />}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
