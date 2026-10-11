'use client';

import { useState } from 'react';
import {
  Sparkles,
  Send,
  Calculator,
  CheckCircle2,
  HelpCircle,
  Landmark,
} from 'lucide-react';
import {
  evaluateNewDebt,
  processFinancialAIQuery,
  LoanSimulationInput,
  LoanEvaluationResult,
  AIQueryResponse,
} from '@/lib/finance/ai-advisor';
import { Combobox } from '@/components/ui/Combobox';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface AIClientProps {
  userFinance: {
    netIncome: number;
    fixedExpenses: number;
    variableExpenses: number;
    totalDebtPayments: number;
    emergencyFund: number;
    debtsCount: number;
  };
}

export default function AIClient({ userFinance }: AIClientProps) {
  const [activeTab, setActiveTab] = useState<'advisor' | 'loan_evaluator'>('advisor');
  
  // Chat State
  const [promptInput, setPromptInput] = useState('');
  const [queryResponse, setQueryResponse] = useState<AIQueryResponse | null>(() =>
    processFinancialAIQuery('Diagnóstico general de mi salud financiera', userFinance)
  );

  // Loan Evaluator State
  const [loanInput, setLoanInput] = useState<LoanSimulationInput>({
    amount: 2500,
    termMonths: 24,
    annualInterestRate: 15.5,
    institutionType: 'BANCO',
    purpose: 'Consolidación de deudas o imprevisto',
  });
  const [loanResult, setLoanResult] = useState<LoanEvaluationResult | null>(() =>
    evaluateNewDebt(
      {
        amount: 2500,
        termMonths: 24,
        annualInterestRate: 15.5,
        institutionType: 'BANCO',
        purpose: 'Consolidación de deudas o imprevisto',
      },
      {
        ...userFinance,
        currentMonthlyDebtPayments: userFinance.totalDebtPayments,
      }
    )
  );

  const handleAsk = (questionText: string) => {
    if (!questionText.trim()) return;
    const res = processFinancialAIQuery(questionText, userFinance);
    setQueryResponse(res);
    setPromptInput('');
  };

  const handleSimulateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const result = evaluateNewDebt(loanInput, {
      ...userFinance,
      currentMonthlyDebtPayments: userFinance.totalDebtPayments,
    });
    setLoanResult(result);
  };

  const quickPrompts = [
    '¿Qué deuda debería pagar primero?',
    '¿Cuánto dinero tendré disponible a fin de mes?',
    '¿Dónde estoy gastando demasiado?',
    '¿Cómo optimizar mi fondo de emergencia?',
  ];

  return (
    <div style={{ animation: 'fadeInUp 0.35s ease-out', maxWidth: 1100, margin: '0 auto' }}>
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0B192C 0%, #1E3A8A 50%, #2563EB 100%)',
          borderRadius: 'var(--radius-2xl)',
          padding: '2rem',
          color: '#FFFFFF',
          marginBottom: 'var(--space-6)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 680 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              padding: '0.35rem 0.75rem',
              borderRadius: '999px',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              marginBottom: '0.75rem',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <Sparkles size={14} style={{ color: '#FDE047' }} />
            <span>Motor de Inteligencia Financiera Explicable</span>
          </div>

          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, margin: '0 0 0.5rem', lineHeight: 1.2 }}>
            Fin593 AI — Tu Copiloto Financiero
          </h2>
          <p style={{ margin: 0, opacity: 0.9, fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>
            Analiza tu flujo de caja real, simula préstamos antes de firmar y recibe recomendaciones transparentes
            basadas en la normativa y costo de vida de Ecuador.
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            marginTop: '1.5rem',
            display: 'inline-flex',
            gap: '0.5rem',
            background: 'rgba(5, 11, 20, 0.4)',
            padding: '0.35rem',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <button
            onClick={() => setActiveTab('advisor')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.25rem',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 'var(--text-xs)',
              transition: 'all 0.2s ease',
              background: activeTab === 'advisor' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'advisor' ? '#0B192C' : 'rgba(255, 255, 255, 0.8)',
            }}
          >
            <Sparkles size={16} />
            <span>Consultas Inteligentes</span>
          </button>
          <button
            onClick={() => setActiveTab('loan_evaluator')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.25rem',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 'var(--text-xs)',
              transition: 'all 0.2s ease',
              background: activeTab === 'loan_evaluator' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'loan_evaluator' ? '#0B192C' : 'rgba(255, 255, 255, 0.8)',
            }}
          >
            <Calculator size={16} />
            <span>¿Puedo Adquirir Esta Deuda?</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ASESOR DE CONSULTAS */}
      {activeTab === 'advisor' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-6)' }}>
          {/* Input & Quick Chips */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: '0.75rem' }}>
              ¿Qué decisión financiera quieres evaluar hoy?
            </h3>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <Input
                placeholder="Ej. ¿Qué deuda debería liquidar primero para ahorrar intereses?"
                value={promptInput}
                onChange={e => setPromptInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAsk(promptInput)}
                style={{
                  flex: 1,
                  minWidth: 260,
                  fontSize: 'var(--text-sm)',
                }}
              />
              <Button
                variant="primary"
                onClick={() => handleAsk(promptInput)}
                icon={<Send size={16} />}
              >
                Analizar
              </Button>
            </div>

            {/* Quick Prompt Chips */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                Preguntas frecuentes:
              </span>
              {quickPrompts.map(p => (
                <Button
                  key={p}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAsk(p)}
                  style={{ borderRadius: 'var(--radius-full)', color: 'var(--primary-600)' }}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>

          {/* AI Response Card */}
          {queryResponse && (
            <div
              className="glass-card"
              style={{
                padding: '2rem',
                borderLeft: '4px solid var(--primary-500)',
                animation: 'fadeInUp 0.3s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--primary-600)', textTransform: 'uppercase' }}>
                    Consulta Analizada
                  </span>
                  <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
                    {queryResponse.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    &ldquo;{queryResponse.question}&rdquo;
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    background: 'var(--bg-secondary)',
                    padding: '0.75rem 1.25rem',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Ingreso Neto</div>
                    <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      ${queryResponse.diagnosis.income.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ width: 1, background: 'var(--border-color)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Excedente</div>
                    <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--success-600)' }}>
                      ${queryResponse.diagnosis.surplus.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ width: 1, background: 'var(--border-color)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Endeudamiento</div>
                    <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: queryResponse.diagnosis.debtRatio > 40 ? 'var(--danger-600)' : 'var(--text-primary)' }}>
                      {queryResponse.diagnosis.debtRatio}%
                    </div>
                  </div>
                </div>
              </div>

              {/* 4-Pillar Explainable Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--primary-600)', fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                    <CheckCircle2 size={16} />
                    <span>Recomendación Central</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.5, fontWeight: 600 }}>
                    {queryResponse.recommendation}
                  </p>
                </div>

                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--info-600)', fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                    <HelpCircle size={16} />
                    <span>Explicabilidad / Motivo</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {queryResponse.reasoning}
                  </p>
                </div>
              </div>

              {/* Action Plan */}
              <div
                style={{
                  marginTop: '1.25rem',
                  background: 'var(--primary-50)',
                  border: '1px solid var(--primary-200)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-xl)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--primary-800)', marginBottom: '0.25rem' }}>
                    Plan de Acción Sugerido
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--primary-700)' }}>
                    {queryResponse.alternativeAction}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SIMULADOR DE NUEVA DEUDA */}
      {activeTab === 'loan_evaluator' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--space-6)' }}>
          {/* Form */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  background: 'var(--primary-100)',
                  color: 'var(--primary-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Landmark size={20} />
              </div>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: 'var(--text-lg)', margin: 0 }}>
                  Parámetros del Crédito
                </h3>
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                  Evalúa el impacto antes de endeudarte
                </p>
              </div>
            </div>

            <form onSubmit={handleSimulateLoan} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input
                label="Monto Solicitado ($ USD)"
                type="text"
                inputMode="decimal"
                value={loanInput.amount}
                onChange={e => setLoanInput({ ...loanInput, amount: Number(e.target.value) })}
                required
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input
                  label="Plazo (Meses)"
                  type="text"
                  inputMode="decimal"
                  value={loanInput.termMonths}
                  onChange={e => setLoanInput({ ...loanInput, termMonths: Number(e.target.value) })}
                  required
                />
                <Input
                  label="Tasa Anual Estimada (%)"
                  type="text"
                  inputMode="decimal"
                  value={loanInput.annualInterestRate}
                  onChange={e => setLoanInput({ ...loanInput, annualInterestRate: Number(e.target.value) })}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <Combobox
                  label="Tipo de Entidad / Origen"
                  options={[
                    { value: 'BANCO', label: 'Banco Privado (Tasa ~15%-16%)' },
                    { value: 'COOPERATIVA', label: 'Cooperativa de Ahorro y Crédito (~16%-20%)' },
                    { value: 'BIESS', label: 'BIESS Quirografario / Hipotecario (~11%-13%)' },
                    { value: 'COMERCIO', label: 'Crédito Comercial / Almacén (~22%-28%)' },
                    { value: 'INFORMAL', label: 'Crédito Informal / Particular' }
                  ]}
                  value={loanInput.institutionType}
                  onChange={val => setLoanInput({ ...loanInput, institutionType: val as 'BANCO' | 'COOPERATIVA' | 'BIESS' | 'COMERCIO' | 'INFORMAL' })}
                />
              </div>

              <Input
                label="Destino / Motivo"
                placeholder="Ej. Compra de computadora para trabajo"
                value={loanInput.purpose}
                onChange={e => setLoanInput({ ...loanInput, purpose: e.target.value })}
              />

              <Button
                variant="primary"
                type="submit"
                style={{ marginTop: '0.5rem', width: '100%' }}
                icon={<Calculator size={18} />}
              >
                Simular Impacto en Mi Presupuesto
              </Button>
            </form>
          </div>

          {/* Results Display */}
          {loanResult && (
            <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                    Resultado de Compatibilidad
                  </span>
                  <span
                    style={{
                      background: loanResult.badge.bg,
                      color: loanResult.badge.color,
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 800,
                    }}
                  >
                    {loanResult.badge.label}
                  </span>
                </div>

                {/* Metrics Box */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    background: 'var(--bg-secondary)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-xl)',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Cuota Proyectada</div>
                    <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      ${loanResult.calculatedMonthlyPayment.toFixed(2)}/mes
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Total en Intereses</div>
                    <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--danger-600)' }}>
                      ${loanResult.totalInterestToPay.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Endeudamiento Actual</div>
                    <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {loanResult.currentDebtToIncomeRatio}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Nuevo Endeudamiento</div>
                    <div
                      style={{
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                        color: loanResult.newDebtToIncomeRatio > 40 ? 'var(--danger-600)' : 'var(--success-600)',
                      }}
                    >
                      {loanResult.newDebtToIncomeRatio}%
                    </div>
                  </div>
                </div>

                {/* Diagnosis & Recommendations */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Diagnóstico
                  </div>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {loanResult.diagnosis}
                  </p>
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Recomendación
                  </div>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {loanResult.recommendation}
                  </p>
                </div>
              </div>

              {/* Alternative advice */}
              <div
                style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                }}
              >
                💡 <strong>Alternativa inteligente:</strong> {loanResult.alternative}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
