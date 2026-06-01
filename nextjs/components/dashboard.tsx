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
  AlertCircle
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

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-foreground">
          Resumen de {getMonthName(period.month)}
        </h1>
        <p className="text-muted-foreground mt-1">
          Todo lo que necesitás saber de un vistazo
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total del mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl lg:text-3xl font-bold tabular-nums text-foreground">
              {formatArs(totalMonthly)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Todos los gastos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Cierre total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl lg:text-3xl font-bold tabular-nums text-foreground">
              {formatArs(totalClosure)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Para saldar todo
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-success uppercase tracking-wide flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl lg:text-3xl font-bold tabular-nums text-success">
              {formatArs(income.ars)}
            </div>
            {income.usd > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatUsd(income.usd)} en USD
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Sin deudas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl lg:text-3xl font-bold tabular-nums text-foreground">
              {formatArs(noDebtTotal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Gastos fijos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Badge */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="secondary" className="text-sm py-1.5 px-3">
          <CreditCard className="h-3.5 w-3.5 mr-1.5" />
          Con tarjeta: {formatArs(cardTotal)}
        </Badge>
        <Badge variant="secondary" className="text-sm py-1.5 px-3">
          <Wallet className="h-3.5 w-3.5 mr-1.5" />
          Sin tarjeta: {formatArs(noCardTotal)}
        </Badge>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cards Column */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Tarjetas de crédito
          </h2>

          <div className="space-y-3">
            {cardSummaries.map(card => {
              const usagePercent = Math.min((card.usedUsd / card.limitUsd) * 100, 100)
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
                        <div className="text-sm font-semibold text-foreground tabular-nums">
                          {formatArs(card.closureArs)}
                        </div>
                        <p className="text-xs text-muted-foreground">cierre</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          Usado: {formatUsd(card.usedUsd)}
                        </span>
                        <span className="text-primary font-medium">
                          Disponible: {formatUsd(card.availableUsd)}
                        </span>
                      </div>
                      <Progress value={usagePercent} className="h-1.5" />
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Cierre: {card.closeDay}
                      </span>
                      <span className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Vence: {card.dueDay}
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
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-destructive" />
            Deudas extras
          </h2>

          {activeDebts.length === 0 ? (
            <Card className="bg-card border-border border-dashed">
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">
                  No tenés deudas activas
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeDebts.map(debt => (
                <Card key={debt.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-foreground">{debt.description}</h3>
                        {debt.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {debt.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
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
          <Card className="bg-secondary/50 border-border">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-foreground mb-3">
                Resumen rápido
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tarjetas activas</span>
                  <span className="font-medium text-foreground">{cardSummaries.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gastos en cuotas</span>
                  <span className="font-medium text-foreground">
                    {cardSummaries.reduce((sum, c) => 
                      sum + c.expenses.filter(e => e.type === 'cuotas').length, 0
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deudas activas</span>
                  <span className="font-medium text-foreground">{activeDebts.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
