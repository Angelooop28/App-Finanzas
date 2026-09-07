'use client';

import { useState, useTransition, useMemo } from 'react';
import { addExpense, deleteExpense } from '@/lib/actions';
import {
  ReceiptText,
  Plus,
  X,
  Trash2,
  Calendar,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  TrendingDown,
  Layers,
  Repeat,
  Tag,
} from 'lucide-react';

interface Expense {
  id: string; description: string | null; amount: number; date: string;
  isRecurring: boolean; categoryId: string; categoryName: string; categoryIcon: string; categoryColor: string;
}
interface Category { id: string; name: string; icon: string; color: string; type: string; }

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export default function GastosClient({ initialExpenses, categories, currentPeriod }: { initialExpenses: Expense[]; categories: Category[]; currentPeriod: string }) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'FIXED' | 'VARIABLE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ categoryId: categories[0]?.id || '', description: '', amount: 0, date: new Date().toISOString().split('T')[0], isRecurring: false });

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const fixedTotal = expenses.filter(e => { const cat = categories.find(c => c.id === e.categoryId); return cat?.type === 'FIXED'; }).reduce((s, e) => s + e.amount, 0);
  const variableTotal = total - fixedTotal;

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const cat = categories.find(c => c.id === e.categoryId);
      const matchesType = filterType === 'ALL' ? true : cat?.type === filterType;
      const matchesSearch = searchQuery.trim() === ''
        ? true
        : (e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           e.categoryName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesType && matchesSearch;
    });
  }, [expenses, categories, filterType, searchQuery]);

  const byCategory = useMemo(() => {
    const map: Record<string, { name: string; icon: string; color: string; total: number; count: number }> = {};
    expenses.forEach(e => {
      if (!map[e.categoryId]) map[e.categoryId] = { name: e.categoryName, icon: e.categoryIcon, color: e.categoryColor, total: 0, count: 0 };
      map[e.categoryId].total += e.amount;
      map[e.categoryId].count++;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [expenses]);

  const handleAdd = () => {
    if (!form.categoryId || form.amount <= 0) return;
    const cat = categories.find(c => c.id === form.categoryId);
    startTransition(async () => {
      await addExpense(form);
      setExpenses(prev => [{ id: `temp-${Date.now()}`, ...form, description: form.description || null, categoryName: cat?.name || 'Otro', categoryIcon: cat?.icon || '📦', categoryColor: cat?.color || '#64748B' }, ...prev]);
      setShowForm(false);
      setForm({ categoryId: categories[0]?.id || '', description: '', amount: 0, date: new Date().toISOString().split('T')[0], isRecurring: false });
    });
  };

  const handleDelete = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    startTransition(() => void deleteExpense(id));
  };

  const monthLabel = (() => {
    const [y, m] = currentPeriod.split('-');
    return new Date(+y, +m - 1).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });
  })();

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Control de Gastos</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
            {monthLabel} · Supervisa salidas fijas y variables
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X size={16} /> : <Plus size={16} />}
          <span>{showForm ? 'Cancelar' : 'Nuevo Gasto'}</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div className="flex items-center gap-2 mb-2">
            <ReceiptText size={18} color="var(--warning-400)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>Gasto Total del Mes</span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--warning-400)' }}>{fmt(total)}</div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{expenses.length} transacciones registradas</span>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div className="flex items-center gap-2 mb-2">
            <Layers size={18} color="var(--primary-400)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>Gastos Fijos</span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--primary-400)' }}>{fmt(fixedTotal)}</div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Arriendo, servicios y colegiaturas</span>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div className="flex items-center gap-2 mb-2">
            <Tag size={18} color="var(--text-secondary)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>Gastos Variables</span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{fmt(variableTotal)}</div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Entretenimiento y compras extras</span>
        </div>
      </div>

      {/* Category Breakdown Bar */}
      {byCategory.length > 0 && (
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.875rem' }}>Distribución de Egresos por Categoría</h3>
          <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', marginBottom: '1rem', background: 'rgba(15, 23, 42, 0.8)' }}>
            {byCategory.map(([id, c]) => (
              <div key={id} style={{ width: `${total > 0 ? (c.total / total) * 100 : 0}%`, background: c.color, transition: 'width 0.5s' }} />
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {byCategory.map(([id, c]) => (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                <span>{c.name}: <strong style={{ color: 'var(--text-primary)' }}>{fmt(c.total)}</strong></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', animation: 'fadeInDown 0.3s ease-out' }}>
          <div className="flex items-center gap-2 mb-4">
            <Plus size={18} color="var(--primary-400)" />
            <h3 style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>Registrar Nuevo Gasto</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Categoría *</label>
              <select className="select" value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Monto en USD ($) *</label>
              <div className="input-wrapper">
                <span className="input-icon"><DollarSign size={16} /></span>
                <input className="input" type="number" min="0" step="0.01" placeholder="0.00" value={form.amount || ''} onChange={e => setForm(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Descripción / Lugar</label>
              <input className="input" placeholder="Ej: Supermaxi compras quincena" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Fecha del gasto</label>
              <input className="input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
          </div>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isRecurring} onChange={e => setForm(p => ({ ...p, isRecurring: e.target.checked }))} style={{ accentColor: 'var(--primary-500)' }} />
            <span>Gasto recurrente cada mes</span>
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            <button className={`btn btn-primary ${isPending ? 'btn-loading' : ''}`} onClick={handleAdd} disabled={isPending}>
              <span>Guardar Gasto</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${filterType === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterType('ALL')}
          >
            Todos ({expenses.length})
          </button>
          <button
            className={`btn btn-sm ${filterType === 'FIXED' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterType('FIXED')}
          >
            Fijos
          </button>
          <button
            className={`btn btn-sm ${filterType === 'VARIABLE' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterType('VARIABLE')}
          >
            Variables
          </button>
        </div>

        <div className="input-wrapper" style={{ maxWidth: 260 }}>
          <span className="input-icon">
            <Search size={15} />
          </span>
          <input
            type="text"
            className="input"
            placeholder="Buscar por nombre..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ padding: '0.45rem 1rem 0.45rem 2.5rem', fontSize: 'var(--text-xs)' }}
          />
        </div>
      </div>

      {/* Expense List */}
      {filteredExpenses.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
          <ReceiptText size={42} color="var(--text-tertiary)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>No se encontraron gastos</h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
            {searchQuery ? 'Prueba con otro término de búsqueda.' : 'Registra tus compras y consumos para control de presupuesto.'}
          </p>
          {!searchQuery && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={16} />
              <span>Registrar primer gasto</span>
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filteredExpenses.map(e => (
            <div key={e.id} className="glass-card" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-lg)', background: `${e.categoryColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: e.categoryColor, flexShrink: 0 }}>
                <ReceiptText size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.description || e.categoryName}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 2 }}>
                  <span>{new Date(e.date).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}</span>
                  <span>· {e.categoryName}</span>
                  {e.isRecurring && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: '1px 6px', borderRadius: 4, background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-400)', fontSize: '0.65rem', fontWeight: 600 }}>
                      <Repeat size={10} /> Recurrente
                    </span>
                  )}
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--warning-400)', whiteSpace: 'nowrap' }}>
                {fmt(e.amount)}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => handleDelete(e.id)}
                title="Eliminar gasto"
                style={{ padding: '0.35rem', color: 'var(--danger-400)' }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
