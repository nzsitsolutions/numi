'use client'

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { 
  CreditCard, Expense, Income, Debt, PendingMovement, Period,
  ExpenseWithCalculations, CardSummary 
} from '@/lib/types'
import { 
  sampleCards, sampleExpenses, sampleIncomes, sampleDebts, 
  samplePendingMovements, currentPeriod 
} from '@/lib/sample-data'

interface NumiContextType {
  // State
  period: Period
  cards: CreditCard[]
  expenses: Expense[]
  incomes: Income[]
  debts: Debt[]
  pendingMovements: PendingMovement[]
  
  // Period actions
  setPeriod: (period: Period) => void
  updateExchangeRate: (rate: number) => void
  nextPeriod: () => void
  prevPeriod: () => void
  
  // Card actions
  addCard: (card: Omit<CreditCard, 'id'>) => void
  updateCard: (id: string, card: Partial<CreditCard>) => void
  deleteCard: (id: string) => void
  
  // Expense actions
  addExpense: (expense: Omit<Expense, 'id'>) => void
  updateExpense: (id: string, expense: Partial<Expense>) => void
  deleteExpense: (id: string) => void
  payInstallment: (id: string) => void
  
  // Income actions
  addIncome: (income: Omit<Income, 'id'>) => void
  updateIncome: (id: string, income: Partial<Income>) => void
  deleteIncome: (id: string) => void
  
  // Debt actions
  addDebt: (debt: Omit<Debt, 'id'>) => void
  updateDebt: (id: string, debt: Partial<Debt>) => void
  deleteDebt: (id: string) => void
  markDebtAsPaid: (id: string) => void
  
  // Movement actions
  confirmMovement: (id: string) => void
  discardMovement: (id: string) => void
  
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

function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function NumiProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<Period>(currentPeriod)
  const [cards, setCards] = useState<CreditCard[]>(sampleCards)
  const [expenses, setExpenses] = useState<Expense[]>(sampleExpenses)
  const [incomes, setIncomes] = useState<Income[]>(sampleIncomes)
  const [debts, setDebts] = useState<Debt[]>(sampleDebts)
  const [pendingMovements, setPendingMovements] = useState<PendingMovement[]>(samplePendingMovements)

  // Period actions
  const updateExchangeRate = useCallback((rate: number) => {
    setPeriod(p => ({ ...p, exchangeRate: rate }))
  }, [])

  const nextPeriod = useCallback(() => {
    setPeriod(p => {
      const newMonth = p.month === 12 ? 1 : p.month + 1
      const newYear = p.month === 12 ? p.year + 1 : p.year
      return { ...p, month: newMonth, year: newYear }
    })
  }, [])

  const prevPeriod = useCallback(() => {
    setPeriod(p => {
      const newMonth = p.month === 1 ? 12 : p.month - 1
      const newYear = p.month === 1 ? p.year - 1 : p.year
      return { ...p, month: newMonth, year: newYear }
    })
  }, [])

  // Card actions
  const addCard = useCallback((card: Omit<CreditCard, 'id'>) => {
    setCards(c => [...c, { ...card, id: generateId() }])
  }, [])

  const updateCard = useCallback((id: string, card: Partial<CreditCard>) => {
    setCards(c => c.map(item => item.id === id ? { ...item, ...card } : item))
  }, [])

  const deleteCard = useCallback((id: string) => {
    setCards(c => c.filter(item => item.id !== id))
  }, [])

  // Expense actions
  const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
    setExpenses(e => [...e, { ...expense, id: generateId() }])
  }, [])

  const updateExpense = useCallback((id: string, expense: Partial<Expense>) => {
    setExpenses(e => e.map(item => item.id === id ? { ...item, ...expense } : item))
  }, [])

  const deleteExpense = useCallback((id: string) => {
    setExpenses(e => e.filter(item => item.id !== id))
  }, [])

  const payInstallment = useCallback((id: string) => {
    setExpenses(e => e.map(item => {
      if (item.id === id && item.type === 'cuotas' && item.paidInstallments !== undefined && item.totalInstallments !== undefined) {
        if (item.paidInstallments < item.totalInstallments) {
          return { ...item, paidInstallments: item.paidInstallments + 1 }
        }
      }
      return item
    }))
  }, [])

  // Income actions
  const addIncome = useCallback((income: Omit<Income, 'id'>) => {
    setIncomes(i => [...i, { ...income, id: generateId() }])
  }, [])

  const updateIncome = useCallback((id: string, income: Partial<Income>) => {
    setIncomes(i => i.map(item => item.id === id ? { ...item, ...income } : item))
  }, [])

  const deleteIncome = useCallback((id: string) => {
    setIncomes(i => i.filter(item => item.id !== id))
  }, [])

  // Debt actions
  const addDebt = useCallback((debt: Omit<Debt, 'id'>) => {
    setDebts(d => [...d, { ...debt, id: generateId() }])
  }, [])

  const updateDebt = useCallback((id: string, debt: Partial<Debt>) => {
    setDebts(d => d.map(item => item.id === id ? { ...item, ...debt } : item))
  }, [])

  const deleteDebt = useCallback((id: string) => {
    setDebts(d => d.filter(item => item.id !== id))
  }, [])

  const markDebtAsPaid = useCallback((id: string) => {
    setDebts(d => d.map(item => item.id === id ? { ...item, status: 'saldada' as const } : item))
  }, [])

  // Movement actions
  const confirmMovement = useCallback((id: string) => {
    setPendingMovements(m => m.map(item => 
      item.id === id ? { ...item, status: 'confirmed' as const } : item
    ))
  }, [])

  const discardMovement = useCallback((id: string) => {
    setPendingMovements(m => m.map(item => 
      item.id === id ? { ...item, status: 'discarded' as const } : item
    ))
  }, [])

  // Calculations
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
      remainingArs = 0
      progress = 100
    } else {
      const total = expense.totalInstallments || 1
      const paid = expense.paidInstallments || 0
      remainingInstallments = total - paid
      
      const totalAmount = expense.amountUsd ? expense.amountUsd * rate : expense.amountArs
      const installmentAmount = totalAmount / total
      
      monthlyArs = installmentAmount
      totalArs = totalAmount
      paidArs = installmentAmount * paid
      remainingArs = installmentAmount * remainingInstallments
      progress = Math.round((paid / total) * 100)
    }

    return {
      ...expense,
      monthlyArs,
      remainingInstallments,
      paidArs,
      remainingArs,
      totalArs,
      progress
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
        expenses: cardExpenses
      }
    })
  }, [cards, expenses, getExpenseCalculations, period.exchangeRate])

  const getNoCardExpenses = useCallback((): ExpenseWithCalculations[] => {
    return expenses
      .filter(e => !e.cardId)
      .map(getExpenseCalculations)
  }, [expenses, getExpenseCalculations])

  const getTotalMonthly = useCallback((): number => {
    const allExpenses = expenses.map(getExpenseCalculations)
    return allExpenses.reduce((sum, e) => sum + e.monthlyArs, 0)
  }, [expenses, getExpenseCalculations])

  const getTotalClosure = useCallback((): number => {
    const allExpenses = expenses.map(getExpenseCalculations)
    return allExpenses.reduce((sum, e) => sum + e.remainingArs, 0)
  }, [expenses, getExpenseCalculations])

  const getTotalIncome = useCallback((): { ars: number; usd: number } => {
    const rate = period.exchangeRate
    let totalArs = 0
    let totalUsd = 0

    incomes.forEach(income => {
      if (income.amountArs) totalArs += income.amountArs
      if (income.amountUsd) totalUsd += income.amountUsd
    })

    return { ars: totalArs + totalUsd * rate, usd: totalUsd }
  }, [incomes, period.exchangeRate])

  const getNoDebtTotal = useCallback((): number => {
    const noCardExpenses = getNoCardExpenses()
    return noCardExpenses.reduce((sum, e) => sum + e.monthlyArs, 0)
  }, [getNoCardExpenses])

  return (
    <NumiContext.Provider value={{
      period,
      cards,
      expenses,
      incomes,
      debts,
      pendingMovements,
      setPeriod,
      updateExchangeRate,
      nextPeriod,
      prevPeriod,
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
