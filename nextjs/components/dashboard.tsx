'use client'

import { useNumi } from '@/lib/numi-context'
import { formatArs, formatUsd, getMonthName } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Wallet,
  Calendar,
  AlertCircle,
  ArrowDownToLine,
  Receipt,
  BadgeDollarSign,
  Banknote
} from 'lucide-react'

export function Dashboard() {
  const { 
    period,
    debts,
    getTotalMonthly, 
    getTotalClosure, 
    getTotalIncome,
    getNoDebtTotal,
    getCardSummaries,
    getNoCardExpenses
  } = useNumi()

  const totalMonthly = getTotalMonthly()
  const totalClosure = getTotalClosure()
  const income = getTotalIncome()
  const noDebtTotal = getNoDebtTotal()
  const cardSummaries = getCardSummaries()
  const noCardExpenses = getNoCardExpenses()
  const activeDebts = debts.filter(d => d.status === 'activa')

  // Calculate card vs no-card breakdown
  const cardTotal = cardSummaries.reduce((sum, c) => sum + c.closureArs, 0)
  const noCardTotal = noCardExpenses.reduce((sum, e) => sum + e.monthlyArs, 0)

  // Balance: income minus all expenses
  const balance = income.ars - totalMonthly
  const isPositiveBalance = balance >= 0

  // Usage pct for each card (for color coding)
  const usagePct = (used: number, limit: number) =>
    limit > 0 ? Math.min((used / limit) * 100, 100) : 0

  const barColor = (pct: number) => {
    if (pct >= 85) return 'bg-destructive'
    if (pct >= 60) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground">
            Resumen de {getMonthName(period.month)}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Todo lo que necesitás saber de un vistazo
          </p>
        </div>
        {income.ars > 0 && (
          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${
            isPositiveBalance
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}>
            {isPositiveBalance ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {isPositiveBalance ? '+' : ''}{formatArs(balance)}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {/* Total del mes */}
        <Card className="bg-card border-border overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-primary/60 to-primary/20" />
          <CardContent className="p-4 lg:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total del mes</span>
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Receipt className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
            <div className="text-xl lg:text-2xl font-bold tabular-nums text-foreground">
              {formatArs(totalMonthly)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Todos los gastos</p>
          </CardContent>
        </Card>

        {/* Cierre total */}
        <Card className="bg-card border-border overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-amber-500/60 to-amber-500/20" />
          <CardContent className="p-4 lg:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cierre total</span>
              <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <CreditCard className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="text-xl lg:text-2xl font-bold tabular-nums text-foreground">
              {formatArs(totalClosure)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Para saldar todo</p>
          </CardContent>
        </Card>

        {/* Ingresos */}
        <Card className="bg-card border-border overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-emerald-500/60 to-emerald-500/20" />
          <CardContent className="p-4 lg:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ingresos</span>
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="text-xl lg:text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatArs(income.ars)}
            </div>
            {income.usd > 0 ? (
              <p className="text-xs text-muted-foreground mt-1">{formatUsd(income.usd)} en USD</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Este mes</p>
            )}
          </CardContent>
        </Card>

        {/* Sin deudas */}
        <Card className="bg-card border-border overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-blue-500/60 to-blue-500/20" />
          <CardContent className="p-4 lg:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sin deudas</span>
              <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Banknote className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="text-xl lg:text-2xl font-bold tabular-nums text-foreground">
              {formatArs(noDebtTotal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Gastos fijos</p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown badges + balance mobile */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="text-xs lg:text-sm py-1 lg:py-1.5 px-2.5 lg:px-3">
          <CreditCard className="h-3 w-3 lg:h-3.5 lg:w-3.5 mr-1 lg:mr-1.5" />
          Con tarjeta: {formatArs(cardTotal)}
        </Badge>
        <Badge variant="secondary" className="text-xs lg:text-sm py-1 lg:py-1.5 px-2.5 lg:px-3">
          <Wallet className="h-3 w-3 lg:h-3.5 lg:w-3.5 mr-1 lg:mr-1.5" />
          Sin tarjeta: {formatArs(noCardTotal)}
        </Badge>
        {income.ars > 0 && (
          <div className={`sm:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
            isPositiveBalance
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}>
            {isPositiveBalance ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isPositiveBalance ? '+' : ''}{formatArs(balance)}
          </div>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cards Column */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            Tarjetas de crédito
            <Badge variant="outline" className="ml-auto text-xs font-normal">
              {cardSummaries.length}
            </Badge>
          </h2>

          <div className="space-y-3">
            {cardSummaries.map(card => {
              const pct = usagePct(card.usedUsd, card.limitUsd)
              return (
                <Card key={card.id} className="bg-card border-border overflow-hidden">
                  <div className={`h-1 bg-gradient-to-r ${card.color}`} />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{card.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          Límite: {formatUsd(card.limitUsd)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-foreground tabular-nums">
                          {formatArs(card.closureArs)}
                        </div>
                        <p className="text-xs text-muted-foreground">cierre</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          Usado: <span className="font-medium text-foreground tabular-nums">{formatUsd(card.usedUsd)}</span>
                        </span>
                        <span className={`font-medium tabular-nums ${pct >= 85 ? 'text-destructive' : pct >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {formatUsd(card.availableUsd)} disp.
                        </span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${barColor(pct)}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-right">{pct.toFixed(0)}% utilizado</p>
                    </div>

                    <div className="flex items-center gap-4 mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Cierre: <span className="font-medium text-foreground">{card.closeDay}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Vence: <span className="font-medium text-foreground">{card.dueDay}</span>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Debts Column */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-destructive" />
            Deudas extras
            {activeDebts.length > 0 && (
              <Badge variant="destructive" className="ml-auto text-xs font-normal">
                {activeDebts.length}
              </Badge>
            )}
          </h2>

          {activeDebts.length === 0 ? (
            <Card className="bg-card border-border border-dashed">
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 mx-auto mb-3 flex items-center justify-center">
                  <BadgeDollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-foreground">Sin deudas activas</p>
                <p className="text-xs text-muted-foreground mt-1">¡Todo en orden!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {activeDebts.map(debt => (
                <Card key={debt.id} className="bg-card border-border overflow-hidden">
                  <div className="h-0.5 bg-destructive/40" />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-medium text-foreground truncate">{debt.description}</h3>
                        {debt.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {debt.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-semibold text-foreground tabular-nums">
                          {debt.currency === 'USD' 
                            ? formatUsd(debt.amount)
                            : formatArs(debt.amount)
                          }
                        </div>
                        {debt.currency === 'USD' && (
                          <p className="text-xs text-muted-foreground tabular-nums">
                            ≈ {formatArs(debt.amount * period.exchangeRate)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Quick Stats */}
          <Card className="bg-secondary/40 border-border">
            <CardContent className="p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Estadísticas rápidas
              </h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tarjetas activas</span>
                  <span className="font-semibold text-foreground tabular-nums">{cardSummaries.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Gastos en cuotas</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {cardSummaries.reduce((sum, c) => 
                      sum + c.expenses.filter(e => e.type === 'cuotas').length, 0
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Deudas activas</span>
                  <span className={`font-semibold tabular-nums ${activeDebts.length > 0 ? 'text-destructive' : 'text-foreground'}`}>
                    {activeDebts.length}
                  </span>
                </div>
                {income.ars > 0 && (
                  <>
                    <div className="border-t border-border/50 pt-2 flex justify-between items-center">
                      <span className="text-muted-foreground">% de ingresos gastado</span>
                      <span className={`font-semibold tabular-nums ${
                        totalMonthly / income.ars > 0.9
                          ? 'text-destructive'
                          : totalMonthly / income.ars > 0.7
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {income.ars > 0 ? ((totalMonthly / income.ars) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
