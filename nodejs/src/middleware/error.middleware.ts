import { Request, Response, NextFunction } from 'express';

// Handler global de errores — SIEMPRE se monta al final de la cadena de middleware
export function errorMiddleware(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
) {
    console.error(`[${new Date().toISOString()}] ${err.message}`);
    res.status(500).json({ error: err.message });
}
