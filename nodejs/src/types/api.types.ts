export interface CreateGastoDto {
    nombre: string
    tipo: 'Fijo' | 'Cuotas'
    cuotasTotal?: number
    cuotasPagadas: number
    montoARS: number
    montoUSD?: number
    tarjetaId?: string
    fechaInicio: string
}

export interface UpdateGastoDto extends Partial<CreateGastoDto> { }

export interface CreateIngresoDto {
    descripcion: string
    montoARS: number
    montoUSD?: number
    moneda: 'ARS' | 'USD'
    periodo: string
}

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