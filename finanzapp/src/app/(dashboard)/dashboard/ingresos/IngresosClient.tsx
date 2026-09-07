'use client';

import { useState, useMemo, useTransition } from 'react';
import { calculateNetIncome, type Deduction } from '@/lib/engine';
import { saveIncome, addDeduction, toggleDeduction, deleteDeduction } from '@/lib/actions';
import {
  Wallet,
  Save,
  Plus,
  Trash2,
  Check,
  X,
  ShieldCheck,
  Calculator,
  Percent,
  DollarSign,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';
import styles from './ingresos.module.css';

interface DeductionUI extends Deduction { id: string; }

interface Props {
  initialGross: number;
  initialDeductions: DeductionUI[];
}

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export default function IngresosClient({ initialGross, initialDeductions }: Props) {
  const [grossSalary, setGrossSalary] = useState(initialGross);
  const [deductions, setDeductions] = useState<DeductionUI[]>(initialDeductions);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [newDed, setNewDed] = useState({ name: '', type: 'OTHER', isPercentage: true, percentage: 0, fixedAmount: 0 });

  const incomeResult = useMemo(() => {
    if (grossSalary <= 0) return null;
    return calculateNetIncome({ grossSalary, deductions });
  }, [grossSalary, deductions]);

  const handleSave = () => {
    if (!incomeResult || grossSalary <= 0) return;
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    startTransition(async () => {
      await saveIncome({ grossAmount: grossSalary, netAmount: incomeResult.netSalary, period });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  };

  const handleToggle = (id: string) => {
    const ded = deductions.find(d => d.id === id);
    if (!ded) return;
    setDeductions(prev => prev.map(d => d.id === id ? { ...d, isActive: !d.isActive } : d));
    startTransition(() => void toggleDeduction(id, !ded.isActive));
  };

  const handleDelete = (id: string) => {
    setDeductions(prev => prev.filter(d => d.id !== id));
    startTransition(() => void deleteDeduction(id));
  };

  const handleAdd = () => {
    if (!newDed.name.trim()) return;
    const tempId = `temp-${Date.now()}`;
    const newItem: DeductionUI = {
      id: tempId, name: newDed.name, type: newDed.type,
      isPercentage: newDed.isPercentage,
      percentage: newDed.isPercentage ? newDed.percentage : undefined,
      fixedAmount: !newDed.isPercentage ? newDed.fixedAmount : undefined,
      isActive: true,
    };
    setDeductions(prev => [...prev, newItem]);
    setShowAddForm(false);
    setNewDed({ name: '', type: 'OTHER', isPercentage: true, percentage: 0, fixedAmount: 0 });
    startTransition(() => void addDeduction({
      name: newDed.name, type: newDed.type, isPercentage: newDed.isPercentage,
      percentage: newDed.isPercentage ? newDed.percentage : undefined,
      fixedAmount: !newDed.isPercentage ? newDed.fixedAmount : undefined,
    }));
  };

  const typeLabels: Record<string, string> = { IESS: 'Aporte IESS', IESS_LOAN: 'Préstamo Quirografario / Hipotecario', TAX: 'Impuesto Renta', ADVANCE: 'Anticipo Quincenal', OTHER: 'Otra Retención' };

  return (
    <div className={styles.incomePage}>
      <div className={styles.incomeHeader}>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className={styles.incomeTitle} style={{ fontSize: '1.5rem', fontWeight: 800 }}>Gestión de Ingresos & Rol</h2>
            <p className={styles.incomeSubtitle}>Configura tu sueldo base y deducciones de ley en Ecuador (IESS 9.45%).</p>
          </div>
          <button
            className={`btn btn-primary ${isPending ? 'btn-loading' : ''}`}
            onClick={handleSave}
            disabled={isPending || grossSalary <= 0}
          >
            {saved ? (
              <>
                <CheckCircle2 size={16} />
                <span>¡Guardado!</span>
              </>
            ) : isPending ? (
              <span>Guardando...</span>
            ) : (
              <>
                <Save size={16} />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className={styles.incomeGrid}>
        {/* Form column */}
        <div>
          <div className={styles.formCard}>
            <div className="flex items-center gap-2 mb-3">
              <Wallet size={18} color="var(--primary-400)" />
              <h3 className={styles.formTitle} style={{ margin: 0 }}>Salario Bruto Mensual</h3>
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="gross-salary">Salario nominal antes de descuentos (USD)</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <DollarSign size={18} />
                </span>
                <input
                  id="gross-salary"
                  type="number"
                  className="input"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={grossSalary || ''}
                  onChange={e => setGrossSalary(parseFloat(e.target.value) || 0)}
                  autoFocus
                  style={{ fontSize: 'var(--text-lg)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem', fontFamily: 'var(--font-mono)' }}
                  onClick={() => setGrossSalary(460)}
                  title="Salario Básico Unificado (SBU Ecuador)"
                >
                  $460 (SBU)
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem', fontFamily: 'var(--font-mono)' }}
                  onClick={() => setGrossSalary(800)}
                >
                  $800
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem', fontFamily: 'var(--font-mono)' }}
                  onClick={() => setGrossSalary(1200)}
                >
                  $1,200
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem', fontFamily: 'var(--font-mono)' }}
                  onClick={() => setGrossSalary(2000)}
                >
                  $2,000
                </button>
              </div>
              <span className="input-hint">Monto contractual pactado con tu empleador</span>
            </div>
          </div>

          <div className={styles.formCard} style={{ marginTop: 'var(--space-4)' }}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <TrendingDown size={18} color="var(--danger-400)" />
                <h3 className={styles.formTitle} style={{ margin: 0 }}>Deducciones & Aportes de Nómina</h3>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
                {showAddForm ? <X size={14} /> : <Plus size={14} />}
                <span>{showAddForm ? 'Cancelar' : 'Añadir Retención'}</span>
              </button>
            </div>

            {showAddForm && (
              <div className={styles.addDeductionForm}>
                <div className={styles.addDeductionGrid}>
                  <div className="input-group">
                    <label className="input-label">Concepto</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Ej: Quirografario IESS"
                      value={newDed.name}
                      onChange={e => setNewDed(p => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Categoría</label>
                    <select className="select" value={newDed.type} onChange={e => setNewDed(p => ({ ...p, type: e.target.value }))}>
                      {Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Modo de cálculo</label>
                    <select
                      className="select"
                      value={newDed.isPercentage ? 'pct' : 'fix'}
                      onChange={e => setNewDed(p => ({ ...p, isPercentage: e.target.value === 'pct' }))}
                    >
                      <option value="pct">Porcentaje (%)</option>
                      <option value="fix">Monto fijo ($)</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{newDed.isPercentage ? 'Valor (%)' : 'Valor ($)'}</label>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        {newDed.isPercentage ? <Percent size={16} /> : <DollarSign size={16} />}
                      </span>
                      <input
                        type="number"
                        className="input"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        value={(newDed.isPercentage ? newDed.percentage : newDed.fixedAmount) || ''}
                        onChange={e => {
                          const v = parseFloat(e.target.value) || 0;
                          setNewDed(p => p.isPercentage ? { ...p, percentage: v } : { ...p, fixedAmount: v });
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button className="btn btn-primary btn-sm" onClick={handleAdd}>
                    <Check size={14} />
                    <span>Agregar al rol</span>
                  </button>
                </div>
              </div>
            )}

            <div className={styles.deductionList}>
              {deductions.length === 0 ? (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', textAlign: 'center', padding: 'var(--space-4)' }}>
                  No hay deducciones configuradas.
                </p>
              ) : deductions.map(d => {
                const amount = d.isPercentage ? grossSalary * ((d.percentage ?? 0) / 100) : (d.fixedAmount ?? 0);
                return (
                  <div key={d.id} className={styles.deductionItem} style={{ opacity: d.isActive ? 1 : 0.4 }}>
                    <div className={styles.deductionItemInfo}>
                      <div className="flex items-center gap-2">
                        <span className={styles.deductionItemName}>{d.name}</span>
                        {d.type === 'IESS' && (
                          <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-400)', fontWeight: 700 }}>
                            Ley Ecuador
                          </span>
                        )}
                      </div>
                      <div className={styles.deductionItemType}>
                        {typeLabels[d.type] || d.type}
                        {d.isPercentage && d.percentage ? ` · ${d.percentage}% del bruto` : ' · Monto mensual fijo'}
                      </div>
                    </div>
                    <div className={styles.deductionItemAmount}>{d.isActive ? `−${fmt(amount)}` : 'Desactivado'}</div>
                    <button
                      className={`${styles.deductionToggle} ${d.isActive ? styles.active : ''}`}
                      onClick={() => handleToggle(d.id)}
                      aria-label={d.isActive ? 'Desactivar' : 'Activar'}
                      title={d.isActive ? 'Desactivar deducción' : 'Activar deducción'}
                    />
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDelete(d.id)}
                      title="Eliminar deducción"
                      style={{ padding: '0.35rem', color: 'var(--text-tertiary)' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Calculation */}
        <div className={styles.salaryDisplay}>
          <div className="flex items-center gap-2 mb-4">
            <Calculator size={18} color="var(--success-400)" />
            <h3 className={styles.formTitle} style={{ margin: 0 }}>Desglose de Nómina en Vivo</h3>
          </div>

          {grossSalary > 0 && incomeResult ? (
            <>
              <div className={styles.salaryRow}>
                <span className={styles.salaryLabel}>Sueldo Bruto Contratado</span>
                <span className={`${styles.salaryValue} ${styles.salaryGross}`}>{fmt(incomeResult.grossSalary)}</span>
              </div>

              {incomeResult.deductionBreakdown.map((d, i) => (
                <div key={i} className={styles.salaryRow}>
                  <span className={styles.salaryLabel}>
                    {d.name}{d.isPercentage && d.percentage ? ` (${d.percentage}%)` : ''}
                  </span>
                  <span className={`${styles.salaryValue} ${styles.salaryDeduction}`}>−{fmt(d.amount)}</span>
                </div>
              ))}

              <div className={styles.salaryDivider} />

              <div className={styles.salaryRow}>
                <span className={styles.salaryLabel}><strong>Total Retenciones de Rol</strong></span>
                <span className={`${styles.salaryValue} ${styles.salaryDeduction}`}>−{fmt(incomeResult.totalDeductions)}</span>
              </div>

              <div className={styles.netSalaryHighlight}>
                <div className={styles.netSalaryLabel}>Sueldo Neto a Recibir</div>
                <div className={styles.netSalaryAmount}>{fmt(incomeResult.netSalary)}</div>
                <div className={styles.deductionPercent}>{incomeResult.deductionPercentage}% descontado en rol</div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-tertiary)' }}>
              <Calculator size={36} color="var(--text-tertiary)" style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <p style={{ fontSize: 'var(--text-sm)' }}>Ingresa tu salario bruto para simular el rol neto en tiempo real.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
