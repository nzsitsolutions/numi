import importacionesService from "../services/importaciones/importaciones.service.js";
import { single, list } from "../utils/response.js";

export default {
    getPendientes: async (req: any, res: any) => {
        console.log("pendientes...");
        const { data, error } = await importacionesService.getPendientesAsync();

        if (error) return res.status(500).json(error);

        res.status(200).json(list(data ?? []));
    },
    confirmar: async (req: any, res: any) => {
        const { data, error } = await importacionesService.firstOrDefaultAsync(req.params.id);

        if (error) return res.status(500).json(error);
        if (!data || data.length === 0) return res.status(404).json({ message: "movimiento no encontrado" });

        const { data: gasto, error: confirmError } = await importacionesService.confirmarAsync(data[0]);

        if (confirmError) return res.status(500).json(confirmError);

        res.status(201).json(single(gasto));
    },
    descartar: async (req: any, res: any) => {
        const { data, error } = await importacionesService.descartarAsync(req.params.id);

        if (error) return res.status(500).json(error);

        res.status(200).json(single(data));
    },

    uploadNaranjaX: async (req: any, res: any) => {
        if (!req.file) return res.status(400).json({ message: "Falta el archivo (campo 'archivo')" });
        try {
            const result = await importacionesService.procesarBufferAsync(
                req.file.buffer,
                req.file.originalname,
            );
            res.status(200).json(single(result));
        } catch (e: any) {
            res.status(500).json({ message: e.message });
        }
    },

    syncDriveNaranjaX: async (_req: any, res: any) => {
        try {
            const result = await importacionesService.syncDriveNaranjaXAsync();
            res.status(200).json(single(result));
        } catch (e: any) {
            res.status(500).json({ message: e.message });
        }
    },

    // ── BBVA (CSV) ──
    uploadBbva: async (req: any, res: any) => {
        if (!req.file) return res.status(400).json({ message: "Falta el archivo (campo 'archivo')" });
        try {
            const result = await importacionesService.procesarBufferBbvaAsync(
                req.file.buffer,
                req.file.originalname,
            );
            res.status(200).json(single(result));
        } catch (e: any) {
            res.status(500).json({ message: e.message });
        }
    },

    syncDriveBbva: async (_req: any, res: any) => {
        try {
            const result = await importacionesService.syncDriveBbvaAsync();
            res.status(200).json(single(result));
        } catch (e: any) {
            res.status(500).json({ message: e.message });
        }
    },
};
