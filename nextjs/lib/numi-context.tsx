'use client'

import {
  createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef
} from 'react'
import { toast } from 'sonner'
import {
  CreditCard, Expense, Income, Debt, PendingMovement, Period,
  ExpenseWithCalculations, CardSummary
} from '@/lib/types'
import * as api from '@/lib/api'

interface NumiContextType {
  // State
  period: Period
  cards: CreditCard[]
  expenses: Expense[]
  incomes: Income[]
  debts: Debt[]
  pendingMovements: PendingMovement[]
  isLoading: boolean

  // Period actions
  setPeriod: (period: Period) => void
  updateExchangeRate: (rate: number) => void

  // Card actions
  addCard: (card: Omit<CreditCard, 'id'>) => Promise<void>
  updateCard: (id: string, card: Partial<CreditCard>) => Promise<void>
  deleteCard: (id: string) => Promise<void>

  // Expense actions
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  payInstallment: (id: string) => Promise<void>

  // Income actions
  addIncome: (income: Omit<Income, 'id'>) => Promise<void>
  updateIncome: (id: string, income: Partial<Income>) => Promise<void>
  deleteIncome: (id: string) => Promise<void>

  // Debt actions
  addDebt: (debt: Omit<Debt, 'id'>) => Promise<void>
  updateDebt: (id: string, debt: Partial<Debt>) => Promise<void>
  deleteDebt: (id: string) => Promise<void>
  markDebtAsPaid: (id: string) => Promise<void>

  // Movement actions
  confirmMovement: (id: string) => Promise<void>
  discardMovement: (id: string) => Promise<void>
  refreshMovements: () => Promise<void>

  // Calculated values
  getExpenseCalculations: (expense: Expense) => ExpenseWithCalculations
  getCardSummaries: () => CardSummary[]
  getNoCardExpenses: () => ExpenseWithCalculations[]
  getTotalMonthly: () => number
  getTotalClosure: () => number
  getTotalIncome: () => { ars: number; usd: number }
  getNoDebtTotal: () => number
}

const NumiContext = createContext<NumiContextType | null>(null)

function currentMonthYear() {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}

export function NumiProvider({ children }: { children: ReactNode }) {
  const { month, year } = currentMonthYear()

  const [period, setPeriodState] = useState<Period>({ month, year, exchangeRate: 1420 })
  const [cards, setCards] = useState<CreditCard[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [incomes, setIncomes] = useState<Income[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [pendingMovements, setPendingMovements] = useState<PendingMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const isInitialized = useRef(false)

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      try {
        const [fetchedCards, fetchedExpenses, fetchedDebts, fetchedMovements, fetchedIncomes] =
          await Promise.all([
            api.fetchCards(),
            api.fetchExpenses(),
            api.fetchDebts(),
            api.fetchPendingMovements(),
            api.fetchIncomes(),
          ])

        setCards(fetchedCards)
        setExpenses(fetchedExpenses)
        setDebts(fetchedDebts)
        setPendingMovements(fetchedMovements)
        setIncomes(fetchedIncomes)

        // Always try live blue dollar first; fall back to stored rate if API fails
        try {
          const liveRates = await api.fetchLiveRates()
          const blue = liveRates.find(r => r.casa === 'blue')
          if (blue) setPeriodState(p => ({ ...p, exchangeRate: blue.venta }))
        } catch {
          const periodo = await api.fetchPeriodo(year, month)
          if (periodo) setPeriodState(p => ({ ...p, exchangeRate: periodo.tipoCambio }))
        }
      } catch (err) {
        console.error('[numi] init error:', err)
        toast.error('No se pudo conectar al servidor')
      } finally {
        setIsLoading(false)
        isInitialized.current = true
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Period actions ──────────────────────────────────────────────────────────
  const setPeriod = useCallback((p: Period) => setPeriodState(p), [])

  const updateExchangeRate = useCallback((rate: number) => {
    setPeriodState(p => {
      const next = { ...p, exchangeRate: rate }
      api.createOrUpdatePeriodo(p.year, p.month, rate).catch(() => {
        toast.error('No se pudo guardar la cotización')
      })
      return next
    })
  }, [])

  // ── Card actions ────────────────────────────────────────────────────────────
  const addCard = useCallback(async (card: Omit<CreditCard, 'id'>) => {
    const created = await api.createCard(card)
    setCards(c => [...c, created])
  }, [])

  const updateCard = useCallback(async (id: string, card: Partial<CreditCard>) => {
    const updated = await api.updateCard(id, card)
    setCards(c => c.map(item => item.id === id ? updated : item))
  }, [])

  const deleteCard = useCallback(async (id: string) => {
    await api.deleteCard(id)
    setCards(c => c.filter(item => item.id !== id))
  }, [])

  // ── Expense actions ─────────────────────────────────────────────────────────
  const addExpense = useCallback(async (expense: Omit<Expense, 'id'>) => {
    const created = await api.createExpense(expense)
    setExpenses(e => [...e, created])
  }, [])

  const updateExpense = useCallback(async (id: string, expense: Partial<Expense>) => {
    const updated = await api.updateExpense(id, expense)
    setExpenses(e => e.map(item => item.id === id ? updated : item))
  }, [])

  const deleteExpense = useCallback(async (id: string) => {
    await api.deleteExpense(id)
    setExpenses(e => e.filter(item => item.id !== id))
  }, [])

  const payInstallment = useCallback(async (id: string) => {
    const updated = await api.payInstallment(id)
    setExpenses(e => e.map(item => item.id === id ? updated : item))
  }, [])

  // ── Income actions ──────────────────────────────────────────────────────────
  const addIncome = useCallback(async (income: Omit<Income, 'id'>) => {
    const created = await api.createIncome(income, period.exchangeRate)
    setIncomes(i => [...i, created])
  }, [period.exchangeRate])

  const updateIncome = useCallback(async (id: string, income: Partial<Income>) => {
    const updated = await api.updateIncome(id, income, period.exchangeRate)
    setIncomes(i => i.map(item => item.id === id ? updated : item))
  }, [period.exchangeRate])

  const deleteIncome = useCallback(async (id: string) => {
    await api.deleteIncome(id)
    setIncomes(i => i.filter(item => item.id !== id))
  }, [])

  // ── Debt actions ────────────────────────────────────────────────────────────
  const addDebt = useCallback(async (debt: Omit<Debt, 'id'>) => {
    const created = await api.createDebt(debt)
    setDebts(d => [...d, created])
  }, [])

  const updateDebt = useCallback(async (id: string, debt: Partial<Debt>) => {
    const updated = await api.updateDebt(id, debt)
    setDebts(d => d.map(item => item.id === id ? updated : item))
  }, [])

  const deleteDebt = useCallback(async (id: string) => {
    await api.deleteDebt(id)
    setDebts(d => d.filter(item => item.id !== id))
  }, [])

  const markDebtAsPaid = useCallback(async (id: string) => {
    const updated = await api.markDebtAsPaid(id)
    setDebts(d => d.map(item => item.id === id ? updated : item))
  }, [])

  // ── Movement actions ────────────────────────────────────────────────────────
  const confirmMovement = useCallback(async (id: string) => {
    await api.confirmMovement(id)
    setPendingMovements(m => m.map(item =>
      item.id === id ? { ...item, status: 'confirmed' as const } : item
    ))
  }, [])

  const discardMovement = useCallback(async (id: string) => {
    await api.discardMovement(id)
    setPendingMovements(m => m.map(item =>
      item.id === id ? { ...item, status: 'discarded' as const } : item
    ))
  }, [])

  const refreshMovements = useCallback(async () => {
    const movements = await api.fetchPendingMovements()
    setPendingMovements(movements)
  }, [])

  // ── Calculations (client-side, mirrors backend calcularVOs) ─────────────────
  const getExpenseCalculations = useCallback((expense: Expense): ExpenseWithCalculations => {
    const rate = period.exchangeRate

    let monthlyArs: number
    let totalArs: number
    let remainingInstallments: number
    let paidArs: number
    let remainingArs: number
    let progress: number

    if (expense.type === 'fijo') {
      const baseAmount = expense.amountUsd ? expense.amountUsd * rate : expense.amountArs
      monthlyArs = baseAmount
      totalArs = baseAmount
      remainingInstallments = 0
      paidArs = 0
      remainingArs = baseAmount
      progress = 100
    } else {
      const total = expense.totalInstallments || 1
      const paid = expense.paidInstallments || 0
      remainingInstallments = Math.max(total - paid, 0)

      const installmentAmount = expense.amountUsd
        ? expense.amountUsd * rate
        : expense.amountArs

      monthlyArs = remainingInstallments > 0 ? installmentAmount : 0
      totalArs = installmentAmount * total
      paidArs = installmentAmount * paid
      remainingArs = installmentAmount * remainingInstallments
      progress = total > 0 ? Math.round((paid / total) * 100) : 0
    }

    return {
      ...expense,
      monthlyArs,
      remainingInstallments,
      paidArs,
      remainingArs,
      totalArs,
      progress,
    }
  }, [period.exchangeRate])

  const getCardSummaries = useCallback((): CardSummary[] => {
    return cards.map(card => {
      const cardExpenses = expenses
        .filter(e => e.cardId === card.id)
        .map(getExpenseCalculations)

      const usedUsd = cardExpenses.reduce((sum, e) => {
        if (e.amountUsd) {
          return sum + (e.type === 'fijo' ? e.amountUsd : e.amountUsd / (e.totalInstallments || 1))
        }
        return sum + e.monthlyArs / period.exchangeRate
      }, 0)

      const closureArs = cardExpenses.reduce((sum, e) => sum + e.monthlyArs, 0)

      return {
        ...card,
        usedUsd,
        availableUsd: card.limitUsd - usedUsd,
        closureArs,
        expenses: cardExpenses,
      }
    })
  }, [cards, expenses, getExpenseCalculations, period.exchangeRate])

  const getNoCardExpenses = useCallback((): ExpenseWithCalculations[] => {
    return expenses
      .filter(e => !e.cardId)
      .map(getExpenseCalculations)
  }, [expenses, getExpenseCalculations])

  const getTotalMonthly = useCallback((): number => {
    return expenses.map(getExpenseCalculations).reduce((sum, e) => sum + e.monthlyArs, 0)
  }, [expenses, getExpenseCalculations])

  const getTotalClosure = useCallback((): number => {
    return expenses.map(getExpenseCalculations).reduce((sum, e) => sum + e.remainingArs, 0)
  }, [expenses, getExpenseCalculations])

  const getTotalIncome = useCallback((): { ars: number; usd: number } => {
    const rate = period.exchangeRate
    const periodStr = `${period.year}-${String(period.month).padStart(2, '0')}`
    let totalArs = 0
    let totalUsd = 0
    incomes
      .filter(income => income.period.startsWith(periodStr))
      .forEach(income => {
        if (income.amountArs) totalArs += income.amountArs
        if (income.amountUsd) totalUsd += income.amountUsd
      })
    return { ars: totalArs + totalUsd * rate, usd: totalUsd }
  }, [incomes, period])

  const getNoDebtTotal = useCallback((): number => {
    return getNoCardExpenses().reduce((sum, e) => sum + e.monthlyArs, 0)
  }, [getNoCardExpenses])

  return (
    <NumiContext.Provider value={{
      period,
      cards,
      expenses,
      incomes,
      debts,
      pendingMovements,
      isLoading,
      setPeriod,
      updateExchangeRate,
      addCard,
      updateCard,
      deleteCard,
      addExpense,
      updateExpense,
      deleteExpense,
      payInstallment,
      addIncome,
      updateIncome,
      deleteIncome,
      addDebt,
      updateDebt,
      deleteDebt,
      markDebtAsPaid,
      confirmMovement,
      discardMovement,
      refreshMovements,
      getExpenseCalculations,
      getCardSummaries,
      getNoCardExpenses,
      getTotalMonthly,
      getTotalClosure,
      getTotalIncome,
      getNoDebtTotal,
    }}>
      {children}
    </NumiContext.Provider>
  )
}

export function useNumi() {
  const context = useContext(NumiContext)
  if (!context) {
    throw new Error('useNumi must be used within a NumiProvider')
  }
  return context
}
