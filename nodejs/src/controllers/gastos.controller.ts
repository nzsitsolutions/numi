import gastosService from "../services/gastos.service.js";

export default {
    getList: async (req: any, res: any) => {
        const { data, error } = await gastosService.getListAsync();

        if (error) return res.status(500).json(error);

        res.status(200).json(data);
    },
    getById: async (req: any, res: any) => {
        const { data, error } = await gastosService.firstOrDefaultAsync(req.params.id);

        if (error) return res.status(500).json(error);

        res.status(200).json(data[0]);
    },
    create: async (req: any, res: any) => {
        const { data, error } = await gastosService.insertAsync(req.body.data);

        if (error) return res.status(500).json(error);

        res.status(201).json(data);
    },
    delete: async (req: any, res: any) => {
        const { data, error } = await gastosService.deleteAsync(req.params.id);

        if (error) return res.status(500).json(error);

        res.status(200).json(data);
    },
    update: async (req: any, res: any) => {
        const { data, error } = await gastosService.updateAsync(req.params.id, req.body.data);

        if (error) return res.status(500).json(error);

        res.status(200).json(data);
    },
    pagarCuota: async (req: any, res: any) => {
        const { data, error } = await gastosService.firstOrDefaultAsync(req.params.id);

        if (error) return res.status(500).json(error);

        const { data: updated, error: paymentError } = await gastosService.pagarCuota(data[0]);

        if (paymentError) return res.status(500).json(paymentError);

        let gastoPagado = gastosService.calcularVOs(updated);

        res.status(200).json(gastoPagado);
    }
}