export type TipoGasto = 'fijo' | 'cuotas'
export type Moneda = 'ARS' | 'USD'
export type OrigenImportacion = 'NaranjaX' | 'BBVA' | 'Mercado Pago' | 'Manual'
export type EstadoRevision = 'pendiente' | 'confirmado' | 'descartado'

export interface GastoCalculado {
    cuotasRestantes: number
    montoTotalRestante: number
    totalAPagar: number
    avancePorcentaje: number
}

export interface GastoConCalculo {
    id: string
    nombre: string
    tipo: TipoGasto
    cuotasTotal: number | null
    cuotasPagadas: number
    montoARS: number
    montoUSD: number
    tarjetaId: string | null
    fechaInicio: string
    activo: boolean
    cuotasRestantes: number
    montoTotalRestante: number
    totalAPagar: number
    avancePorcentaje: number
}

export interface ResumenMensual {
    valorUSD: number
    totalMensualARS: number
    totalMensualUSD: number
    totalMesARS: number
    sinDeudasARS: number
    cierreTotalARS: number
    tarjetasMensualARS: number
    noTarjetasMensualARS: number
    totalIngresosARS: number
    totalIngresosUSD: number
    tarjetas: {
        id: string
        limiteUSD: number
        usadoUSD: number
        fechaCierre: string
        esNoTarjeta: boolean
    }[]
    deudasExtras: {
        descripcion: string
        monto: number
        moneda: Moneda
    }[]
}