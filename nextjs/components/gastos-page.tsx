'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useNumi } from '@/lib/numi-context'
import { formatArs, formatUsd } from '@/lib/format'
import { Expense, ExpenseWithCalculations } from '@/lib/types'
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
  CreditCard, 
  Wallet,
  CircleDollarSign,
  Check,
  Loader2
} from 'lucide-react'

interface ExpenseFormData {
  name: string
  type: 'fijo' | 'cuotas'
  amountArs: string
  amountUsd: string
  totalInstallments: string
  paidInstallments: string
  cardId: string
  startDate: string
}

const initialFormData: ExpenseFormData = {
  name: '',
  type: 'fijo',
  amountArs: '',
  amountUsd: '',
  totalInstallments: '',
  paidInstallments: '0',
  cardId: '',
  startDate: new Date().toISOString().split('T')[0]
}

export function GastosPage() {
  const { 
    period,
    cards, 
    expenses, 
    addExpense, 
    updateExpense, 
    deleteExpense,
    payInstallment,
    getExpenseCalculations,
    getCardSummaries,
    getNoCardExpenses
  } = useNumi()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [formData, setFormData] = useState<ExpenseFormData>(initialFormData)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const cardSummaries = getCardSummaries()
  const noCardExpenses = getNoCardExpenses()

  const openNewExpense = () => {
    setEditingExpense(null)
    setFormData(initialFormData)
    setIsDialogOpen(true)
  }

  const openEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setFormData({
      name: expense.name,
      type: expense.type,
      amountArs: expense.amountArs?.toString() || '',
      amountUsd: expense.amountUsd?.toString() || '',
      totalInstallments: expense.totalInstallments?.toString() || '',
      paidInstallments: expense.paidInstallments?.toString() || '0',
      cardId: expense.cardId || '',
      startDate: expense.startDate
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const expenseData: Omit<Expense, 'id'> = {
      name: formData.name,
      type: formData.type,
      amountArs: parseFloat(formData.amountArs) || 0,
      amountUsd: formData.amountUsd ? parseFloat(formData.amountUsd) : undefined,
      totalInstallments: formData.type === 'cuotas' ? parseInt(formData.totalInstallments) : undefined,
      paidInstallments: formData.type === 'cuotas' ? parseInt(formData.paidInstallments) : undefined,
      cardId: formData.cardId || undefined,
      startDate: formData.startDate
    }

    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, expenseData)
      } else {
        await addExpense(expenseData)
      }
      setIsDialogOpen(false)
      setFormData(initialFormData)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar el gasto')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await deleteExpense(deleteId)
      setDeleteId(null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar el gasto')
    } finally {
      setIsDeleting(false)
    }
  }

  const ExpenseRow = ({ expense, showCard = false }: { expense: ExpenseWithCalculations; showCard?: boolean }) => (
    <div className="flex items-center gap-4 py-3 px-4 hover:bg-secondary/50 rounded-lg transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground truncate">{expense.name}</span>
          <Badge variant={expense.type === 'fijo' ? 'secondary' : 'outline'} className="text-xs">
            {expense.type === 'fijo' ? 'Fijo' : 'Cuotas'}
          </Badge>
        </div>
        {expense.amountUsd && (
          <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
            {formatUsd(expense.amountUsd)} ≈ {formatArs(expense.amountUsd * period.exchangeRate)}
          </p>
        )}
      </div>

      {expense.type === 'cuotas' && (
        <div className="hidden sm:flex flex-col items-end gap-1 min-w-[100px]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground tabular-nums">
              {expense.paidInstallments}/{expense.totalInstallments}
            </span>
            <span className={`text-xs font-medium tabular-nums ${
              expense.progress! >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
              expense.progress! >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-primary'
            }`}>
              {expense.progress}%
            </span>
          </div>
          <div className="h-1 w-20 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                expense.progress! >= 80 ? 'bg-emerald-500' :
                expense.progress! >= 50 ? 'bg-amber-500' : 'bg-primary'
              }`}
              style={{ width: `${expense.progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="text-right min-w-[90px]">
        <div className="font-semibold text-foreground tabular-nums text-sm">
          {formatArs(expense.monthlyArs)}
        </div>
        <p className="text-xs text-muted-foreground">mensual</p>
      </div>

      {expense.type === 'cuotas' && (
        <div className="hidden md:block text-right min-w-[90px]">
          <div className="text-sm text-muted-foreground tabular-nums">
            {formatArs(expense.remainingArs)}
          </div>
          <p className="text-xs text-muted-foreground">restante</p>
        </div>
      )}

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {expense.type === 'cuotas' && expense.paidInstallments! < expense.totalInstallments! && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-success hover:text-success"
            onClick={async () => {
              try { await payInstallment(expense.id) }
              catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Error al pagar cuota') }
            }}
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => openEditExpense(expense)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => setDeleteId(expense.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground">Gastos</h1>
          <p className="text-muted-foreground mt-1">
            Agrupados por tarjeta de crédito
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewExpense} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Agregar gasto</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? 'Editar gasto' : 'Nuevo gasto'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Spotify, Supermercado"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v: 'fijo' | 'cuotas') => setFormData(f => ({ ...f, type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fijo">Fijo (mensual)</SelectItem>
                    <SelectItem value="cuotas">Cuotas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'cuotas' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="totalInstallments">Cuotas totales</Label>
                    <Input
                      id="totalInstallments"
                      type="number"
                      min="1"
                      value={formData.totalInstallments}
                      onChange={e => setFormData(f => ({ ...f, totalInstallments: e.target.value }))}
                      placeholder="12"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paidInstallments">Cuotas pagadas</Label>
                    <Input
                      id="paidInstallments"
                      type="number"
                      min="0"
                      value={formData.paidInstallments}
                      onChange={e => setFormData(f => ({ ...f, paidInstallments: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="amountArs">Monto ARS</Label>
                  <Input
                    id="amountArs"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amountArs}
                    onChange={e => setFormData(f => ({ ...f, amountArs: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amountUsd">Monto USD</Label>
                  <Input
                    id="amountUsd"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amountUsd}
                    onChange={e => setFormData(f => ({ ...f, amountUsd: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tarjeta</Label>
                <Select
                  value={formData.cardId || 'none'}
                  onValueChange={v => setFormData(f => ({ ...f, cardId: v === 'none' ? '' : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin tarjeta (efectivo/débito)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin tarjeta</SelectItem>
                    {cards.map(card => (
                      <SelectItem key={card.id} value={card.id}>
                        {card.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de inicio</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData(f => ({ ...f, startDate: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" disabled={isSaving} onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingExpense ? 'Guardar' : 'Agregar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Expense Groups */}
      <div className="space-y-6">
        {/* Card Groups */}
        {cardSummaries.map(card => (
          <Card key={card.id} className="bg-card border-border overflow-hidden">
            <div className={`h-1 bg-gradient-to-r ${card.color}`} />
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4 text-primary" />
                  {card.name}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Total: <span className="font-semibold text-foreground tabular-nums">{formatArs(card.closureArs)}</span>
                  </span>
                  <Badge variant="outline" className="tabular-nums">
                    Cierre: {card.closeDay}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {card.expenses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay gastos en esta tarjeta
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {card.expenses.map(expense => (
                    <ExpenseRow key={expense.id} expense={expense} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* No Card Group */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                Sin tarjeta
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                Total: <span className="font-semibold text-foreground tabular-nums">
                  {formatArs(noCardExpenses.reduce((sum, e) => sum + e.monthlyArs, 0))}
                </span>
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {noCardExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay gastos sin tarjeta
              </p>
            ) : (
              <div className="divide-y divide-border">
                {noCardExpenses.map(expense => (
                  <ExpenseRow key={expense.id} expense={expense} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este gasto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El gasto será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
