import { Moneda } from "./database.types.js";

// DTO de respuesta de un ingreso (camelCase, ya mapeado desde la fila snake_case)
export interface IngresoDto {
    id: string
    descripcion?: string
    montoARS: number
    montoUSD?: number
    moneda: Moneda
    periodo?: string
    tipoCambio?: number
}
