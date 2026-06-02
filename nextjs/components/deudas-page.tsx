'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useNumi } from '@/lib/numi-context'
import { formatArs, formatUsd } from '@/lib/format'
import { Debt } from '@/lib/types'
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
import { Textarea } from '@/components/ui/textarea'
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
  CheckCircle2,
  Landmark,
  AlertTriangle,
  Loader2
} from 'lucide-react'

interface DebtFormData {
  description: string
  amount: string
  currency: 'ARS' | 'USD'
  status: 'activa' | 'saldada'
  notes: string
  hasCuotas: boolean
  totalInstallments: string
}

const initialFormData: DebtFormData = {
  description: '',
  amount: '',
  currency: 'ARS',
  status: 'activa',
  notes: '',
  hasCuotas: false,
  totalInstallments: '',
}

export function DeudasPage() {
  const { 
    period,
    debts, 
    addDebt, 
    updateDebt, 
    deleteDebt,
    markDebtAsPaid,
    payDebtInstallment,
  } = useNumi()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null)
  const [formData, setFormData] = useState<DebtFormData>(initialFormData)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [payingId, setPayingId] = useState<string | null>(null)

  const activeDebts = debts.filter(d => d.status === 'activa')
  const paidDebts = debts.filter(d => d.status === 'saldada')

  // For installment debts, monthly amount = amount per cuota; for fixed = full amount
  const totalActiveArs = activeDebts.reduce((sum, d) => {
    const monthly = d.currency === 'ARS' ? d.amount : d.amount * period.exchangeRate
    return sum + monthly
  }, 0)

  const openNewDebt = () => {
    setEditingDebt(null)
    setFormData(initialFormData)
    setIsDialogOpen(true)
  }

  const openEditDebt = (debt: Debt) => {
    setEditingDebt(debt)
    setFormData({
      description: debt.description,
      amount: debt.amount.toString(),
      currency: debt.currency,
      status: debt.status,
      notes: debt.notes || '',
      hasCuotas: debt.totalInstallments != null,
      totalInstallments: debt.totalInstallments?.toString() || '',
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const debtData: Omit<Debt, 'id'> = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      status: formData.status,
      notes: formData.notes || undefined,
      totalInstallments: formData.hasCuotas && formData.totalInstallments
        ? parseInt(formData.totalInstallments)
        : undefined,
    }

    try {
      if (editingDebt) {
        await updateDebt(editingDebt.id, debtData)
      } else {
        await addDebt(debtData)
      }
      setIsDialogOpen(false)
      setFormData(initialFormData)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar la deuda')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await deleteDebt(deleteId)
      setDeleteId(null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar la deuda')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleMarkAsPaid = async (id: string) => {
    setPayingId(id)
    try {
      await markDebtAsPaid(id)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo marcar como saldada')
    } finally {
      setPayingId(null)
    }
  }

  const handlePayInstallment = async (id: string) => {
    setPayingId(id)
    try {
      await payDebtInstallment(id)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo registrar la cuota')
    } finally {
      setPayingId(null)
    }
  }

  const DebtCard = ({ debt }: { debt: Debt }) => {
    const hasCuotas = debt.totalInstallments != null
    const isActive = debt.status === 'activa'
    const canPayInstallment = hasCuotas && isActive &&
      (debt.remainingInstallments ?? 0) > 0

    return (
    <Card className={`bg-card border-border overflow-hidden transition-opacity ${!isActive ? 'opacity-55' : ''}`}>
      <div className={`h-0.5 ${isActive ? 'bg-destructive/60' : 'bg-border'}`} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`font-medium ${!isActive ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {debt.description}
              </span>
              {hasCuotas ? (
                <Badge variant={isActive ? 'outline' : 'secondary'} className="text-xs">
                  {debt.paidInstallments}/{debt.totalInstallments} cuotas
                </Badge>
              ) : (
                <Badge variant={isActive ? 'destructive' : 'secondary'} className="text-xs">
                  {isActive ? 'Activa' : 'Saldada'}
                </Badge>
              )}
            </div>
            {debt.notes && (
              <p className="text-sm text-muted-foreground">{debt.notes}</p>
            )}
          </div>

          <div className="text-right flex-shrink-0">
            <div className={`font-semibold tabular-nums ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
              {debt.currency === 'USD' 
                ? formatUsd(debt.amount)
                : formatArs(debt.amount)
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {hasCuotas ? 'por cuota' : 'total'}
            </p>
            {debt.currency === 'USD' && (
              <p className="text-xs text-muted-foreground tabular-nums">
                ≈ {formatArs(debt.amount * period.exchangeRate)}
              </p>
            )}
          </div>
        </div>

        {/* Installment progress bar */}
        {hasCuotas && (
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                Pagadas: <span className="font-medium text-foreground">{debt.paidInstallments}</span>
              </span>
              <span className={`font-medium ${
                (debt.progress ?? 0) >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                (debt.progress ?? 0) >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-primary'
              }`}>{debt.progress ?? 0}%</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  (debt.progress ?? 0) >= 80 ? 'bg-emerald-500' :
                  (debt.progress ?? 0) >= 50 ? 'bg-amber-500' : 'bg-primary'
                }`}
                style={{ width: `${debt.progress ?? 0}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">
              {debt.remainingInstallments} cuota{debt.remainingInstallments !== 1 ? 's' : ''} restante{debt.remainingInstallments !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          {isActive && canPayInstallment && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-primary border-primary/30 hover:bg-primary/10"
              disabled={payingId === debt.id}
              onClick={() => handlePayInstallment(debt.id)}
            >
              {payingId === debt.id
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <CheckCircle2 className="h-4 w-4" />
              }
              Pagar cuota
            </Button>
          )}
          {isActive && !hasCuotas && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-success border-success/30 hover:bg-success/10 hover:text-success"
              disabled={payingId === debt.id}
              onClick={() => handleMarkAsPaid(debt.id)}
            >
              {payingId === debt.id
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <CheckCircle2 className="h-4 w-4" />
              }
              Marcar saldada
            </Button>
          )}
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => openEditDebt(debt)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => setDeleteId(debt.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground">Deudas</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Deudas extra fuera de tarjetas
          </p>
        </div>
        {totalActiveArs > 0 && (
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Total activo</span>
            <span className="text-lg font-bold text-destructive tabular-nums">{formatArs(totalActiveArs)}</span>
          </div>
        )}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDebt} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Agregar deuda</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingDebt ? 'Editar deuda' : 'Nueva deuda'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  placeholder="Ej: Préstamo familiar"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="amount">Monto</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={e => setFormData(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Moneda</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(v: 'ARS' | 'USD') => setFormData(f => ({ ...f, currency: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARS">Pesos (ARS)</SelectItem>
                      <SelectItem value="USD">Dólares (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Cuotas toggle */}
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Pagar en cuotas</p>
                  <p className="text-xs text-muted-foreground">El monto es el valor de cada cuota</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.hasCuotas}
                  onClick={() => setFormData(f => ({ ...f, hasCuotas: !f.hasCuotas, totalInstallments: '' }))}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    formData.hasCuotas ? 'bg-primary' : 'bg-input'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    formData.hasCuotas ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {formData.hasCuotas && (
                <div className="space-y-2">
                  <Label htmlFor="totalInstallments">Cantidad de cuotas</Label>
                  <Input
                    id="totalInstallments"
                    type="number"
                    min="2"
                    value={formData.totalInstallments}
                    onChange={e => setFormData(f => ({ ...f, totalInstallments: e.target.value }))}
                    placeholder="12"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v: 'activa' | 'saldada') => setFormData(f => ({ ...f, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activa">Activa</SelectItem>
                    <SelectItem value="saldada">Saldada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observaciones</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Notas adicionales..."
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" disabled={isSaving} onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingDebt ? 'Guardar' : 'Agregar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Card */}
      {activeDebts.length > 0 && (
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total deudas activas</p>
                <p className="text-2xl font-bold text-destructive tabular-nums">
                  {formatArs(totalActiveArs)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {debts.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
            <Landmark className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">
            No tenés deudas registradas
          </p>
          <Button onClick={openNewDebt}>
            Agregar la primera
          </Button>
        </div>
      )}

      {/* Active Debts */}
      {activeDebts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Deudas activas
            <Badge variant="destructive" className="ml-1">
              {activeDebts.length}
            </Badge>
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {activeDebts.map(debt => (
              <DebtCard key={debt.id} debt={debt} />
            ))}
          </div>
        </div>
      )}

      {/* Paid Debts */}
      {paidDebts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Saldadas
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {paidDebts.map(debt => (
              <DebtCard key={debt.id} debt={debt} />
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta deuda?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
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
