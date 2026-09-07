/**
 * Default financial configuration for Ecuador.
 * These values are stored per-user in the DB (FinancialConfig table)
 * but these defaults are used for initialization.
 */

export const DEFAULT_CONFIGS: Record<string, { value: number; description: string }> = {
  IESS_PERSONAL_RATE: {
    value: 9.45,
    description: 'Aporte personal al IESS (%)',
  },
  IESS_EMPLOYER_RATE: {
    value: 11.15,
    description: 'Aporte patronal al IESS (%) — informativo',
  },
  BUDGET_NEEDS_PCT: {
    value: 50,
    description: 'Regla 50/30/20 — Necesidades (%)',
  },
  BUDGET_WANTS_PCT: {
    value: 30,
    description: 'Regla 50/30/20 — Deseos (%)',
  },
  BUDGET_SAVINGS_PCT: {
    value: 20,
    description: 'Regla 50/30/20 — Ahorro/Deuda (%)',
  },
  ALERT_DAYS_BEFORE: {
    value: 3,
    description: 'Días antes del vencimiento para alertar',
  },
  EMERGENCY_FUND_MONTHS: {
    value: 3,
    description: 'Meses de gastos fijos para fondo de emergencia (mínimo)',
  },
  HEALTH_DEBT_RATIO_GREEN: {
    value: 30,
    description: 'Umbral de ratio deuda/ingreso para semáforo verde (%)',
  },
  HEALTH_DEBT_RATIO_YELLOW: {
    value: 50,
    description: 'Umbral de ratio deuda/ingreso para semáforo amarillo (%)',
  },
};

export const CURRENCIES = [
  { code: 'USD', name: 'Dólar estadounidense', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'COP', name: 'Peso colombiano', symbol: '$' },
  { code: 'PEN', name: 'Sol peruano', symbol: 'S/' },
] as const;

export const PAY_FREQUENCIES = [
  { value: 'MONTHLY', label: 'Mensual', periods: 12 },
  { value: 'BIWEEKLY', label: 'Quincenal', periods: 24 },
  { value: 'WEEKLY', label: 'Semanal', periods: 52 },
] as const;

export const DEBT_TYPES = [
  { value: 'CREDIT_CARD', label: 'Tarjeta de crédito', icon: '💳' },
  { value: 'PERSONAL_LOAN', label: 'Préstamo personal', icon: '🏦' },
  { value: 'MORTGAGE', label: 'Hipoteca', icon: '🏠' },
  { value: 'CAR_LOAN', label: 'Préstamo vehicular', icon: '🚗' },
  { value: 'STUDENT_LOAN', label: 'Préstamo estudiantil', icon: '🎓' },
  { value: 'IESS_LOAN', label: 'Préstamo IESS', icon: '🏛️' },
  { value: 'INFORMAL', label: 'Deuda informal', icon: '🤝' },
  { value: 'OTHER', label: 'Otro', icon: '📋' },
] as const;

export const EXPENSE_CATEGORIES_DEFAULT = [
  { name: 'Arriendo', type: 'FIXED' as const, icon: '🏠', color: '#6366F1' },
  { name: 'Servicios básicos', type: 'FIXED' as const, icon: '💡', color: '#F59E0B' },
  { name: 'Internet/Teléfono', type: 'FIXED' as const, icon: '📱', color: '#3B82F6' },
  { name: 'Seguros', type: 'FIXED' as const, icon: '🛡️', color: '#8B5CF6' },
  { name: 'Alimentación', type: 'VARIABLE' as const, icon: '🍽️', color: '#10B981' },
  { name: 'Transporte', type: 'VARIABLE' as const, icon: '🚌', color: '#F97316' },
  { name: 'Salud', type: 'VARIABLE' as const, icon: '🏥', color: '#EF4444' },
  { name: 'Educación', type: 'VARIABLE' as const, icon: '📚', color: '#06B6D4' },
  { name: 'Entretenimiento', type: 'VARIABLE' as const, icon: '🎬', color: '#EC4899' },
  { name: 'Ropa', type: 'VARIABLE' as const, icon: '👕', color: '#84CC16' },
  { name: 'Cuidado personal', type: 'VARIABLE' as const, icon: '💇', color: '#D946EF' },
  { name: 'Otros', type: 'VARIABLE' as const, icon: '📦', color: '#64748B' },
];
