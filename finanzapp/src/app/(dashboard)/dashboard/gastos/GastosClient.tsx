'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { addExpense, deleteExpense } from '@/lib/actions';
import {
  ReceiptText,
  Plus,
  Trash2,
  DollarSign,
  Search,
  Layers,
  Repeat,
  Tag,
  AlertTriangle,
  Check,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Combobox, ComboboxOption } from '@/components/ui/Combobox';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Expense {
  id: string;
  description: string | null;
  amount: number;
  date: string;
  isRecurring: boolean;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
}

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export default function GastosClient({
  initialExpenses,
  categories,
  currentPeriod,
}: {
  initialExpenses: Expense[];
  categories: Category[];
  currentPeriod: string;
}) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'FIXED' | 'VARIABLE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    categoryId: categories[0]?.id || '',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
  });

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const fixedTotal = expenses
    .filter(e => {
      const cat = categories.find(c => c.id === e.categoryId);
      return cat?.type === 'FIXED';
    })
    .reduce((s, e) => s + e.amount, 0);
  const variableTotal = Math.max(0, total - fixedTotal);
  const fixedPercent = total > 0 ? Math.round((fixedTotal / total) * 100) : 0;
  const variablePercent = total > 0 ? Math.round((variableTotal / total) * 100) : 0;

  // Transform categories to Combobox options with icons
  const categoryOptions: ComboboxOption[] = useMemo(() => {
    return categories.map(c => ({
      value: c.id,
      label: c.name,
      group: c.type === 'FIXED' ? '🔒 Gastos Fijos (Esenciales)' : '🎯 Gastos Variables / Deseo',
      icon: <span style={{ fontSize: '1.1rem' }}>{c.icon || '🏷️'}</span>,
      description: c.type === 'FIXED' ? 'Costo recurrente mensual' : 'Gasto discrecional o variable',
    }));
  }, [categories]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const cat = categories.find(c => c.id === e.categoryId);
      const matchesType = filterType === 'ALL' ? true : cat?.type === filterType;
      const matchesSearch =
        searchQuery.trim() === ''
          ? true
          : (e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
            e.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [expenses, categories, filterType, searchQuery]);

  const byCategory = useMemo(() => {
    const map: Record<string, { name: string; icon: string; color: string; total: number; count: number }> = {};
    expenses.forEach(e => {
      if (!map[e.categoryId]) {
        map[e.categoryId] = {
          name: e.categoryName,
          icon: e.categoryIcon,
          color: e.categoryColor,
          total: 0,
          count: 0,
        };
      }
      map[e.categoryId].total += e.amount;
      map[e.categoryId].count++;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [expenses]);

  // Find top spending categories for automated insights
  const topCategory = byCategory[0];
  const topCategoryPercent = total > 0 && topCategory ? Math.round((topCategory[1].total / total) * 100) : 0;

  const handleAdd = () => {
    if (!form.categoryId || form.amount <= 0) {
      alert('Selecciona una categoría e ingresa un monto mayor a 0.');
      return;
    }
    const cat = categories.find(c => c.id === form.categoryId);
    startTransition(async () => {
      const res = await addExpense(form);
      if (res.success) {
        setExpenses(prev => [
          {
            id: `temp-${Date.now()}`,
            ...form,
            description: form.description || null,
            categoryName: cat?.name || 'Otro',
            categoryIcon: cat?.icon || '📦',
            categoryColor: cat?.color || '#2563EB',
          },
          ...prev,
        ]);
        setShowModal(false);
        setForm({
          categoryId: categories[0]?.id || '',
          description: '',
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          isRecurring: false,
        });
      } else {
        alert(res.error || 'Error al guardar el gasto');
      }
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
    <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Centro de Control de Gastos
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', textTransform: 'capitalize', marginTop: '2px' }}>
            {monthLabel} · Entiende dónde se va tu dinero y toma mejores decisiones.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowModal(true)}
          icon={<Plus size={18} />}
        >
          Registrar Gasto
        </Button>
      </div>

      {/* Level 1: KPIs Hierarchy */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <StatCard
          title="Gastos del Mes"
          value={fmt(total)}
          subtitle={`${expenses.length} transacciones registradas`}
          icon={<ReceiptText size={18} color="var(--warning-500)" />}
          iconBg="rgba(245, 158, 11, 0.12)"
          badge={{ text: 'Acumulado', variant: 'warning' }}
        />

        <StatCard
          title="Gastos Fijos"
          value={fmt(fixedTotal)}
          subtitle={`${fixedPercent}% del total del mes`}
          icon={<Layers size={18} color="var(--brand-navy-500)" />}
          iconBg="rgba(37, 99, 235, 0.1)"
          badge={{ text: `${fixedPercent}%`, variant: 'primary' }}
        />

        <StatCard
          title="Gastos Variables"
          value={fmt(variableTotal)}
          subtitle={`${variablePercent}% del total del mes`}
          icon={<Tag size={18} color="var(--text-secondary)" />}
          iconBg="var(--bg-secondary)"
          badge={{ text: `${variablePercent}%`, variant: 'neutral' }}
        />
      </div>

      {/* Level 2: Attention & Category Insights */}
      {topCategory && total > 0 && (
        <div
          className="card"
          style={{
            padding: '1.25rem 1.5rem',
            marginBottom: '1.75rem',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.03) 0%, rgba(245, 158, 11, 0.03) 100%), var(--bg-primary)',
            border: '1px solid var(--glass-border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <AlertTriangle size={18} color="var(--warning-500)" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Distribución y Diagnóstico de Categorías
              </h3>
            </div>
            {topCategoryPercent >= 35 && (
              <Badge variant="warning" size="sm" dot>
                {topCategory[1].name} concentra el {topCategoryPercent}% del gasto
              </Badge>
            )}
          </div>

          {/* Segmented Category Progress Bar */}
          <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', marginBottom: '1rem', background: 'var(--bg-secondary)' }}>
            {byCategory.map(([id, c]) => (
              <div
                key={id}
                title={`${c.name}: ${fmt(c.total)}`}
                style={{
                  width: `${(c.total / total) * 100}%`,
                  background: c.color || 'var(--brand-navy-500)',
                  transition: 'width 0.4s ease',
                }}
              />
            ))}
          </div>

          {/* Category Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {byCategory.map(([id, c]) => (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color || 'var(--brand-navy-500)', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-secondary)' }}>
                  {c.icon} {c.name}: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{fmt(c.total)}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Level 3: Search & Filter Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button
            variant={filterType === 'ALL' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterType('ALL')}
          >
            Todos ({expenses.length})
          </Button>
          <Button
            variant={filterType === 'FIXED' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterType('FIXED')}
          >
            🔒 Fijos
          </Button>
          <Button
            variant={filterType === 'VARIABLE' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterType('VARIABLE')}
          >
            🎯 Variables
          </Button>
        </div>

        <div style={{ maxWidth: 300 }}>
          <Input
            type="text"
            icon={<Search size={16} />}
            placeholder="Buscar por nombre o categoría..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Level 4: Transaction List (Table on Desktop, Cards on Mobile) */}
      {filteredExpenses.length === 0 ? (
        <EmptyState
          icon={<ReceiptText size={32} color="var(--text-tertiary)" />}
          title={searchQuery ? 'No se encontraron gastos con ese criterio' : '¡Aún no tienes gastos registrados este mes!'}
          description={searchQuery ? 'Prueba cambiando el texto de búsqueda o el filtro de categoría.' : 'Registra tus consumos diarios, arriendos o compras para mantener tu presupuesto al día.'}
          actionText={!searchQuery ? 'Registrar primer gasto' : undefined}
          onAction={() => setShowModal(true)}
          actionIcon={<Plus size={16} />}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {filteredExpenses.map(expense => (
            <div
              key={expense.id}
              className="card"
              style={{
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 'var(--radius-xl)',
                    background: `${expense.categoryColor || '#2563EB'}18`,
                    color: expense.categoryColor || 'var(--brand-navy-500)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0,
                  }}
                >
                  {expense.categoryIcon || '🧾'}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {expense.description || expense.categoryName}
                    </span>
                    {expense.isRecurring && (
                      <Badge variant="primary" size="sm" dot>
                        <Repeat size={10} style={{ marginRight: 2 }} /> Recurrente
                      </Badge>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px' }}>
                    <span>{new Date(expense.date).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span>· {expense.categoryName}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                  {fmt(expense.amount)}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(expense.id)}
                  title="Eliminar registro"
                  style={{ color: 'var(--danger-500)', padding: '0.35rem' }}
                  icon={<Trash2 size={16} />}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form for Adding Expense */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Registrar Nuevo Gasto"
        subtitle="Ingresa el monto y categoría para contabilizarlo en tu balance mensual"
        icon={<Sparkles size={20} />}
        maxWidth="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input
            label="Monto del gasto ($) *"
            type="text"
            inputMode="decimal"
            icon={<DollarSign size={18} />}
            placeholder="0.00"
            value={form.amount || ''}
            onChange={e => setForm(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
            style={{ fontSize: '1.2rem', fontWeight: 700 }}
            autoFocus
          />

          <Combobox
            label="Categoría de gasto"
            options={categoryOptions}
            value={form.categoryId}
            onChange={val => setForm(p => ({ ...p, categoryId: val }))}
            required
          />

          <Input
            label="Descripción o comercio (Opcional)"
            placeholder="Ej: Supermaxi compras quincena / Arriendo"
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          />

          <Input
            label="Fecha del gasto"
            type="date"
            icon={<Calendar size={16} />}
            value={form.date}
            onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
          />

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.isRecurring}
              onChange={e => setForm(p => ({ ...p, isRecurring: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: 'var(--brand-navy-600)' }}
            />
            <span>Marcar como gasto fijo recurrente cada mes</span>
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleAdd}
              disabled={isPending || !form.categoryId || form.amount <= 0}
              icon={<Check size={16} />}
            >
              Guardar Gasto
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
