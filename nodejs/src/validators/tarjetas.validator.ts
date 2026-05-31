import { z } from 'zod';

export const createTarjetaSchema = z.object({
    nombre: z.string().min(1),
    limiteUSD: z.number().min(0),
    fechaCierre: z.string().min(1),
    fechaVencimiento: z.string().min(1),
    gastoId: z.string().min(1).optional(),
    esNoTarjeta: z.boolean().optional(),
});

export const updateTarjetaSchema = z.object({
    nombre: z.string().min(1).optional(),
    limiteUSD: z.number().min(0).optional(),
    fechaCierre: z.string().min(1).optional(),
    fechaVencimiento: z.string().min(1).optional(),
    gastoId: z.string().min(1).optional(),
    esNoTarjeta: z.boolean().optional(),
});
