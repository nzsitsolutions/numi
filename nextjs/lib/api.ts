import { CreditCard, Expense, Income, Debt, PendingMovement, ExpenseWithCalculations } from '@/lib/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

let accessTokenGetter: (() => Promise<string | null>) | null = null

export function setAccessTokenGetter(getter: () => Promise<string | null>) {
  accessTokenGetter = getter
}

async function authHeaders(extra?: HeadersInit): Promise<HeadersInit> {
  const token = accessTokenGetter ? await accessTokenGetter() : null
  if (!token) {
    throw new Error('No hay sesión activa')
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...extra,
  }
}

// ─── Backend response types ──────────────────────────────────────────────────

interface ApiGastoConCalculo {
  id: string
  nombre: string
  tipo: 'fijo' | 'cuotas'
  cuotasTotal: number | null
  cuotasPagadas: number
  montoARS: number
  montoUSD: number
  tarjetaId: string | null
  fechaInicio: string
  activo: boolean
  cuotasRestantes: number
  montoMensualARS: number
  montoPagado: number
  montoTotalRestante: number
  totalAPagar: number
  avancePorcentaje: number
}

interface ApiTarjeta {
  id: string
  nombre: string
  limiteUSD: number
  fechaCierre: string
  fechaVencimiento: string
}

export interface ApiIngreso {
  id: string
  descripcion: string
  montoARS: number
  montoUSD: number
  moneda: 'ARS' | 'USD'
  periodo: string
  tipoCambio: number | null
}

interface ApiDeuda {
  id: string
  descripcion: string
  monto: number
  moneda: 'ARS' | 'USD'
  estado: 'activa' | 'saldada'
  notas: string | null
  cuotasTotal: number | null
  cuotasPagadas: number | null
  cuotasRestantes: number | null
  avancePorcentaje: number | null
}

interface ApiMovimiento {
  id: string
  origen: string
  fecha: string
  descripcion: string
  monto_ars: number
  cuota_actual: number | null
  cuotas_total: number | null
  estado_revision: 'pendiente' | 'confirmado' | 'descartado'
}

export interface ApiPeriodo {
  id: string
  anio: number
  mes: number
  tipoCambio: number
}

interface ApiGrupoTarjeta {
  tarjetaId: string | null
  tarjetaNombre: string
  gastos: ApiGastoConCalculo[]
  totalMensualARS: number
  cierreARS: number
}

interface SingleResponse<T> { data: T }
interface ListResponse<T> { data: { items: T[] } }

export interface ImportResult {
  totalEnArchivo: number
  nuevos: number
  duplicados: number
  errores: number
}

// ─── Color management (stored per card ID in localStorage) ──────────────────

const CARD_COLORS = [
  'from-orange-500 to-orange-600',
  'from-blue-600 to-blue-700',
  'from-red-500 to-red-600',
  'from-green-500 to-green-600',
  'from-purple-500 to-purple-600',
  'from-gray-700 to-gray-800',
  'from-amber-500 to-amber-600',
  'from-pink-500 to-pink-600',
]

export function getCardColor(id: string, index: number): string {
  if (typeof window === 'undefined') return CARD_COLORS[index % CARD_COLORS.length]
  return localStorage.getItem(`numi-card-color-${id}`) || CARD_COLORS[index % CARD_COLORS.length]
}

export function setCardColor(id: string, color: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`numi-card-color-${id}`, color)
  }
}

// ─── Type mapping helpers ────────────────────────────────────────────────────

function dayFromDate(dateStr: string): number {
  if (!dateStr) return 1
  const match = dateStr.match(/^\d{4}-\d{2}-(\d{2})/)
  return match ? parseInt(match[1], 10) : new Date(dateStr).getUTCDate()
}

function dayToDate(day: number): string {
  return `2000-01-${String(day).padStart(2, '0')}`
}

function mapGasto(g: ApiGastoConCalculo): Expense {
  return {
    id: g.id,
    name: g.nombre,
    type: g.tipo,
    amountArs: g.montoARS,
    amountUsd: g.montoUSD > 0 ? g.montoUSD : undefined,
    totalInstallments: g.cuotasTotal ?? undefined,
    paidInstallments: g.cuotasPagadas,
    cardId: g.tarjetaId ?? undefined,
    startDate: g.fechaInicio,
  }
}

function mapGastoWithCalc(g: ApiGastoConCalculo): ExpenseWithCalculations {
  return {
    ...mapGasto(g),
    monthlyArs: g.montoMensualARS,
    remainingInstallments: g.cuotasRestantes,
    paidArs: g.montoPagado,
    remainingArs: g.montoTotalRestante,
    totalArs: g.totalAPagar,
    progress: g.avancePorcentaje,
  }
}

function mapTarjeta(t: ApiTarjeta, index: number): CreditCard {
  return {
    id: t.id,
    name: t.nombre,
    limitUsd: t.limiteUSD,
    closeDay: dayFromDate(t.fechaCierre),
    dueDay: dayFromDate(t.fechaVencimiento),
    color: getCardColor(t.id, index),
  }
}

function mapIngreso(i: ApiIngreso): Income {
  let currency: 'ARS' | 'USD' | 'both' = i.moneda
  if (i.montoARS > 0 && i.montoUSD > 0) currency = 'both'
  return {
    id: i.id,
    description: i.descripcion,
    amountArs: i.montoARS > 0 ? i.montoARS : undefined,
    amountUsd: i.montoUSD > 0 ? i.montoUSD : undefined,
    currency,
    period: i.periodo ? i.periodo.substring(0, 7) : '',
    exchangeRate: i.tipoCambio ?? undefined,
  }
}

function mapDeuda(d: ApiDeuda): Debt {
  return {
    id: d.id,
    description: d.descripcion,
    amount: d.monto,
    currency: d.moneda,
    status: d.estado,
    notes: d.notas ?? undefined,
    totalInstallments: d.cuotasTotal ?? undefined,
    paidInstallments: d.cuotasPagadas ?? undefined,
    remainingInstallments: d.cuotasRestantes ?? undefined,
    progress: d.avancePorcentaje ?? undefined,
  }
}

function mapMovimiento(m: ApiMovimiento): PendingMovement {
  const statusMap: Record<string, 'pending' | 'confirmed' | 'discarded'> = {
    pendiente: 'pending',
    confirmado: 'confirmed',
    descartado: 'discarded',
  }
  let installment: string | undefined
  if (m.cuota_actual != null && m.cuotas_total != null) {
    installment = `${m.cuota_actual}/${m.cuotas_total}`
  }
  return {
    id: m.id,
    source: m.origen,
    date: m.fecha,
    description: m.descripcion,
    amount: m.monto_ars,
    currency: 'ARS',
    installment,
    status: statusMap[m.estado_revision] ?? 'pending',
  }
}

// ─── HTTP helpers ────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: await authHeaders(options?.headers),
  })
  if (!res.ok) {
    let message = `Error ${res.status}`
    try {
      const body = await res.json()
      message = body?.message || body?.error || message
    } catch { /* ignore */ }
    throw new Error(message)
  }
  if (res.status === 204) return undefined as unknown as T
  return res.json()
}

function get<T>(path: string) { return apiFetch<T>(path) }
function post<T>(path: string, body?: unknown) { return apiFetch<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }) }
function patch<T>(path: string, body?: unknown) { return apiFetch<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }) }
function del(path: string) { return apiFetch<void>(path, { method: 'DELETE' }) }

// Upload: multipart/form-data
async function uploadFile(path: string, file: File, fieldName = 'archivo'): Promise<{ data: ImportResult }> {
  const token = accessTokenGetter ? await accessTokenGetter() : null
  if (!token) throw new Error('No hay sesión activa')
  const form = new FormData()
  form.append(fieldName, file)
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    body: form,
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    let message = `Error ${res.status}`
    try { const b = await res.json(); message = b?.message || message } catch { /* ignore */ }
    throw new Error(message)
  }
  return res.json()
}

// ─── API functions ───────────────────────────────────────────────────────────

// TARJETAS
export async function fetchCards(): Promise<CreditCard[]> {
  const res = await get<ListResponse<ApiTarjeta>>('/api/tarjetas')
  return res.data.items.map((t, i) => mapTarjeta(t, i))
}

export async function createCard(data: Omit<CreditCard, 'id'>): Promise<CreditCard> {
  const body = {
    nombre: data.name,
    limiteUSD: data.limitUsd,
    fechaCierre: dayToDate(data.closeDay),
    fechaVencimiento: dayToDate(data.dueDay),
  }
  const res = await post<SingleResponse<ApiTarjeta>>('/api/tarjetas', body)
  setCardColor(res.data.id, data.color)
  return { ...mapTarjeta(res.data, 0), color: data.color }
}

export async function updateCard(id: string, data: Partial<CreditCard>): Promise<CreditCard> {
  const body: Record<string, unknown> = {}
  if (data.name !== undefined) body.nombre = data.name
  if (data.limitUsd !== undefined) body.limiteUSD = data.limitUsd
  if (data.closeDay !== undefined) body.fechaCierre = dayToDate(data.closeDay)
  if (data.dueDay !== undefined) body.fechaVencimiento = dayToDate(data.dueDay)
  if (data.color !== undefined) setCardColor(id, data.color)
  const res = await patch<SingleResponse<ApiTarjeta>>(`/api/tarjetas/${id}`, body)
  const color = data.color ?? getCardColor(id, 0)
  return { ...mapTarjeta(res.data, 0), color }
}

export async function deleteCard(id: string): Promise<void> {
  await del(`/api/tarjetas/${id}`)
}

// GASTOS
export async function fetchExpenses(): Promise<Expense[]> {
  const res = await get<ListResponse<ApiGastoConCalculo>>('/api/gastos')
  return res.data.items.map(mapGasto)
}

export async function createExpense(data: Omit<Expense, 'id'>): Promise<Expense> {
  const body = {
    nombre: data.name,
    tipo: data.type,
    cuotasTotal: data.totalInstallments,
    cuotasPagadas: data.paidInstallments ?? 0,
    montoARS: data.amountArs,
    montoUSD: data.amountUsd,
    tarjetaId: data.cardId,
    fechaInicio: data.startDate,
  }
  const res = await post<SingleResponse<ApiGastoConCalculo>>('/api/gastos', body)
  return mapGasto(res.data)
}

export async function updateExpense(id: string, data: Partial<Expense>): Promise<Expense> {
  const body: Record<string, unknown> = {}
  if (data.name !== undefined) body.nombre = data.name
  if (data.type !== undefined) body.tipo = data.type
  if (data.totalInstallments !== undefined) body.cuotasTotal = data.totalInstallments
  if (data.paidInstallments !== undefined) body.cuotasPagadas = data.paidInstallments
  if (data.amountArs !== undefined) body.montoARS = data.amountArs
  if (data.amountUsd !== undefined) body.montoUSD = data.amountUsd
  if (data.cardId !== undefined) body.tarjetaId = data.cardId
  if (data.startDate !== undefined) body.fechaInicio = data.startDate
  const res = await patch<SingleResponse<ApiGastoConCalculo>>(`/api/gastos/${id}`, body)
  return mapGasto(res.data)
}

export async function deleteExpense(id: string): Promise<void> {
  await del(`/api/gastos/${id}`)
}

export async function payInstallment(id: string): Promise<Expense> {
  const res = await post<SingleResponse<ApiGastoConCalculo>>(`/api/gastos/${id}/pagar-cuota`)
  return mapGasto(res.data)
}

// INGRESOS
export async function fetchIncomes(): Promise<Income[]> {
  const res = await get<ListResponse<ApiIngreso>>('/api/ingresos')
  return res.data.items.map(mapIngreso)
}

export async function createIncome(data: Omit<Income, 'id'>, exchangeRate: number): Promise<Income> {
  const moneda = data.currency === 'USD' ? 'USD' : 'ARS'
  const body = {
    descripcion: data.description,
    montoARS: data.amountArs ?? 0,
    montoUSD: data.amountUsd,
    moneda,
    periodo: data.period + '-01',
    tipoCambio: exchangeRate,
  }
  const res = await post<SingleResponse<ApiIngreso>>('/api/ingresos', body)
  return mapIngreso(res.data)
}

export async function updateIncome(id: string, data: Partial<Income>, exchangeRate: number): Promise<Income> {
  const body: Record<string, unknown> = {}
  if (data.description !== undefined) body.descripcion = data.description
  if (data.amountArs !== undefined) body.montoARS = data.amountArs
  if (data.amountUsd !== undefined) body.montoUSD = data.amountUsd
  if (data.currency !== undefined) body.moneda = data.currency === 'USD' ? 'USD' : 'ARS'
  if (data.period !== undefined) body.periodo = data.period + '-01'
  body.tipoCambio = exchangeRate
  const res = await patch<SingleResponse<ApiIngreso>>(`/api/ingresos/${id}`, body)
  return mapIngreso(res.data)
}

export async function deleteIncome(id: string): Promise<void> {
  await del(`/api/ingresos/${id}`)
}

// DEUDAS
export async function fetchDebts(): Promise<Debt[]> {
  const res = await get<ListResponse<ApiDeuda>>('/api/deudas')
  return res.data.items.map(mapDeuda)
}

export async function createDebt(data: Omit<Debt, 'id'>): Promise<Debt> {
  const body: Record<string, unknown> = {
    descripcion: data.description,
    monto: data.amount,
    moneda: data.currency,
  }
  if (data.totalInstallments != null) body.cuotasTotal = data.totalInstallments
  if (data.notes) body.notas = data.notes
  const res = await post<SingleResponse<ApiDeuda>>('/api/deudas', body)
  return mapDeuda(res.data)
}

export async function updateDebt(id: string, data: Partial<Debt>): Promise<Debt> {
  const body: Record<string, unknown> = {}
  if (data.description !== undefined) body.descripcion = data.description
  if (data.amount !== undefined) body.monto = data.amount
  if (data.currency !== undefined) body.moneda = data.currency
  if (data.notes !== undefined) body.notas = data.notes
  if (data.totalInstallments !== undefined) body.cuotasTotal = data.totalInstallments
  if (data.status !== undefined) body.estado = data.status
  const res = await patch<SingleResponse<ApiDeuda>>(`/api/deudas/${id}`, body)
  return mapDeuda(res.data)
}

export async function deleteDebt(id: string): Promise<void> {
  await del(`/api/deudas/${id}`)
}

export async function markDebtAsPaid(id: string): Promise<Debt> {
  const res = await patch<SingleResponse<ApiDeuda>>(`/api/deudas/${id}`, { estado: 'saldada' })
  return mapDeuda(res.data)
}

export async function payDebtInstallment(id: string): Promise<Debt> {
  const res = await patch<SingleResponse<ApiDeuda>>(`/api/deudas/${id}/pagar-cuota`, {})
  return mapDeuda(res.data)
}

// PERIODOS
export async function fetchPeriodo(year: number, month: number): Promise<ApiPeriodo | null> {
  try {
    const res = await get<SingleResponse<ApiPeriodo>>(`/api/periodos/${year}/${month}`)
    return res.data
  } catch {
    return null
  }
}

export async function createOrUpdatePeriodo(year: number, month: number, tipoCambio: number): Promise<ApiPeriodo> {
  const existing = await fetchPeriodo(year, month)
  if (existing) {
    const res = await patch<SingleResponse<ApiPeriodo>>(
      `/api/periodos/${year}/${month}/tipo-cambio`,
      { tipoCambio }
    )
    return res.data
  }
  const res = await post<SingleResponse<ApiPeriodo>>('/api/periodos', { anio: year, mes: month, tipoCambio })
  return res.data
}

// IMPORTACIONES - movimientos pendientes
export async function fetchPendingMovements(): Promise<PendingMovement[]> {
  const res = await get<ListResponse<ApiMovimiento>>('/api/importaciones/pendientes')
  return res.data.items.map(mapMovimiento)
}

export async function confirmMovement(id: string): Promise<void> {
  await patch<unknown>(`/api/importaciones/${id}/confirmar`)
}

export async function discardMovement(id: string): Promise<unknown> {
  const res = await patch<SingleResponse<ApiMovimiento>>(`/api/importaciones/${id}/descartar`)
  return res.data
}

export async function uploadNaranjaX(file: File): Promise<ImportResult> {
  const res = await uploadFile('/api/importaciones/naranjax/upload', file)
  return res.data
}

export async function uploadBbva(file: File): Promise<ImportResult> {
  const res = await uploadFile('/api/importaciones/bbva/upload', file)
  return res.data
}

export async function syncDriveNaranjaX(): Promise<ImportResult> {
  const res = await post<SingleResponse<ImportResult>>('/api/importaciones/naranjax/drive-sync')
  return res.data
}

export async function syncDriveBbva(): Promise<ImportResult> {
  const res = await post<SingleResponse<ImportResult>>('/api/importaciones/bbva/drive-sync')
  return res.data
}

// ─── Cotización en tiempo real (dolarapi.com) ────────────────────────────────

export interface LiveRate {
  casa: 'oficial' | 'blue' | 'tarjeta' | 'bolsa' | 'contadoconliqui' | 'cripto' | 'mayorista'
  nombre: string
  compra: number
  venta: number
  fechaActualizacion: string
}

const LIVE_RATE_TYPES: LiveRate['casa'][] = ['oficial', 'blue', 'tarjeta']

export async function fetchLiveRates(): Promise<LiveRate[]> {
  const res = await fetch('https://dolarapi.com/v1/dolares', {
    next: { revalidate: 0 },
  } as RequestInit)
  if (!res.ok) throw new Error('No se pudo obtener la cotización')
  const all: LiveRate[] = await res.json()
  return all.filter(r => LIVE_RATE_TYPES.includes(r.casa))
}
