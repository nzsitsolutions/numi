'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useNumi } from '@/lib/numi-context'
import { formatUsd } from '@/lib/format'
import { CreditCard as CreditCardType } from '@/lib/types'
import { Button } from '@/components/ui/button'
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
  Wifi,
  Loader2
} from 'lucide-react'

const colorOptions = [
  { value: 'from-orange-500 to-orange-600', label: 'Naranja', preview: 'bg-orange-500' },
  { value: 'from-blue-600 to-blue-700', label: 'Azul', preview: 'bg-blue-600' },
  { value: 'from-red-500 to-red-600', label: 'Rojo', preview: 'bg-red-500' },
  { value: 'from-green-500 to-green-600', label: 'Verde', preview: 'bg-green-500' },
  { value: 'from-purple-500 to-purple-600', label: 'Violeta', preview: 'bg-purple-500' },
  { value: 'from-gray-700 to-gray-800', label: 'Negro', preview: 'bg-gray-700' },
  { value: 'from-amber-500 to-amber-600', label: 'Dorado', preview: 'bg-amber-500' },
  { value: 'from-pink-500 to-pink-600', label: 'Rosa', preview: 'bg-pink-500' },
]

interface CardFormData {
  name: string
  limitUsd: string
  closeDay: string
  dueDay: string
  color: string
}

const initialFormData: CardFormData = {
  name: '',
  limitUsd: '',
  closeDay: '15',
  dueDay: '5',
  color: 'from-blue-600 to-blue-700'
}

export function TarjetasPage() {
  const { cards, addCard, updateCard, deleteCard } = useNumi()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null)
  const [formData, setFormData] = useState<CardFormData>(initialFormData)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const openNewCard = () => {
    setEditingCard(null)
    setFormData(initialFormData)
    setIsDialogOpen(true)
  }

  const openEditCard = (card: CreditCardType) => {
    setEditingCard(card)
    setFormData({
      name: card.name,
      limitUsd: card.limitUsd.toString(),
      closeDay: card.closeDay.toString(),
      dueDay: card.dueDay.toString(),
      color: card.color
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const cardData: Omit<CreditCardType, 'id'> = {
      name: formData.name,
      limitUsd: parseFloat(formData.limitUsd),
      closeDay: parseInt(formData.closeDay),
      dueDay: parseInt(formData.dueDay),
      color: formData.color
    }

    try {
      if (editingCard) {
        await updateCard(editingCard.id, cardData)
      } else {
        await addCard(cardData)
      }
      setIsDialogOpen(false)
      setFormData(initialFormData)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar la tarjeta')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await deleteCard(deleteId)
      setDeleteId(null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar la tarjeta')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground">Tarjetas</h1>
          <p className="text-muted-foreground mt-1">
            Tus tarjetas de crédito
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewCard} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Agregar tarjeta</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCard ? 'Editar tarjeta' : 'Nueva tarjeta'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: NaranjaX, BBVA Visa"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="limitUsd">Límite (USD)</Label>
                <Input
                  id="limitUsd"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.limitUsd}
                  onChange={e => setFormData(f => ({ ...f, limitUsd: e.target.value }))}
                  placeholder="2500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="closeDay">Día de cierre</Label>
                  <Input
                    id="closeDay"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.closeDay}
                    onChange={e => setFormData(f => ({ ...f, closeDay: e.target.value }))}
                    placeholder="15"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDay">Día de vencimiento</Label>
                  <Input
                    id="dueDay"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dueDay}
                    onChange={e => setFormData(f => ({ ...f, dueDay: e.target.value }))}
                    placeholder="5"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <Select
                  value={formData.color}
                  onValueChange={v => setFormData(f => ({ ...f, color: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${opt.preview}`} />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" disabled={isSaving} onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingCard ? 'Guardar' : 'Agregar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards Grid */}
      {cards.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
            <CreditCard className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">
            Todavía no cargaste tarjetas
          </p>
          <Button onClick={openNewCard}>
            Agregar la primera
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(card => (
            <div key={card.id} className="group relative">
              {/* Credit Card Visual */}
              <div 
                className={`relative aspect-[1.586/1] rounded-2xl bg-gradient-to-br ${card.color} p-6 shadow-lg overflow-hidden transition-transform hover:scale-[1.02]`}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/20 -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-black/10 translate-y-1/2 -translate-x-1/2" />
                </div>

                {/* Card Content */}
                <div className="relative h-full flex flex-col justify-between text-white">
                  {/* Top Row */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs opacity-70 mb-1">Límite</p>
                      <p className="text-xl font-bold tabular-nums">{formatUsd(card.limitUsd)}</p>
                    </div>
                    <Wifi className="h-6 w-6 rotate-90 opacity-70" />
                  </div>

                  {/* Chip */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-9 rounded-md bg-amber-300/80 shadow-inner flex items-center justify-center">
                      <div className="w-8 h-6 rounded-sm border border-amber-500/50" />
                    </div>
                  </div>

                  {/* Bottom Row */}
                  <div>
                    <p className="text-lg font-semibold tracking-wide">{card.name}</p>
                    <div className="flex gap-6 mt-2 text-xs opacity-80">
                      <div>
                        <span className="opacity-70">Cierre </span>
                        <span className="font-medium">{card.closeDay}</span>
                      </div>
                      <div>
                        <span className="opacity-70">Vence </span>
                        <span className="font-medium">{card.dueDay}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons (on hover) */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-white/20 hover:bg-white/30 text-white border-0"
                    onClick={() => openEditCard(card)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-white/20 hover:bg-red-500/80 text-white border-0"
                    onClick={() => setDeleteId(card.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta tarjeta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Los gastos asociados a esta tarjeta quedarán sin asignar.
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
