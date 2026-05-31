import { z } from 'zod';
export const createGastoSchema = z.object({
    nombre: z.string().min(1),
    tipo: z.enum(['Fijo', 'Cuotas']),
    cuotasTotal: z.number().int().positive().optional(),
    cuotasPagadas: z.number().int().min(0).default(0),
    montoARS: z.number().min(0),
    montoUSD: z.number().min(0).optional(),
    tarjetaId: z.string().min(1).optional(),
    fechaInicio: z.string().min(1),
}).refine((g) => g.tipo !== 'Cuotas' || (g.cuotasTotal != null && g.cuotasTotal > 0), { message: 'Un gasto de tipo Cuotas requiere cuotasTotal', path: ['cuotasTotal'] });
export const updateGastoSchema = z.object({
    nombre: z.string().min(1).optional(),
    tipo: z.enum(['Fijo', 'Cuotas']).optional(),
    cuotasTotal: z.number().int().positive().optional(),
    cuotasPagadas: z.number().int().min(0).optional(),
    montoARS: z.number().min(0).optional(),
    montoUSD: z.number().min(0).optional(),
    tarjetaId: z.string().min(1).optional(),
    fechaInicio: z.string().min(1).optional(),
});
