'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { useNumi } from '@/lib/numi-context'
import * as api from '@/lib/api'
import { formatArs, formatUsd, formatDate } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  FileSpreadsheet,
  Upload,
  Cloud,
  Check,
  X,
  CheckCircle2,
  Clock,
  Inbox,
  Loader2,
} from 'lucide-react'

interface ImportResult {
  type: string
  newCount: number
  duplicateCount: number
  errorCount: number
}

export function ImportacionesPage() {
  const { pendingMovements, confirmMovement, discardMovement, refreshMovements } = useNumi()

  const [importResults, setImportResults] = useState<ImportResult | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [discarding, setDiscarding] = useState<string | null>(null)

  const naranjaInputRef = useRef<HTMLInputElement>(null)
  const bbvaInputRef = useRef<HTMLInputElement>(null)

  const pending = pendingMovements.filter(m => m.status === 'pending')
  const confirmed = pendingMovements.filter(m => m.status === 'confirmed')
  const discarded = pendingMovements.filter(m => m.status === 'discarded')

  const showResult = (type: string, result: api.ImportResult) => {
    setImportResults({ type, newCount: result.nuevos, duplicateCount: result.duplicados, errorCount: result.errores })
    if (result.nuevos > 0) refreshMovements()
    setTimeout(() => setImportResults(null), 6000)
  }

  const handleNaranjaXUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading('naranjax')
    try {
      const result = await api.uploadNaranjaX(file)
      showResult('NaranjaX PDF', result)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al subir el archivo')
    } finally {
      setUploading(null)
      if (naranjaInputRef.current) naranjaInputRef.current.value = ''
    }
  }

  const handleBbvaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading('bbva')
    try {
      const result = await api.uploadBbva(file)
      showResult('BBVA Excel', result)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al subir el archivo')
    } finally {
      setUploading(null)
      if (bbvaInputRef.current) bbvaInputRef.current.value = ''
    }
  }

  const handleDriveSync = async (source: 'naranjax' | 'bbva') => {
    setUploading(source + '-drive')
    try {
      const result = source === 'naranjax'
        ? await api.syncDriveNaranjaX()
        : await api.syncDriveBbva()
      showResult(`${source === 'naranjax' ? 'NaranjaX' : 'BBVA'} (Drive)`, result)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al sincronizar con Drive')
    } finally {
      setUploading(null)
    }
  }

  const handleConfirm = async (id: string) => {
    setConfirming(id)
    try {
      await confirmMovement(id)
      toast.success('Movimiento confirmado y gasto creado')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo confirmar el movimiento')
    } finally {
      setConfirming(null)
    }
  }

  const handleDiscard = async (id: string) => {
    setDiscarding(id)
    try {
      await discardMovement(id)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo descartar el movimiento')
    } finally {
      setDiscarding(null)
    }
  }

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-foreground">Importaciones</h1>
        <p className="text-muted-foreground mt-1">
          Importá movimientos de tus tarjetas
        </p>
      </div>

      {/* Import Result Toast */}
      {importResults && (
        <Card className="bg-primary/5 border-primary/20 animate-in slide-in-from-top-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  Importación completada: {importResults.type}
                </p>
                <p className="text-sm text-muted-foreground">
                  {importResults.newCount} nuevos · {importResults.duplicateCount} duplicados · {importResults.errorCount} errores
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Importar movimientos</h2>

        <div className="grid md:grid-cols-2 gap-4">
          {/* NaranjaX PDF */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-orange-500" />
                Resumen NaranjaX (PDF)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                ref={naranjaInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleNaranjaXUpload}
              />
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
                onClick={() => naranjaInputRef.current?.click()}
              >
                {uploading === 'naranjax' ? (
                  <Loader2 className="h-8 w-8 text-primary mx-auto mb-2 animate-spin" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                )}
                <p className="text-sm text-muted-foreground">
                  {uploading === 'naranjax' ? 'Procesando...' : 'Arrastrá tu PDF o hacé click para subir'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Soporta resúmenes de NaranjaX
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full gap-2"
                disabled={!!uploading}
                onClick={() => handleDriveSync('naranjax')}
              >
                {uploading === 'naranjax-drive'
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Cloud className="h-4 w-4" />
                }
                Sincronizar desde Google Drive
              </Button>
            </CardContent>
          </Card>

          {/* BBVA Excel */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileSpreadsheet className="h-4 w-4 text-blue-500" />
                Movimientos BBVA (Excel)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                ref={bbvaInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleBbvaUpload}
              />
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
                onClick={() => bbvaInputRef.current?.click()}
              >
                {uploading === 'bbva' ? (
                  <Loader2 className="h-8 w-8 text-primary mx-auto mb-2 animate-spin" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                )}
                <p className="text-sm text-muted-foreground">
                  {uploading === 'bbva' ? 'Procesando...' : 'Arrastrá tu Excel o hacé click para subir'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Soporta .xlsx exportado de BBVA
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full gap-2"
                disabled={!!uploading}
                onClick={() => handleDriveSync('bbva')}
              >
                {uploading === 'bbva-drive'
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Cloud className="h-4 w-4" />
                }
                Sincronizar desde Google Drive
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Review Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Revisión de movimientos</h2>
          {pending.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              {pending.length} por revisar
            </Badge>
          )}
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="pending" className="gap-1">
              <Clock className="h-3 w-3" />
              Pendientes ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="gap-1">
              <Check className="h-3 w-3" />
              Confirmados ({confirmed.length})
            </TabsTrigger>
            <TabsTrigger value="discarded" className="gap-1">
              <X className="h-3 w-3" />
              Descartados ({discarded.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            {pending.length === 0 ? (
              <Card className="bg-card border-border border-dashed">
                <CardContent className="p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
                    <Inbox className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    No hay movimientos pendientes de revisión
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Importá un archivo para empezar
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pending.map(movement => (
                  <Card key={movement.id} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {movement.source}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(movement.date)}
                            </span>
                            {movement.installment && (
                              <Badge variant="secondary" className="text-xs">
                                Cuota {movement.installment}
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium text-foreground">
                            {movement.description}
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="font-semibold text-foreground tabular-nums">
                            {movement.currency === 'USD'
                              ? formatUsd(movement.amount)
                              : formatArs(movement.amount)
                            }
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                        <Button
                          className="flex-1 gap-1"
                          disabled={confirming === movement.id || discarding === movement.id}
                          onClick={() => handleConfirm(movement.id)}
                        >
                          {confirming === movement.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Check className="h-4 w-4" />
                          }
                          Confirmar
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 gap-1"
                          disabled={confirming === movement.id || discarding === movement.id}
                          onClick={() => handleDiscard(movement.id)}
                        >
                          {discarding === movement.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <X className="h-4 w-4" />
                          }
                          Descartar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="confirmed" className="mt-4">
            {confirmed.length === 0 ? (
              <Card className="bg-card border-border border-dashed">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No hay movimientos confirmados
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {confirmed.map(movement => (
                  <div
                    key={movement.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-success/5 border border-success/20"
                  >
                    <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">
                          {movement.description}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {movement.source}
                        </Badge>
                      </div>
                    </div>
                    <span className="text-sm font-medium tabular-nums text-foreground">
                      {movement.currency === 'USD'
                        ? formatUsd(movement.amount)
                        : formatArs(movement.amount)
                      }
                    </span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="discarded" className="mt-4">
            {discarded.length === 0 ? (
              <Card className="bg-card border-border border-dashed">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No hay movimientos descartados
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {discarded.map(movement => (
                  <div
                    key={movement.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 opacity-60"
                  >
                    <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate line-through">
                          {movement.description}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {movement.source}
                        </Badge>
                      </div>
                    </div>
                    <span className="text-sm font-medium tabular-nums text-muted-foreground">
                      {movement.currency === 'USD'
                        ? formatUsd(movement.amount)
                        : formatArs(movement.amount)
                      }
                    </span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
