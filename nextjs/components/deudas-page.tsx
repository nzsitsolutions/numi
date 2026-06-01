'use client'

import { useState } from 'react'
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
  AlertTriangle
} from 'lucide-react'

interface DebtFormData {
  description: string
  amount: string
  currency: 'ARS' | 'USD'
  status: 'activa' | 'saldada'
  notes: string
}

const initialFormData: DebtFormData = {
  description: '',
  amount: '',
  currency: 'ARS',
  status: 'activa',
  notes: ''
}

export function DeudasPage() {
  const { 
    period,
    debts, 
    addDebt, 
    updateDebt, 
    deleteDebt,
    markDebtAsPaid
  } = useNumi()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null)
  const [formData, setFormData] = useState<DebtFormData>(initialFormData)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const activeDebts = debts.filter(d => d.status === 'activa')
  const paidDebts = debts.filter(d => d.status === 'saldada')

  const totalActiveArs = activeDebts.reduce((sum, d) => {
    return sum + (d.currency === 'ARS' ? d.amount : d.amount * period.exchangeRate)
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
      notes: debt.notes || ''
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const debtData: Omit<Debt, 'id'> = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      status: formData.status,
      notes: formData.notes || undefined
    }

    if (editingDebt) {
      updateDebt(editingDebt.id, debtData)
    } else {
      addDebt(debtData)
    }

    setIsDialogOpen(false)
    setFormData(initialFormData)
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteDebt(deleteId)
      setDeleteId(null)
    }
  }

  const DebtCard = ({ debt }: { debt: Debt }) => (
    <Card className={`bg-card border-border ${debt.status === 'saldada' ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-foreground">{debt.description}</span>
              <Badge 
                variant={debt.status === 'activa' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {debt.status === 'activa' ? 'Activa' : 'Saldada'}
              </Badge>
            </div>
            {debt.notes && (
              <p className="text-sm text-muted-foreground">{debt.notes}</p>
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

        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
          {debt.status === 'activa' && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-success border-success/30 hover:bg-success/10 hover:text-success"
              onClick={() => markDebtAsPaid(debt.id)}
            >
              <CheckCircle2 className="h-4 w-4" />
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

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground">Deudas</h1>
          <p className="text-muted-foreground mt-1">
            Deudas extra fuera de tarjetas
          </p>
        </div>
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
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
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
