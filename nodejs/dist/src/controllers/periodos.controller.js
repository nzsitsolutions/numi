import periodosService from "../services/periodos.service.js";
import resumenService from "../services/resumen.service.js";
import { single, list } from "../utils/response.js";
export default {
    getList: async (req, res) => {
        const { data, error } = await periodosService.getListAsync();
        if (error)
            return res.status(500).json(error);
        res.status(200).json(list((data ?? []).map((p) => periodosService.calcularVOs(p))));
    },
    getOne: async (req, res) => {
        const { data, error } = await periodosService.firstOrDefaultAsync(Number(req.params.anio), Number(req.params.mes));
        if (error)
            return res.status(500).json(error);
        if (!data || data.length === 0)
            return res.status(404).json({ message: "periodo no encontrado" });
        res.status(200).json(single(periodosService.calcularVOs(data[0])));
    },
    getResumen: async (req, res) => {
        const { data, error } = await resumenService.getResumenMensualAsync(Number(req.params.anio), Number(req.params.mes));
        if (error)
            return res.status(500).json(error);
        res.status(200).json(single(data));
    },
    create: async (req, res) => {
        const { data, error } = await periodosService.insertAsync(req.body);
        if (error)
            return res.status(500).json(error);
        res.status(201).json(single(periodosService.calcularVOs(data)));
    },
    updateTipoCambio: async (req, res) => {
        const { data, error } = await periodosService.updateTipoCambioAsync(Number(req.params.anio), Number(req.params.mes), req.body.tipoCambio);
        if (error)
            return res.status(500).json(error);
        res.status(200).json(single(periodosService.calcularVOs(data)));
    },
};
