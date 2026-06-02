import { Moneda } from "./database.types.js";

// ─── GASTOS ─────────────────────────────────────────────────
export interface CreateGastoDto {
    nombre: string
    tipo: 'fijo' | 'cuotas'
    cuotasTotal?: number
    cuotasPagadas: number
    montoARS: number
    montoUSD?: number
    tarjetaId?: string
    fechaInicio: string
}

export interface UpdateGastoDto extends Partial<CreateGastoDto> { }

// ─── INGRESOS ───────────────────────────────────────────────
export interface CreateIngresoDto {
    descripcion: string
    montoARS: number
    montoUSD?: number
    moneda: Moneda
    periodo: string         // fecha ISO (representa el mes)
    tipoCambio?: number     // valor del USD en ese momento
}

export interface UpdateIngresoDto extends Partial<CreateIngresoDto> { }

// ─── TARJETAS ───────────────────────────────────────────────
export interface CreateTarjetaDto {
    nombre: string              // 'NaranjaX' | 'BBVA' | 'Mercado Pago' ...
    limiteUSD: number
    fechaCierre: string         // ISO date
    fechaVencimiento: string    // ISO date
}

export interface UpdateTarjetaDto extends Partial<CreateTarjetaDto> { }

// ─── PERIODOS ───────────────────────────────────────────────
export interface CreatePeriodoDto {
    anio: number
    mes: number
    tipoCambio: number
}

export interface UpdateTipoCambioDto {
    tipoCambio: number
}

// ─── DEUDAS ─────────────────────────────────────────────────
export interface CreateDeudaDto {
    descripcion: string
    monto: number               // monto por cuota (o monto total si es fijo)
    moneda: Moneda
    cuotasTotal?: number        // undefined = monto fijo de una sola vez
    notas?: string
}

export interface UpdateDeudaDto extends Partial<CreateDeudaDto> {
    estado?: 'activa' | 'saldada'
    cuotasPagadas?: number
}

// ─── IMPORTACIONES ──────────────────────────────────────────
export interface ConfirmarMovimientoDto {
    nombre: string
    tipo: 'fijo' | 'cuotas'
    cuotasTotal?: number
    tarjetaId?: string
}

// ─── ENVELOPES ──────────────────────────────────────────────
export interface ApiResponse<T> {
    data: T
    message?: string
}

export interface ApiError {
    error: string
    details?: unknown
}

export interface ImportacionResultDto {
    totalEnArchivo: number
    nuevos: number
    duplicados: number
    errores: number
}
