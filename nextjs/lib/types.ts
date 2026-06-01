// Types for numi finance app

export interface CreditCard {
  id: string
  name: string
  limitUsd: number
  closeDay: number
  dueDay: number
  color: string
}

export interface Expense {
  id: string
  name: string
  type: 'fijo' | 'cuotas'
  amountArs: number
  amountUsd?: number
  totalInstallments?: number
  paidInstallments?: number
  cardId?: string // undefined = sin tarjeta
  startDate: string
}

export interface Income {
  id: string
  description: string
  amountArs?: number
  amountUsd?: number
  currency: 'ARS' | 'USD' | 'both'
  period: string
  exchangeRate?: number
}

export interface Debt {
  id: string
  description: string
  amount: number
  currency: 'ARS' | 'USD'
  status: 'activa' | 'saldada'
  notes?: string
}

export interface PendingMovement {
  id: string
  source: string
  date: string
  description: string
  amount: number
  currency: 'ARS' | 'USD'
  installment?: string
  status: 'pending' | 'confirmed' | 'discarded'
}

export interface Period {
  month: number
  year: number
  exchangeRate: number
}

// Expense with calculated values
export interface ExpenseWithCalculations extends Expense {
  monthlyArs: number
  remainingInstallments: number
  paidArs: number
  remainingArs: number
  totalArs: number
  progress: number
}

// Card with summary
export interface CardSummary extends CreditCard {
  usedUsd: number
  availableUsd: number
  closureArs: number
  expenses: ExpenseWithCalculations[]
}
