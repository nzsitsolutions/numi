export interface IngresoDto {
    id: string;
    descripcion?: string;
    montoARS: number;
    montoUSD?: number;
    moneda?: "ARS" | "USD";
    yearMonth?: Date;
}