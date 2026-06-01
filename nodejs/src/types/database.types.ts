export type TipoGasto = 'fijo' | 'cuotas'
export type Moneda = 'ARS' | 'USD'
export type OrigenImportacion = 'NaranjaX' | 'BBVA' | 'Mercado Pago' | 'Manual'
export type EstadoRevision = 'pendiente' | 'confirmado' | 'descartado'

export interface GastoConCalculo {
    id: string
    nombre: string
    tipo: TipoGasto
    cuotasTotal: number | null
    cuotasPagadas: number
    montoARS: number              // monto unitario crudo en ARS (una cuota / mes)
    montoUSD: number              // monto unitario crudo en USD
    tarjetaId: string | null
    fechaInicio: string
    activo: boolean
    // VOs calculados (todos en ARS, con USD ya convertido por la cotización del período):
    cuotasRestantes: number
    montoMensualARS: number       // lo que paga este mes en ARS (0 si las cuotas ya terminaron)
    montoPagado: number           // lo ya pagado en ARS
    montoTotalRestante: number    // lo que falta pagar en ARS
    totalAPagar: number           // costo completo del gasto en ARS
    avancePorcentaje: number
}

export interface GrupoTarjeta {
    tarjetaId: string | null
    tarjetaNombre: string         // nombre de la tarjeta o "Sin tarjeta"
    gastos: GastoConCalculo[]
    totalMensualARS: number       // suma del mes de este grupo
    cierreARS: number             // suma de montoTotalRestante de este grupo (payoff)
}

export interface ResumenMensual {
    valorUSD: number              // cotización del período
    totalMensualARS: number       // suma mensual de la parte en ARS
    totalMensualUSD: number       // suma mensual de la parte en USD
    totalMesARS: number           // ARS + USD×cotización
    sinDeudasARS: number          // suma mensual de los gastos fijos
    cierreTotalARS: number        // Σ montoTotalRestante de todos los gastos (payoff total)
    tarjetasMensualARS: number
    noTarjetasMensualARS: number
    totalIngresosARS: number
    totalIngresosUSD: number
    tarjetas: {
        id: string
        nombre: string
        limiteUSD: number
        usadoUSD: number
        disponibleUSD: number
        cierreARS: number         // payoff de esta tarjeta
        fechaCierre: string
        fechaVencimiento: string
    }[]
    deudasExtras: {
        descripcion: string
        monto: number
        moneda: Moneda
        montoARS: number          // monto convertido a ARS
    }[]
}
