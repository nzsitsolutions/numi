'use client'

import { useState } from 'react'
import { useNumi } from '@/lib/numi-context'
import { formatArs, formatUsd, getMonthName } from '@/lib/format'
import { Income } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Plus, 
  Pencil, 
  Trash2, 
  TrendingUp,
  DollarSign,
  Banknote
} from 'lucide-react'

interface IncomeFormData {
  description: string
  amountArs: string
  amountUsd: string
  currency: 'ARS' | 'USD' | 'both'
  period: string
  exchangeRate: string
}

const initialFormData: IncomeFormData = {
  description: '',
  amountArs: '',
  amountUsd: '',
  currency: 'ARS',
  period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
  exchangeRate: '1420'
}

export function IngresosPage() {
  const { 
    period,
    incomes, 
    addIncome, 
    updateIncome, 
    deleteIncome,
    getTotalIncome
  } = useNumi()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
  const [formData, setFormData] = useState<IncomeFormData>(initialFormData)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const totalIncome = getTotalIncome()
  const totalUsdConverted = incomes
    .filter(i => i.amountUsd)
    .reduce((sum, i) => sum + (i.amountUsd || 0), 0)
  const totalArsOnly = incomes
    .filter(i => i.amountArs && !i.amountUsd)
    .reduce((sum, i) => sum + (i.amountArs || 0), 0)

  const openNewIncome = () => {
    setEditingIncome(null)
    setFormData({
      ...initialFormData,
      exchangeRate: period.exchangeRate.toString()
    })
    setIsDialogOpen(true)
  }

  const openEditIncome = (income: Income) => {
    setEditingIncome(income)
    setFormData({
      description: income.description,
      amountArs: income.amountArs?.toString() || '',
      amountUsd: income.amountUsd?.toString() || '',
      currency: income.currency,
      period: income.period,
      exchangeRate: income.exchangeRate?.toString() || period.exchangeRate.toString()
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const incomeData: Omit<Income, 'id'> = {
      description: formData.description,
      amountArs: formData.amountArs ? parseFloat(formData.amountArs) : undefined,
      amountUsd: formData.amountUsd ? parseFloat(formData.amountUsd) : undefined,
      currency: formData.currency,
      period: formData.period,
      exchangeRate: parseFloat(formData.exchangeRate) || period.exchangeRate
    }

    if (editingIncome) {
      updateIncome(editingIncome.id, incomeData)
    } else {
      addIncome(incomeData)
    }

    setIsDialogOpen(false)
    setFormData(initialFormData)
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteIncome(deleteId)
      setDeleteId(null)
    }
  }

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground">Ingresos</h1>
          <p className="text-muted-foreground mt-1">
            {getMonthName(period.month)} {period.year}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewIncome} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Agregar ingreso</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingIncome ? 'Editar ingreso' : 'Nuevo ingreso'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  placeholder="Ej: Sueldo, Freelance"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Moneda</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(v: 'ARS' | 'USD' | 'both') => setFormData(f => ({ ...f, currency: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">Pesos (ARS)</SelectItem>
                    <SelectItem value="USD">Dólares (USD)</SelectItem>
                    <SelectItem value="both">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.currency === 'ARS' || formData.currency === 'both') && (
                <div className="space-y-2">
                  <Label htmlFor="amountArs">Monto en pesos</Label>
                  <Input
                    id="amountArs"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amountArs}
                    onChange={e => setFormData(f => ({ ...f, amountArs: e.target.value }))}
                    placeholder="0"
                    required={formData.currency === 'ARS'}
                  />
                </div>
              )}

              {(formData.currency === 'USD' || formData.currency === 'both') && (
                <div className="space-y-2">
                  <Label htmlFor="amountUsd">Monto en dólares</Label>
                  <Input
                    id="amountUsd"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amountUsd}
                    onChange={e => setFormData(f => ({ ...f, amountUsd: e.target.value }))}
                    placeholder="0"
                    required={formData.currency === 'USD'}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="exchangeRate">Cotización USD</Label>
                <Input
                  id="exchangeRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.exchangeRate}
                  onChange={e => setFormData(f => ({ ...f, exchangeRate: e.target.value }))}
                  placeholder="1420"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="period">Período</Label>
                <Input
                  id="period"
                  type="month"
                  value={formData.period}
                  onChange={e => setFormData(f => ({ ...f, period: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  {editingIncome ? 'Guardar' : 'Agregar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-success uppercase tracking-wide flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Total del mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl lg:text-3xl font-bold tabular-nums text-success">
              {formatArs(totalIncome.ars)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              En dólares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl lg:text-3xl font-bold tabular-nums text-foreground">
              {formatUsd(totalUsdConverted)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ≈ {formatArs(totalUsdConverted * period.exchangeRate)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Banknote className="h-3 w-3" />
              En pesos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl lg:text-3xl font-bold tabular-nums text-foreground">
              {formatArs(totalArsOnly)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">Detalle de ingresos</CardTitle>
        </CardHeader>
        <CardContent>
          {incomes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                Todavía no cargaste ingresos
              </p>
              <Button className="mt-4" onClick={openNewIncome}>
                Agregar el primero
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {incomes.map(income => (
                <div 
                  key={income.id} 
                  className="flex items-center gap-4 py-4 hover:bg-secondary/50 rounded-lg px-4 -mx-4 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{income.description}</span>
                      <Badge variant="outline" className="text-xs">
                        {income.currency === 'both' ? 'ARS + USD' : income.currency}
                      </Badge>
                    </div>
                    {income.exchangeRate && income.amountUsd && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Cotización: {formatArs(income.exchangeRate)}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    {income.amountArs && (
                      <div className="font-semibold text-success tabular-nums">
                        {formatArs(income.amountArs)}
                      </div>
                    )}
                    {income.amountUsd && (
                      <div className={`text-sm tabular-nums ${income.amountArs ? 'text-muted-foreground' : 'font-semibold text-success'}`}>
                        {formatUsd(income.amountUsd)}
                        {!income.amountArs && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ≈ {formatArs(income.amountUsd * (income.exchangeRate || period.exchangeRate))}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditIncome(income)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(income.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este ingreso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
