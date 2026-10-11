/**
 * Recommendation Engine — Fin593 Ecuador
 * Genera recomendaciones financieras explicables, auditables y orientadas a la acción diaria.
 */

export interface ActionCard {
  id: string;
  type: 'DEBT_URGENT' | 'BUDGET_WARNING' | 'SAVINGS_OPPORTUNITY' | 'SUPA_LEGAL' | 'CASHFLOW_RISK';
  severity: 'CRITICAL' | 'WARNING' | 'OPPORTUNITY' | 'INFO';
  badgeLabel: string;
  title: string;
  explanation: string;
  actionLabel: string;
  actionHref: string;
  estimatedImpact?: string;
  urgencyScore: number; // 0-100
}

export interface FinancialContext {
  netIncome: number;
  fixedExpenses: number;
  variableExpenses: number;
  debts: Array<{
    id: string;
    name: string;
    creditor?: string | null;
    type: string;
    totalOwed: number;
    monthlyPayment: number;
    interestRate?: number | null;
    nextDueDate?: Date | string | null;
    status: string;
  }>;
  savingsGoals: Array<{
    id: string;
    name: string;
    type: string;
    targetAmount: number;
    currentAmount: number;
    monthlyContribution?: number | null;
  }>;
}

export function generateActionPlan(ctx: FinancialContext): ActionCard[] {
  const cards: ActionCard[] = [];
  const now = new Date();
  const totalCommitted = ctx.fixedExpenses + ctx.variableExpenses + ctx.debts.reduce((s, d) => s + d.monthlyPayment, 0);
  const surplus = Math.max(0, ctx.netIncome - totalCommitted);
  const isDeficit = ctx.netIncome > 0 && ctx.netIncome < totalCommitted;
  const debtRatio = ctx.netIncome > 0 ? (ctx.debts.reduce((s, d) => s + d.monthlyPayment, 0) / ctx.netIncome) * 100 : 0;

  // 1. SUPA / Pensiones Alimenticias (Prioridad Legal Absoluta)
  const supaDebt = ctx.debts.find(d => 
    d.type === 'INFORMAL' && (d.name.toLowerCase().includes('supa') || d.name.toLowerCase().includes('alimentic')) ||
    d.name.toLowerCase().includes('pension') || d.name.toLowerCase().includes('supa')
  );
  if (supaDebt) {
    cards.push({
      id: `supa-${supaDebt.id}`,
      type: 'SUPA_LEGAL',
      severity: 'CRITICAL',
      badgeLabel: '⚖️ Prioridad Legal SUPA',
      title: `Pensión Alimenticia: ${supaDebt.name} ($${supaDebt.monthlyPayment.toFixed(2)})`,
      explanation: 'En Ecuador, el retraso en pensiones SUPA genera apremio personal y prohibición de salida del país. Es tu obligación legal número uno.',
      actionLabel: 'Registrar Pago SUPA',
      actionHref: '/dashboard/deudas',
      estimatedImpact: 'Evita medidas cautelares y garantiza estabilidad jurídica familiar.',
      urgencyScore: 100,
    });
  }

  // 2. Deudas vencidas o por vencer en menos de 3 días
  ctx.debts.forEach(d => {
    if (d.nextDueDate && d.status === 'ACTIVE') {
      const due = new Date(d.nextDueDate);
      const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        cards.push({
          id: `overdue-${d.id}`,
          type: 'DEBT_URGENT',
          severity: 'CRITICAL',
          badgeLabel: '🔴 Cuota Vencida',
          title: `${d.name} — Atraso de ${Math.abs(diffDays)} días ($${d.monthlyPayment.toFixed(2)})`,
          explanation: `Esta cuota venció hace ${Math.abs(diffDays)} días. Pagarla hoy detiene intereses de mora y previene el deterioro de tu score crediticio.`,
          actionLabel: 'Pagar Ahora',
          actionHref: '/dashboard/deudas',
          estimatedImpact: `Protege tu récord crediticio y ahorra cargos por cobranza.`,
          urgencyScore: 95,
        });
      } else if (diffDays <= 3) {
        cards.push({
          id: `due-soon-${d.id}`,
          type: 'DEBT_URGENT',
          severity: 'WARNING',
          badgeLabel: '🟠 Vence Pronto',
          title: `${d.name} — Vence ${diffDays === 0 ? 'HOY' : diffDays === 1 ? 'MAÑANA' : `en ${diffDays} días`} ($${d.monthlyPayment.toFixed(2)})`,
          explanation: `Asegura tener saldo disponible en tu cuenta para cubrir la cuota de $${d.monthlyPayment.toFixed(2)}.`,
          actionLabel: 'Ver Detalle',
          actionHref: '/dashboard/deudas',
          urgencyScore: 85,
        });
      }
    }
  });

  // 3. Situación de Déficit o Sobreendeudamiento
  if (isDeficit) {
    const deficitAmount = totalCommitted - ctx.netIncome;
    cards.push({
      id: 'budget-deficit',
      type: 'CASHFLOW_RISK',
      severity: 'CRITICAL',
      badgeLabel: '🔴 Déficit de Flujo',
      title: `Tus compromisos superan tus ingresos por $${deficitAmount.toFixed(2)}`,
      explanation: `Estás comprometiendo el ${((totalCommitted / ctx.netIncome) * 100).toFixed(0)}% de tus ingresos. Es prioritario pausar compras variables y reestructurar deudas de consumo.`,
      actionLabel: 'Ajustar Gastos',
      actionHref: '/dashboard/gastos',
      estimatedImpact: `Recortar gastos variables no esenciales reequilibrará tu flujo en 30 días.`,
      urgencyScore: 90,
    });
  } else if (debtRatio > 40) {
    cards.push({
      id: 'high-debt-ratio',
      type: 'BUDGET_WARNING',
      severity: 'WARNING',
      badgeLabel: '🟠 Alto Endeudamiento',
      title: `Tus deudas consumen el ${debtRatio.toFixed(0)}% de tus ingresos`,
      explanation: 'El umbral saludable en Ecuador es mantener tus cuotas bajo el 30% del ingreso neto para no ahogar tu liquidez.',
      actionLabel: 'Simular Estrategia Avalancha',
      actionHref: '/dashboard/deudas',
      estimatedImpact: 'Aplicar abonos extraordinarios a la deuda con mayor interés acelerará tu libertad financiera.',
      urgencyScore: 75,
    });
  }

  // 4. Fondo de Emergencia y Oportunidad de Ahorro
  const emergencyGoal = ctx.savingsGoals.find(g => g.type === 'EMERGENCY_FUND');
  const targetEmergency = ctx.fixedExpenses * 3;
  if (!emergencyGoal || emergencyGoal.currentAmount < targetEmergency) {
    const current = emergencyGoal?.currentAmount ?? 0;
    const progress = targetEmergency > 0 ? ((current / targetEmergency) * 100).toFixed(0) : '0';
    if (surplus > 20) {
      cards.push({
        id: 'emergency-fund-opp',
        type: 'SAVINGS_OPPORTUNITY',
        severity: 'OPPORTUNITY',
        badgeLabel: '🟢 Oportunidad de Ahorro',
        title: `Fondo de Emergencia al ${progress}% (Meta: $${targetEmergency.toFixed(2)})`,
        explanation: `Cuentas con un excedente disponible de $${surplus.toFixed(2)}. Si destinas $${(surplus * 0.5).toFixed(2)} hoy, blindarás tu hogar contra imprevistos.`,
        actionLabel: 'Abonar a Mi Fondo',
        actionHref: '/dashboard/ahorro',
        estimatedImpact: 'Construye un colchón financiero de 3 meses para gastos fijos.',
        urgencyScore: 60,
      });
    }
  }

  // Ordenar por urgencia decreciente
  return cards.sort((a, b) => b.urgencyScore - a.urgencyScore);
}
