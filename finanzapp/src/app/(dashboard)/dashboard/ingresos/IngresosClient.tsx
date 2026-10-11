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
  Calculator,
  Percent,
  TrendingDown,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { Combobox } from '@/components/ui/Combobox';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
    if (!incomeResult || grossSalary <= 0) {
      alert('Ingresa un salario bruto mayor a 0 antes de guardar.');
      return;
    }
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    startTransition(async () => {
      const res = await saveIncome({ grossAmount: grossSalary, netAmount: incomeResult.netSalary, period });
      if (res.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert(res.error || 'Error al guardar el ingreso');
      }
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
    if (!newDed.name.trim()) {
      alert('Ingresa el nombre de la deducción.');
      return;
    }
    const tempId = `temp-${Date.now()}`;
    const newItem: DeductionUI = {
      id: tempId, name: newDed.name, type: newDed.type,
      isPercentage: newDed.isPercentage,
      percentage: newDed.isPercentage ? newDed.percentage : undefined,
      fixedAmount: !newDed.isPercentage ? newDed.fixedAmount : undefined,
      isActive: true,
    };
    startTransition(async () => {
      const res = await addDeduction({
        name: newDed.name, type: newDed.type, isPercentage: newDed.isPercentage,
        percentage: newDed.isPercentage ? newDed.percentage : undefined,
        fixedAmount: !newDed.isPercentage ? newDed.fixedAmount : undefined,
      });
      if (res.success) {
        setDeductions(prev => [...prev, newItem]);
        setShowAddForm(false);
        setNewDed({ name: '', type: 'OTHER', isPercentage: true, percentage: 0, fixedAmount: 0 });
      } else {
        alert(res.error || 'Error al agregar la deducción');
      }
    });
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
          <Button
            variant="primary"
            isLoading={isPending}
            onClick={handleSave}
            disabled={grossSalary <= 0}
            icon={saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          >
            {saved ? '¡Guardado!' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>

      <div className={styles.incomeGrid}>
        {/* Form column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className={styles.formCard}>
            <div className="flex items-center gap-2 mb-3">
              <Wallet size={18} color="var(--primary-500)" />
              <h3 className={styles.formTitle} style={{ margin: 0 }}>Salario Bruto Mensual</h3>
            </div>
            <Input
              label="Salario nominal antes de descuentos (USD)"
              id="gross-salary"
              type="text"
              inputMode="decimal"
              icon={<DollarSign size={20} />}
              placeholder="0.00"
              value={grossSalary || ''}
              onChange={e => setGrossSalary(parseFloat(e.target.value) || 0)}
              autoFocus
              style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono)', fontWeight: 800 }}
              hint="Monto pactado en contrato laboral con tu empleador en Ecuador"
            />
            <div className={styles.presetsGroup}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                Valores frecuentes:
              </span>
              {[
                { label: '$460 (SBU Ecuador)', val: 460, title: 'Salario Básico Unificado' },
                { label: '$800', val: 800 },
                { label: '$1,200', val: 1200 },
                { label: '$2,000', val: 2000 },
                { label: '$3,500', val: 3500 },
              ].map(p => (
                <button
                  key={p.val}
                  type="button"
                  className={`${styles.presetChip} ${grossSalary === p.val ? styles.presetChipActive : ''}`}
                  onClick={() => setGrossSalary(p.val)}
                  title={p.title || `Fijar salario en $${p.val}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.formCard}>
            <div className={styles.formCardHeader}>
              <div className="flex items-center gap-2">
                <TrendingDown size={18} color="var(--danger-500)" />
                <h3 className={styles.formTitle} style={{ margin: 0 }}>Deducciones & Retenciones</h3>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
                icon={showAddForm ? <X size={14} /> : <Plus size={14} />}
              >
                {showAddForm ? 'Cancelar' : 'Añadir Retención'}
              </Button>
            </div>

            {showAddForm && (
              <div className={styles.addDeductionForm}>
                <div className={styles.addDeductionGrid}>
                  <Input
                    label="Concepto"
                    type="text"
                    placeholder="Ej: Quirografario IESS"
                    value={newDed.name}
                    onChange={e => setNewDed(p => ({ ...p, name: e.target.value }))}
                  />
                  <Combobox
                    label="Categoría"
                    options={Object.entries(typeLabels).map(([v, l]) => ({ value: v, label: l }))}
                    value={newDed.type}
                    onChange={val => setNewDed(p => ({ ...p, type: val }))}
                  />
                  <Combobox
                    label="Modo de cálculo"
                    options={[
                      { value: 'pct', label: 'Porcentaje (%)' },
                      { value: 'fix', label: 'Monto fijo ($)' }
                    ]}
                    value={newDed.isPercentage ? 'pct' : 'fix'}
                    onChange={val => setNewDed(p => ({ ...p, isPercentage: val === 'pct' }))}
                  />
                  <Input
                    label={newDed.isPercentage ? 'Valor (%)' : 'Valor ($)'}
                    type="text"
                    inputMode="decimal"
                    icon={newDed.isPercentage ? <Percent size={16} /> : <DollarSign size={16} />}
                    placeholder="0.00"
                    value={(newDed.isPercentage ? newDed.percentage : newDed.fixedAmount) || ''}
                    onChange={e => {
                      const v = parseFloat(e.target.value) || 0;
                      setNewDed(p => p.isPercentage ? { ...p, percentage: v } : { ...p, fixedAmount: v });
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <Button variant="primary" size="sm" onClick={handleAdd} icon={<Check size={14} />}>
                    Agregar al rol
                  </Button>
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
                      <div className={styles.deductionItemTitleRow}>
                        <span className={styles.deductionItemName}>{d.name}</span>
                        {d.type === 'IESS' && (
                          <span className={styles.deductionLawBadge}>
                            Ley Ecuador (9.45%)
                          </span>
                        )}
                      </div>
                      <div className={styles.deductionItemType}>
                        {typeLabels[d.type] || d.type}
                        {d.isPercentage && d.percentage ? ` · ${d.percentage}% del sueldo bruto` : ' · Monto mensual fijo'}
                      </div>
                    </div>
                    <div className={styles.deductionItemControls}>
                      <div className={styles.deductionItemAmount}>{d.isActive ? `−${fmt(amount)}` : 'Desactivado'}</div>
                      <div className={styles.deductionItemActions}>
                        <button
                          className={`${styles.deductionToggle} ${d.isActive ? styles.active : ''}`}
                          onClick={() => handleToggle(d.id)}
                          aria-label={d.isActive ? 'Desactivar' : 'Activar'}
                          title={d.isActive ? 'Desactivar deducción' : 'Activar deducción'}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(d.id)}
                          title="Eliminar deducción"
                          style={{ padding: '0.35rem', color: 'var(--text-tertiary)' }}
                          icon={<Trash2 size={15} />}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Calculation */}
        <div className={styles.salaryDisplay}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calculator size={18} color="var(--primary-500)" />
              <h3 className={styles.formTitle} style={{ margin: 0 }}>Rol de Pagos en Vivo</h3>
            </div>
            <span className={styles.payrollBadge}>
              <CheckCircle2 size={12} /> Cálculo Oficial IESS
            </span>
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
                <div className={styles.netSalaryLabel}>Sueldo Líquido a Recibir</div>
                <div className={styles.netSalaryAmount}>{fmt(incomeResult.netSalary)}</div>
                <div className={styles.deductionPercent}>
                  {incomeResult.deductionPercentage}% descontado en rol mensual
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-tertiary)' }}>
              <Calculator size={36} color="var(--text-tertiary)" style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <p style={{ fontSize: 'var(--text-sm)', margin: 0 }}>
                Ingresa tu salario bruto para simular tu rol neto mensual en tiempo real.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
