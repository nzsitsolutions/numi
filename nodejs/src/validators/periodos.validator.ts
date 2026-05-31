import { z } from 'zod';

export const createPeriodoSchema = z.object({
    anio: z.number().int().min(2000).max(2100),
    mes: z.number().int().min(1).max(12),
    tipoCambio: z.number().positive(),
});

export const updateTipoCambioSchema = z.object({
    tipoCambio: z.number().positive(),
});
