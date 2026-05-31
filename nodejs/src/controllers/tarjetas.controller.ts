import tarjetasService from "../services/tarjetas.service.js";
import { single, list } from "../utils/response.js";

export default {
    getList: async (req: any, res: any) => {
        const { data, error } = await tarjetasService.getListAsync();

        if (error) return res.status(500).json(error);

        res.status(200).json(list((data ?? []).map((t: any) => tarjetasService.calcularVOs(t))));
    },
    getById: async (req: any, res: any) => {
        const { data, error } = await tarjetasService.firstOrDefaultAsync(req.params.id);

        if (error) return res.status(500).json(error);
        if (!data || data.length === 0) return res.status(404).json({ message: "tarjeta no encontrada" });

        res.status(200).json(single(tarjetasService.calcularVOs(data[0])));
    },
    create: async (req: any, res: any) => {
        const { data, error } = await tarjetasService.insertAsync(req.body);

        if (error) return res.status(500).json(error);

        res.status(201).json(single(tarjetasService.calcularVOs(data)));
    },
    update: async (req: any, res: any) => {
        const { data, error } = await tarjetasService.updateAsync(req.params.id, req.body);

        if (error) return res.status(500).json(error);

        res.status(200).json(single(tarjetasService.calcularVOs(data)));
    },
    delete: async (req: any, res: any) => {
        const { error } = await tarjetasService.deleteAsync(req.params.id);

        if (error) return res.status(500).json(error);

        res.status(204).send();
    },
};
