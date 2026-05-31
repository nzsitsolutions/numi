// Handler global de errores — SIEMPRE se monta al final de la cadena de middleware
export function errorMiddleware(err, _req, res, _next) {
    console.error(`[${new Date().toISOString()}] ${err.message}`);
    res.status(500).json({ error: err.message });
}
