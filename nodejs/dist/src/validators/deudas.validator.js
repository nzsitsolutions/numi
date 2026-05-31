import { z } from 'zod';
export const createDeudaSchema = z.object({
    descripcion: z.string().min(1),
    monto: z.number().min(0),
    moneda: z.enum(['ARS', 'USD']),
});
export const updateDeudaSchema = z.object({
    descripcion: z.string().min(1).optional(),
    monto: z.number().min(0).optional(),
    moneda: z.enum(['ARS', 'USD']).optional(),
    estado: z.enum(['Activa', 'Saldada']).optional(),
});
export const confirmarMovimientoSchema = z.object({
    nombre: z.string().min(1),
    tipo: z.enum(['Fijo', 'Cuotas']),
    cuotasTotal: z.number().int().positive().optional(),
    tarjetaId: z.string().min(1).optional(),
});
