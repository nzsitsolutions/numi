import { z } from 'zod';

export const createDeudaSchema = z.object({
    descripcion: z.string().min(1),
    monto: z.number().min(0),
    moneda: z.enum(['ARS', 'USD']),
    cuotasTotal: z.number().int().positive().optional(),
    notas: z.string().optional(),
});

export const updateDeudaSchema = z.object({
    descripcion: z.string().min(1).optional(),
    monto: z.number().min(0).optional(),
    moneda: z.enum(['ARS', 'USD']).optional(),
    estado: z.enum(['activa', 'saldada']).optional(),
    cuotasPagadas: z.number().int().min(0).optional(),
    cuotasTotal: z.number().int().positive().optional(),
    notas: z.string().optional(),
});

export const confirmarMovimientoSchema = z.object({
    nombre: z.string().min(1),
    tipo: z.enum(['fijo', 'cuotas']),
    cuotasTotal: z.number().int().positive().optional(),
    tarjetaId: z.string().min(1).optional(),
});
