import importacionesService from "../services/importaciones/importaciones.service.js";
import { single, list } from "../utils/response.js";

export default {
    getPendientes: async (req: any, res: any) => {
        const { data, error } = await importacionesService.getPendientesAsync();

        if (error) return res.status(500).json(error);

        res.status(200).json(list(data ?? []));
    },
    confirmar: async (req: any, res: any) => {
        const { data, error } = await importacionesService.firstOrDefaultAsync(req.params.id);

        if (error) return res.status(500).json(error);
        if (!data || data.length === 0) return res.status(404).json({ message: "movimiento no encontrado" });

        const { data: gasto, error: confirmError } = await importacionesService.confirmarAsync(
            data[0],
            req.body,
        );

        if (confirmError) return res.status(500).json(confirmError);

        res.status(201).json(single(gasto));
    },
    descartar: async (req: any, res: any) => {
        const { data, error } = await importacionesService.descartarAsync(req.params.id);

        if (error) return res.status(500).json(error);

        res.status(200).json(single(data));
    },

    // ─── Pendientes de implementar (requieren dependencias/credenciales/muestras) ───
    // Necesitan: multer + pdf-parse (parser NaranjaX), googleapis (Drive), API MercadoPago.
    uploadNaranjaX: async (_req: any, res: any) => {
        res.status(501).json({ message: "Upload/parser NaranjaX aún no implementado" });
    },
    syncDriveNaranjaX: async (_req: any, res: any) => {
        res.status(501).json({ message: "Sync de Google Drive aún no implementado" });
    },
    syncMercadoPago: async (_req: any, res: any) => {
        res.status(501).json({ message: "Sync de MercadoPago aún no implementado" });
    },
};
