import deudasService from "../services/deudas.service.js";
import { single, list } from "../utils/response.js";

export default {
    getList: async (req: any, res: any) => {
        const { data, error } = await deudasService.getListAsync();

        if (error) return res.status(500).json(error);

        res.status(200).json(list((data ?? []).map((d: any) => deudasService.calcularVOs(d))));
    },
    getById: async (req: any, res: any) => {
        const { data, error } = await deudasService.firstOrDefaultAsync(req.params.id);

        if (error) return res.status(500).json(error);
        if (!data || data.length === 0) return res.status(404).json({ message: "deuda no encontrada" });

        res.status(200).json(single(deudasService.calcularVOs(data[0])));
    },
    create: async (req: any, res: any) => {
        const { data, error } = await deudasService.insertAsync(req.body);

        if (error) return res.status(500).json(error);

        res.status(201).json(single(deudasService.calcularVOs(data)));
    },
    update: async (req: any, res: any) => {
        const { data, error } = await deudasService.updateAsync(req.params.id, req.body);

        if (error) return res.status(500).json(error);

        res.status(200).json(single(deudasService.calcularVOs(data)));
    },
    pagarCuota: async (req: any, res: any) => {
        const { data, error } = await deudasService.pagarCuotaAsync(req.params.id);

        if (error) return res.status(500).json(error);
        if (!data) return res.status(404).json({ message: "deuda no encontrada" });

        res.status(200).json(single(deudasService.calcularVOs(data)));
    },
    delete: async (req: any, res: any) => {
        const { error } = await deudasService.deleteAsync(req.params.id);

        if (error) return res.status(500).json(error);

        res.status(204).send();
    },
};
