import { z } from 'zod';
export const createIngresoSchema = z.object({
    descripcion: z.string().min(1),
    montoARS: z.number().min(0),
    montoUSD: z.number().min(0).optional(),
    moneda: z.enum(['ARS', 'USD']),
    periodo: z.string().min(1), // fecha ISO (ej. "2025-05-01")
    tipoCambio: z.number().positive().optional(),
});
export const updateIngresoSchema = z.object({
    descripcion: z.string().min(1).optional(),
    montoARS: z.number().min(0).optional(),
    montoUSD: z.number().min(0).optional(),
    moneda: z.enum(['ARS', 'USD']).optional(),
    periodo: z.string().min(1).optional(),
    tipoCambio: z.number().positive().optional(),
});
