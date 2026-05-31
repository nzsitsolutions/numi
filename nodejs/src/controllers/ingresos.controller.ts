import ingresos_service from "../services/ingresos.service.js";
import { single, list } from "../utils/response.js";

export default {
    getList: async (req: any, res: any) => {
        const { data, error } = await ingresos_service.getListAsync(req.query.periodo);

        if (error) return res.status(500).json(error);

        res.status(200).json(list((data ?? []).map((i: any) => ingresos_service.calcularVOs(i))));
    },
    getById: async (req: any, res: any) => {
        const { data, error } = await ingresos_service.firstOrDefaultAsync(req.params.id);

        if (error) return res.status(500).json(error);
        if (!data || data.length === 0) return res.status(404).json({ message: "ingreso no encontrado" });

        res.status(200).json(single(ingresos_service.calcularVOs(data[0])));
    },
    create: async (req: any, res: any) => {
        const { data, error } = await ingresos_service.insertAsync(req.body);

        if (error) return res.status(500).json(error);

        res.status(201).json(single(ingresos_service.calcularVOs(data)));
    },
    delete: async (req: any, res: any) => {
        const { error } = await ingresos_service.deleteAsync(req.params.id);

        if (error) return res.status(500).json(error);

        res.status(204).send();
    },
    update: async (req: any, res: any) => {
        const { data, error } = await ingresos_service.updateAsync(req.params.id, req.body);

        if (error) return res.status(500).json(error);

        res.status(200).json(single(ingresos_service.calcularVOs(data)));
    },
};
