import { CreditCard, Expense, Income, Debt, PendingMovement, Period } from './types'

// Sample credit cards
export const sampleCards: CreditCard[] = [
  {
    id: 'naranjax',
    name: 'NaranjaX',
    limitUsd: 2500,
    closeDay: 15,
    dueDay: 5,
    color: 'from-orange-500 to-orange-600'
  },
  {
    id: 'bbva',
    name: 'BBVA',
    limitUsd: 3000,
    closeDay: 20,
    dueDay: 10,
    color: 'from-blue-600 to-blue-700'
  },
  {
    id: 'visa-galicia',
    name: 'Visa Galicia',
    limitUsd: 1800,
    closeDay: 10,
    dueDay: 28,
    color: 'from-red-500 to-red-600'
  }
]

// Sample expenses
export const sampleExpenses: Expense[] = [
  // NaranjaX expenses
  {
    id: 'e1',
    name: 'Spotify Premium',
    type: 'fijo',
    amountArs: 0,
    amountUsd: 5.99,
    cardId: 'naranjax',
    startDate: '2024-01-01'
  },
  {
    id: 'e2',
    name: 'MacBook Air M3',
    type: 'cuotas',
    amountArs: 0,
    amountUsd: 999,
    totalInstallments: 12,
    paidInstallments: 5,
    cardId: 'naranjax',
    startDate: '2026-01-15'
  },
  {
    id: 'e3',
    name: 'iPhone 15 Pro',
    type: 'cuotas',
    amountArs: 0,
    amountUsd: 899,
    totalInstallments: 18,
    paidInstallments: 8,
    cardId: 'naranjax',
    startDate: '2025-10-01'
  },
  // BBVA expenses
  {
    id: 'e4',
    name: 'Netflix Premium',
    type: 'fijo',
    amountArs: 0,
    amountUsd: 22.99,
    cardId: 'bbva',
    startDate: '2024-03-01'
  },
  {
    id: 'e5',
    name: 'Supermercado Coto',
    type: 'cuotas',
    amountArs: 185000,
    totalInstallments: 3,
    paidInstallments: 1,
    cardId: 'bbva',
    startDate: '2026-04-15'
  },
  {
    id: 'e6',
    name: 'PlayStation 5',
    type: 'cuotas',
    amountArs: 0,
    amountUsd: 449,
    totalInstallments: 6,
    paidInstallments: 4,
    cardId: 'bbva',
    startDate: '2026-02-01'
  },
  // Visa Galicia expenses
  {
    id: 'e7',
    name: 'Disney+',
    type: 'fijo',
    amountArs: 0,
    amountUsd: 13.99,
    cardId: 'visa-galicia',
    startDate: '2024-06-01'
  },
  {
    id: 'e8',
    name: 'Aire acondicionado',
    type: 'cuotas',
    amountArs: 420000,
    totalInstallments: 12,
    paidInstallments: 7,
    cardId: 'visa-galicia',
    startDate: '2025-11-01'
  },
  // Sin tarjeta (efectivo/débito)
  {
    id: 'e9',
    name: 'Internet Fibertel',
    type: 'fijo',
    amountArs: 28500,
    startDate: '2024-01-01'
  },
  {
    id: 'e10',
    name: 'Monotributo',
    type: 'fijo',
    amountArs: 45000,
    startDate: '2024-01-01'
  },
  {
    id: 'e11',
    name: 'Alquiler',
    type: 'fijo',
    amountArs: 380000,
    startDate: '2024-01-01'
  },
  {
    id: 'e12',
    name: 'Expensas',
    type: 'fijo',
    amountArs: 65000,
    startDate: '2024-01-01'
  }
]

// Sample incomes
export const sampleIncomes: Income[] = [
  {
    id: 'i1',
    description: 'Sueldo empresa',
    amountArs: 1850000,
    currency: 'ARS',
    period: '2026-05',
    exchangeRate: 1420
  },
  {
    id: 'i2',
    description: 'Freelance - Proyecto web',
    amountUsd: 800,
    currency: 'USD',
    period: '2026-05',
    exchangeRate: 1420
  },
  {
    id: 'i3',
    description: 'Dividendos',
    amountUsd: 150,
    currency: 'USD',
    period: '2026-05',
    exchangeRate: 1420
  }
]

// Sample debts
export const sampleDebts: Debt[] = [
  {
    id: 'd1',
    description: 'Préstamo familiar',
    amount: 500,
    currency: 'USD',
    status: 'activa',
    notes: 'Devolver antes de julio'
  },
  {
    id: 'd2',
    description: 'Deuda AFIP',
    amount: 125000,
    currency: 'ARS',
    status: 'activa',
    notes: 'Plan de pagos'
  }
]

// Sample pending movements
export const samplePendingMovements: PendingMovement[] = [
  {
    id: 'pm1',
    source: 'NaranjaX',
    date: '2026-05-12',
    description: 'MERCADOLIBRE',
    amount: 45.99,
    currency: 'USD',
    installment: '2/6',
    status: 'pending'
  },
  {
    id: 'pm2',
    source: 'BBVA',
    date: '2026-05-15',
    description: 'FARMACITY',
    amount: 28500,
    currency: 'ARS',
    status: 'pending'
  },
  {
    id: 'pm3',
    source: 'NaranjaX',
    date: '2026-05-18',
    description: 'STEAM PURCHASE',
    amount: 29.99,
    currency: 'USD',
    status: 'pending'
  }
]

// Current period
export const currentPeriod: Period = {
  month: 5,
  year: 2026,
  exchangeRate: 1420
}
