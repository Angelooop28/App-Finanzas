'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  getAdminUsers,
  adminCreateUser,
  adminUpdateUser,
  adminResetUserPassword,
  adminToggleUserStatus,
  adminDeleteUser,
} from '@/lib/actions/admin';
import {
  Users,
  Search,
  Shield,
  UserCheck,
  UserX,
  UserPlus,
  Key,
  Trash2,
  Edit3,
  FileText,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Wallet,
  CreditCard,
  Receipt,
  PiggyBank,
  ChevronLeft,
  ChevronRight,
  Crown,
  X,
  Copy,
} from 'lucide-react';
import { Combobox } from '@/components/ui/Combobox';

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'BLOCKED' | 'SUSPENDED';
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  city: string | null;
  createdAt: Date;
  _count: {
    incomes: number;
    debts: number;
    expenses: number;
    savingsGoals: number;
  };
}

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [resettingUser, setResettingUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);

  // Forms state
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER' as 'USER' | 'ADMIN',
    status: 'ACTIVE' as 'ACTIVE' | 'BLOCKED' | 'SUSPENDED',
    plan: 'FREE' as 'FREE' | 'PRO' | 'ENTERPRISE',
    city: '',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'USER' as 'USER' | 'ADMIN',
    status: 'ACTIVE' as 'ACTIVE' | 'BLOCKED' | 'SUSPENDED',
    plan: 'FREE' as 'FREE' | 'PRO' | 'ENTERPRISE',
    city: '',
  });

  const [newPassword, setNewPassword] = useState('');
  const [generatedPassCopied, setGeneratedPassCopied] = useState(false);

  const fetchUsers = async (p = page, q = search, sf = statusFilter, pf = planFilter) => {
    setLoading(true);
    try {
      const res = await getAdminUsers({
        page: p,
        search: q || undefined,
        statusFilter: sf || undefined,
        planFilter: pf || undefined,
        pageSize: 12,
      });
      setUsers(res.users as unknown as AdminUser[]);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al cargar usuarios' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      try {
        const res = await getAdminUsers({
          page: 1,
          search: search || undefined,
          statusFilter: statusFilter || undefined,
          planFilter: planFilter || undefined,
          pageSize: 12,
        });
        if (!ignore) {
          setUsers(res.users as unknown as AdminUser[]);
          setTotal(res.total);
          setTotalPages(res.totalPages);
          setPage(res.page);
        }
      } catch (err) {
        if (!ignore) {
          console.error(err);
          setMessage({ type: 'error', text: 'Error al cargar usuarios' });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [statusFilter, planFilter, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1, search, statusFilter, planFilter);
  };

  // 1. Create User Handler
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await adminCreateUser(createForm);
      if (res.success) {
        setMessage({ type: 'success', text: `Usuario ${createForm.email} creado exitosamente` });
        setShowCreateModal(false);
        setCreateForm({
          name: '',
          email: '',
          password: '',
          role: 'USER',
          status: 'ACTIVE',
          plan: 'FREE',
          city: '',
        });
        fetchUsers(1, search);
      } else {
        setMessage({ type: 'error', text: res.error });
      }
    });
  };

  // 2. Edit User Handler
  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email,
      role: user.role,
      status: user.status,
      plan: user.plan,
      city: user.city || '',
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    startTransition(async () => {
      const res = await adminUpdateUser({
        userId: editingUser.id,
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        status: editForm.status,
        plan: editForm.plan,
        city: editForm.city || null,
      });

      if (res.success) {
        setMessage({ type: 'success', text: `Usuario ${editForm.email} actualizado correctamente` });
        setEditingUser(null);
        fetchUsers(page, search);
      } else {
        setMessage({ type: 'error', text: res.error });
      }
    });
  };

  // 3. Reset Password Handler
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !newPassword) return;

    startTransition(async () => {
      const res = await adminResetUserPassword({
        userId: resettingUser.id,
        newPassword,
      });

      if (res.success) {
        setMessage({ type: 'success', text: `Contraseña restablecida exitosamente para ${resettingUser.email}` });
        setResettingUser(null);
        setNewPassword('');
      } else {
        setMessage({ type: 'error', text: res.error });
      }
    });
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = 'Finanz!';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
    navigator.clipboard.writeText(pass);
    setGeneratedPassCopied(true);
    setTimeout(() => setGeneratedPassCopied(false), 3000);
  };

  // 4. Toggle Status Handler
  const handleToggleStatus = async (user: AdminUser) => {
    const action = user.status === 'ACTIVE' ? 'BLOQUEAR' : 'DESBLOQUEAR';
    if (!window.confirm(`¿Confirmas que deseas ${action} la cuenta de ${user.email}?`)) return;

    startTransition(async () => {
      const res = await adminToggleUserStatus(user.id);
      if (res.success) {
        setMessage({ type: 'success', text: res.message || 'Estado actualizado' });
        fetchUsers(page, search);
      } else {
        setMessage({ type: 'error', text: res.error });
      }
    });
  };

  // 5. Delete User Handler
  const handleDeleteSubmit = async () => {
    if (!deletingUser) return;

    startTransition(async () => {
      const res = await adminDeleteUser(deletingUser.id);
      if (res.success) {
        setMessage({ type: 'success', text: `Usuario ${deletingUser.email} eliminado definitivamente` });
        setDeletingUser(null);
        fetchUsers(page, search);
      } else {
        setMessage({ type: 'error', text: res.error });
      }
    });
  };

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-lg)', background: 'var(--primary-50)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Gestión Integral de Usuarios
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
              CRUD empresarial, rescate de claves, bloqueo de cuentas y auditoría financiera ({total} clientes).
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <UserPlus size={18} />
          <span>Crear Nuevo Cliente</span>
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--space-6)',
            background: message.type === 'success' ? 'var(--success-50)' : 'var(--danger-50)',
            color: message.type === 'success' ? 'var(--success-700)' : 'var(--danger-700)',
            border: `1px solid ${message.type === 'success' ? 'var(--success-200)' : 'var(--danger-200)'}`,
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
          }}
        >
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span style={{ flex: 1 }}>{message.text}</span>
          <button onClick={() => setMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}>
            ✕
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
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
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 300px', maxWidth: '450px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Buscar por nombre, correo o ciudad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
            Buscar
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Status Filter */}
          <div style={{ width: '200px' }}>
            <Combobox
              options={[
                { value: '', label: 'Todos los Estados' },
                { value: 'ACTIVE', label: 'Activos' },
                { value: 'BLOCKED', label: 'Bloqueados' }
              ]}
              value={statusFilter}
              onChange={val => setStatusFilter(val)}
            />
          </div>

          {/* Plan Filter */}
          <div style={{ width: '200px' }}>
            <Combobox
              options={[
                { value: '', label: 'Todos los Planes' },
                { value: 'FREE', label: 'Plan Free' },
                { value: 'PRO', label: 'Plan Pro' },
                { value: 'ENTERPRISE', label: 'Plan Enterprise' }
              ]}
              value={planFilter}
              onChange={val => setPlanFilter(val)}
            />
          </div>

          <button
            onClick={() => fetchUsers(page, search, statusFilter, planFilter)}
            className="btn btn-secondary btn-sm"
            disabled={loading || isPending}
            title="Recargar lista"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
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
                <th style={{ padding: '1rem 1.25rem' }}>Usuario</th>
                <th style={{ padding: '1rem 1.25rem' }}>Rol & Estado</th>
                <th style={{ padding: '1rem 1.25rem' }}>Plan SaaS</th>
                <th style={{ padding: '1rem 1.25rem' }}>Ciudad</th>
                <th style={{ padding: '1rem 1.25rem' }}>Registros</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <RefreshCw size={26} className="animate-spin" style={{ color: 'var(--primary-500)' }} />
                      <span>Cargando clientes...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    No se encontraron clientes con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isAdmin = user.role === 'ADMIN';
                  const isBlocked = user.status === 'BLOCKED';
                  const isPro = user.plan === 'PRO' || user.plan === 'ENTERPRISE';
                  const initials = (user.name || user.email || 'U').slice(0, 2).toUpperCase();

                  return (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: '1px solid var(--glass-border)',
                        background: isBlocked ? 'rgba(239, 68, 68, 0.03)' : 'transparent',
                        transition: 'background-color 0.15s ease',
                      }}
                      className="hover:bg-slate-50"
                    >
                      {/* Name & Email */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 'var(--radius-full)',
                              background: isAdmin ? 'var(--primary-100)' : isBlocked ? 'var(--danger-100)' : 'var(--bg-secondary)',
                              color: isAdmin ? 'var(--primary-600)' : isBlocked ? 'var(--danger-600)' : 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: 'var(--text-xs)',
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span>{user.name || 'Sin nombre'}</span>
                              {isBlocked && (
                                <span style={{ fontSize: '0.65rem', color: 'var(--danger-600)', background: 'var(--danger-50)', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 700 }}>
                                  BLOQUEADO
                                </span>
                              )}
                            </div>
                            <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Status */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              background: isAdmin ? 'var(--primary-50)' : 'var(--bg-secondary)',
                              color: isAdmin ? 'var(--primary-600)' : 'var(--text-secondary)',
                              border: `1px solid ${isAdmin ? 'var(--primary-200)' : 'var(--glass-border)'}`,
                            }}
                          >
                            {isAdmin ? <Shield size={11} /> : <UserCheck size={11} />}
                            {user.role}
                          </span>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              color: isBlocked ? 'var(--danger-600)' : 'var(--success-600)',
                            }}
                          >
                            ● {isBlocked ? 'Cuenta Bloqueada' : 'Cuenta Activa'}
                          </span>
                        </div>
                      </td>

                      {/* SaaS Plan */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: isPro ? 'linear-gradient(135deg, #FEF3C7, #FDE68A)' : 'var(--bg-secondary)',
                            color: isPro ? '#B45309' : 'var(--text-secondary)',
                            border: `1px solid ${isPro ? '#F59E0B' : 'var(--glass-border)'}`,
                          }}
                        >
                          {isPro && <Crown size={12} />}
                          {user.plan}
                        </span>
                      </td>

                      {/* City */}
                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                        {user.city || '—'}
                      </td>

                      {/* Records stats */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', fontSize: 'var(--text-xs)' }}>
                          <span title="Ingresos" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: 'var(--success-600)', background: 'var(--success-50)', padding: '0.15rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                            <Wallet size={11} /> {user._count.incomes}
                          </span>
                          <span title="Deudas" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: 'var(--danger-600)', background: 'var(--danger-50)', padding: '0.15rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                            <CreditCard size={11} /> {user._count.debts}
                          </span>
                          <span title="Gastos" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: 'var(--warning-600)', background: 'var(--warning-50)', padding: '0.15rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                            <Receipt size={11} /> {user._count.expenses}
                          </span>
                          <span title="Metas" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: 'var(--primary-600)', background: 'var(--primary-50)', padding: '0.15rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                            <PiggyBank size={11} /> {user._count.savingsGoals}
                          </span>
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                          {/* 360 Dossier & PDF report */}
                          <Link
                            href={`/admin/usuarios/${user.id}`}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', background: '#F8FAFC' }}
                            title="Ver Radiografía Financiera & Generar Reporte PDF"
                          >
                            <FileText size={14} style={{ color: 'var(--primary-600)' }} />
                            <span>Reporte PDF</span>
                          </Link>

                          {/* Edit User */}
                          <button
                            onClick={() => openEditModal(user)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.35rem 0.5rem' }}
                            title="Editar Datos del Usuario"
                          >
                            <Edit3 size={14} />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => {
                              setResettingUser(user);
                              setNewPassword('');
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.35rem 0.5rem' }}
                            title="Restablecer Contraseña (Rescate)"
                          >
                            <Key size={14} style={{ color: 'var(--warning-600)' }} />
                          </button>

                          {/* Block/Unblock */}
                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={isPending}
                            className={`btn btn-sm ${isBlocked ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ padding: '0.35rem 0.5rem' }}
                            title={isBlocked ? 'Desbloquear Cuenta' : 'Bloquear Cuenta'}
                          >
                            {isBlocked ? <UserCheck size={14} /> : <UserX size={14} style={{ color: 'var(--danger-500)' }} />}
                          </button>

                          {/* Delete User */}
                          <button
                            onClick={() => setDeletingUser(user)}
                            className="btn btn-danger btn-sm"
                            style={{ padding: '0.35rem 0.5rem' }}
                            title="Eliminar Cuenta y Registros"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
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
          <div style={{ padding: '1rem 1.25rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
            <div style={{ color: 'var(--text-secondary)' }}>
              Página <strong>{page}</strong> de <strong>{totalPages}</strong> ({total} clientes)
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => fetchUsers(page - 1, search, statusFilter, planFilter)}
                disabled={page <= 1 || loading}
              >
                <ChevronLeft size={16} />
                <span>Anterior</span>
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => fetchUsers(page + 1, search, statusFilter, planFilter)}
                disabled={page >= totalPages || loading}
              >
                <span>Siguiente</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================= */}
      {/* 1. MODAL CREAR USUARIO                         */}
      {/* ============================================= */}
      {showCreateModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: 'var(--radius-2xl)', maxWidth: '520px', width: '100%', padding: '2rem', boxShadow: 'var(--shadow-2xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={22} style={{ color: 'var(--primary-600)' }} />
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Crear Nuevo Cliente
                </h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Roberto Gómez"
                  className="input"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="cliente@correo.com"
                  className="input"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Contraseña Inicial</label>
                <input
                  type="text"
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                  className="input"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Combobox
                  label="Rol del Sistema"
                  options={[
                    { value: 'USER', label: 'USER (Cliente)' },
                    { value: 'ADMIN', label: 'ADMIN (Administrador)' }
                  ]}
                  value={createForm.role}
                  onChange={val => setCreateForm({ ...createForm, role: val as 'USER' | 'ADMIN' })}
                />
                <Combobox
                  label="Plan SaaS"
                  options={[
                    { value: 'FREE', label: 'Plan FREE' },
                    { value: 'PRO', label: 'Plan PRO' },
                    { value: 'ENTERPRISE', label: 'Plan ENTERPRISE' }
                  ]}
                  value={createForm.plan}
                  onChange={val => setCreateForm({ ...createForm, plan: val as 'FREE' | 'PRO' | 'ENTERPRISE' })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Ciudad (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. Guayaquil, Quito, Cuenca"
                  className="input"
                  value={createForm.city}
                  onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================= */}
      {/* 2. MODAL EDITAR USUARIO                        */}
      {/* ============================================= */}
      {editingUser && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: 'var(--radius-2xl)', maxWidth: '520px', width: '100%', padding: '2rem', boxShadow: 'var(--shadow-2xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit3 size={22} style={{ color: 'var(--primary-600)' }} />
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Modificar Usuario
                </h2>
              </div>
              <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Nombre Completo</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  className="input"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Combobox
                  label="Rol del Sistema"
                  options={[
                    { value: 'USER', label: 'USER' },
                    { value: 'ADMIN', label: 'ADMIN' }
                  ]}
                  value={editForm.role}
                  onChange={val => setEditForm({ ...editForm, role: val as 'USER' | 'ADMIN' })}
                />
                <Combobox
                  label="Estado de Cuenta"
                  options={[
                    { value: 'ACTIVE', label: 'ACTIVE (Activo)' },
                    { value: 'BLOCKED', label: 'BLOCKED (Bloqueado)' },
                    { value: 'SUSPENDED', label: 'SUSPENDED (Suspendido)' }
                  ]}
                  value={editForm.status}
                  onChange={val => setEditForm({ ...editForm, status: val as 'ACTIVE' | 'BLOCKED' | 'SUSPENDED' })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Combobox
                  label="Plan de Suscripción"
                  options={[
                    { value: 'FREE', label: 'FREE' },
                    { value: 'PRO', label: 'PRO' },
                    { value: 'ENTERPRISE', label: 'ENTERPRISE' }
                  ]}
                  value={editForm.plan}
                  onChange={val => setEditForm({ ...editForm, plan: val as 'FREE' | 'PRO' | 'ENTERPRISE' })}
                />

                <div className="input-group">
                  <label className="input-label">Ciudad</label>
                  <input
                    type="text"
                    className="input"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setEditingUser(null)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? 'Guardando...' : 'Actualizar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================= */}
      {/* 3. MODAL RESCATE / RESTABLECER CONTRASEÑA      */}
      {/* ============================================= */}
      {resettingUser && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: 'var(--radius-2xl)', maxWidth: '480px', width: '100%', padding: '2rem', boxShadow: 'var(--shadow-2xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Key size={22} style={{ color: 'var(--warning-600)' }} />
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Restablecer Contraseña (Rescate)
                </h2>
              </div>
              <button onClick={() => setResettingUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Asigna una nueva clave directa para <strong>{resettingUser.email}</strong>. Útil si el usuario olvidó sus accesos o no recibe correos OTP.
            </p>

            <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label className="input-label" style={{ margin: 0 }}>Nueva Contraseña</label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-600)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Copy size={12} />
                    <span>{generatedPassCopied ? '¡Copiada!' : 'Auto-generar y Copiar'}</span>
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    minLength={8}
                    placeholder="Escribe o auto-genera una clave"
                    className="input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setResettingUser(null)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isPending || !newPassword}>
                  {isPending ? 'Actualizando...' : 'Guardar Nueva Clave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================= */}
      {/* 4. MODAL ELIMINAR USUARIO                      */}
      {/* ============================================= */}
      {deletingUser && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: 'var(--radius-2xl)', maxWidth: '460px', width: '100%', padding: '2rem', boxShadow: 'var(--shadow-2xl)', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-full)', background: 'var(--danger-50)', color: 'var(--danger-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Trash2 size={28} />
            </div>

            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              ¿Eliminar definitivamente este cliente?
            </h2>

            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Esta acción eliminará de forma irreversible al usuario <strong>{deletingUser.email}</strong> y todos sus ingresos, deudas, gastos y metas de ahorro.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button type="button" onClick={() => setDeletingUser(null)} className="btn btn-secondary" disabled={isPending}>
                Cancelar
              </button>
              <button type="button" onClick={handleDeleteSubmit} className="btn btn-danger" disabled={isPending}>
                {isPending ? 'Eliminando...' : 'Sí, Eliminar Cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
