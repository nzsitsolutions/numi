import { IngresoDto } from "../../shared/models/ingreso-dto.js";
import ingresos_service from "../services/ingresos.service.js";

export default {
    getList: async (req: any, res: any) => {
        const { data, error } = await ingresos_service.getListAsync();

        if (error) return res.status(500).json(error);

        res.status(200).json(data);
    },
    getById: async (req: any, res: any) => {
        const { data, error } = await ingresos_service.firstOrDefaultAsync(req.params.id);

        if (error) return res.status(500).json(error);

        let ingreso: IngresoDto = {
            id: data[0].id,
            montoARS: data[0].monto_ars,
            moneda: "ARS"
        };

        res.status(200).json(ingreso);
    },
    create: async (req: any, res: any) => {
        const { data, error } = await ingresos_service.insertAsync(req.body.data);

        if (error) return res.status(500).json(error);

        res.status(200).json(data);
    },
    delete: async (req: any, res: any) => {
        const { data, error } = await ingresos_service.deleteAsync(req.params.id);

        if (error) return res.status(500).json(error);

        res.status(200).json(data);
    },
    update: async (req: any, res: any) => {
        const { data, error } = await ingresos_service.updateAsync(req.params.id, req.body.data);

        if (error) return res.status(500).json(error);

        res.status(200).json(data);
    }
}