'use client';

import { useState, useEffect } from 'react';
import { getAdminAuditLogs } from '@/lib/actions/admin';
import {
  ScrollText,
  Filter,
  RefreshCw,
  Clock,
  ChevronLeft,
  ChevronRight,
  Globe,
} from 'lucide-react';

interface AuditLogItem {
  id: string;
  userId: string | null;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

const ACTION_FILTERS = [
  { label: 'Todos', value: '' },
  { label: 'Logins', value: 'LOGIN' },
  { label: 'Registros', value: 'REGISTER' },
  { label: 'Recuperación Clave', value: 'PASSWORD_RESET_COMPLETE' },
  { label: 'Acciones Admin', value: 'ADMIN_ACTION' },
];

export default function AdminAuditoriaPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async (p = page, action = actionFilter) => {
    setLoading(true);
    try {
      const res = await getAdminAuditLogs({
        page: p,
        action: action || undefined,
        pageSize: 20,
      });
      setLogs(res.logs as unknown as AuditLogItem[]);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      try {
        const res = await getAdminAuditLogs({
          page: 1,
          action: actionFilter || undefined,
          pageSize: 20,
        });
        if (!ignore) {
          setLogs(res.logs as unknown as AuditLogItem[]);
          setTotal(res.total);
          setTotalPages(res.totalPages);
          setPage(res.page);
        }
      } catch (err) {
        if (!ignore) console.error(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [actionFilter]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return {
          bg: 'var(--info-50)',
          color: 'var(--info-700)',
          border: 'var(--info-200)',
          label: 'LOGIN',
        };
      case 'REGISTER':
        return {
          bg: 'var(--success-50)',
          color: 'var(--success-700)',
          border: 'var(--success-200)',
          label: 'REGISTRO',
        };
      case 'ADMIN_ACTION':
        return {
          bg: 'var(--primary-50)',
          color: 'var(--primary-700)',
          border: 'var(--primary-200)',
          label: 'ADMIN',
        };
      case 'PASSWORD_RESET_REQUEST':
      case 'PASSWORD_RESET_COMPLETE':
        return {
          bg: 'var(--warning-50)',
          color: 'var(--warning-700)',
          border: 'var(--warning-200)',
          label: 'RESET PASS',
        };
      default:
        return {
          bg: 'var(--bg-secondary)',
          color: 'var(--text-secondary)',
          border: 'var(--glass-border)',
          label: action,
        };
    }
  };

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--info-50)',
              color: 'var(--info-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ScrollText size={22} />
          </div>
          <div>
            <h1
              style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              Registro de Auditoría
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
              Trazabilidad completa de eventos críticos del sistema y accesos de usuarios ({total} eventos).
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '1rem 1.25rem',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: 'var(--space-6)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            <Filter size={13} style={{ display: 'inline', marginRight: '0.25rem' }} />
            Filtrar:
          </span>
          {ACTION_FILTERS.map((f) => {
            const isActive = actionFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setActionFilter(f.value)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isActive ? '1px solid var(--primary-500)' : '1px solid var(--glass-border)',
                  background: isActive ? 'var(--primary-500)' : 'var(--bg-secondary)',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => fetchLogs(page, actionFilter)}
          className="btn btn-secondary btn-sm"
          disabled={loading}
          title="Recargar logs"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Table Container */}
      <div
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr
                style={{
                  background: 'var(--bg-secondary)',
                  borderBottom: '1px solid var(--glass-border)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 700,
                }}
              >
                <th style={{ padding: '1rem 1.25rem' }}>Fecha & Hora</th>
                <th style={{ padding: '1rem 1.25rem' }}>Acción</th>
                <th style={{ padding: '1rem 1.25rem' }}>Usuario</th>
                <th style={{ padding: '1rem 1.25rem' }}>Detalles</th>
                <th style={{ padding: '1rem 1.25rem' }}>IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--info-500)' }} />
                      <span>Cargando registros de auditoría...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    No se encontraron registros de auditoría para este filtro.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badge = getActionBadge(log.action);
                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: '1px solid var(--glass-border)',
                        transition: 'background-color 0.15s ease',
                      }}
                      className="hover:bg-slate-50"
                    >
                      {/* Timestamp */}
                      <td style={{ padding: '1rem 1.25rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>
                          <Clock size={13} style={{ color: 'var(--text-tertiary)' }} />
                          <span>
                            {new Date(log.createdAt).toLocaleString('es-EC', {
                              dateStyle: 'short',
                              timeStyle: 'medium',
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Action Badge */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            letterSpacing: '0.03em',
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* User */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        {log.user ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 'var(--radius-full)',
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.65rem',
                              }}
                            >
                              {(log.user.name || log.user.email || 'U').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                                {log.user.name || 'Sin nombre'}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                                {log.user.email}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', fontStyle: 'italic' }}>
                            Sistema / Anónimo
                          </span>
                        )}
                      </td>

                      {/* Details */}
                      <td style={{ padding: '1rem 1.25rem', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', maxWidth: '350px' }}>
                        {log.details || '—'}
                      </td>

                      {/* IP Address */}
                      <td style={{ padding: '1rem 1.25rem', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                        {log.ipAddress ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Globe size={12} />
                            <span>{log.ipAddress}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              padding: '1rem 1.25rem',
              background: 'var(--bg-secondary)',
              borderTop: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 'var(--text-sm)',
            }}
          >
            <div style={{ color: 'var(--text-secondary)' }}>
              Página <strong>{page}</strong> de <strong>{totalPages}</strong> ({total} registros)
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => fetchLogs(page - 1, actionFilter)}
                disabled={page <= 1 || loading}
              >
                <ChevronLeft size={16} />
                <span>Anterior</span>
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => fetchLogs(page + 1, actionFilter)}
                disabled={page >= totalPages || loading}
              >
                <span>Siguiente</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
