import gastosService from "../services/gastos.service.js";
import { single, list } from "../utils/response.js";

export default {
    getList: async (req: any, res: any) => {
        const { data, error } = await gastosService.getListAsync();

        if (error) return res.status(500).json(error);

        res.status(200).json(list((data ?? []).map((g: any) => gastosService.calcularVOs(g))));
    },
    getById: async (req: any, res: any) => {
        const { data, error } = await gastosService.firstOrDefaultAsync(req.params.id);

        if (error) return res.status(500).json(error);
        if (!data || data.length === 0) return res.status(404).json({ message: "gasto no encontrado" });

        res.status(200).json(single(gastosService.calcularVOs(data[0])));
    },
    create: async (req: any, res: any) => {
        const { data, error } = await gastosService.insertAsync(req.body);

        if (error) return res.status(500).json(error);

        res.status(201).json(single(gastosService.calcularVOs(data)));
    },
    delete: async (req: any, res: any) => {
        const { error } = await gastosService.deleteAsync(req.params.id);

        if (error) return res.status(500).json(error);

        res.status(204).send();
    },
    update: async (req: any, res: any) => {
        const { data, error } = await gastosService.updateAsync(req.params.id, req.body);

        if (error) return res.status(500).json(error);

        res.status(200).json(single(gastosService.calcularVOs(data)));
    },
    pagarCuota: async (req: any, res: any) => {
        const { data, error } = await gastosService.firstOrDefaultAsync(req.params.id);

        if (error) return res.status(500).json(error);
        if (!data || data.length === 0) return res.status(404).json({ message: "gasto no encontrado" });

        const { data: updated, error: paymentError } = await gastosService.pagarCuota(data[0]);

        if (paymentError) return res.status(400).json(paymentError);

        res.status(200).json(single(gastosService.calcularVOs(updated)));
    },
};
