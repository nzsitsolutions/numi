import gastosService from "../services/gastos.service.js";
import periodosService from "../services/periodos.service.js";
import { single, list } from "../utils/response.js";

export default {
    getList: async (req: any, res: any) => {
        const { data, error } = await gastosService.getListAsync();

        if (error) return res.status(500).json(error);

        const tipoCambio = await periodosService.getCotizacionActualAsync();
        res.status(200).json(list((data ?? []).map((g: any) => gastosService.calcularVOs(g, tipoCambio))));
    },
    // Gastos agrupados por tarjeta / "Sin tarjeta", con total mensual y cierre por grupo
    getAgrupado: async (_req: any, res: any) => {
        const { gastos, tarjetas } = await gastosService.getAgrupadoSourceAsync();

        if (gastos.error) return res.status(500).json(gastos.error);
        if (tarjetas.error) return res.status(500).json(tarjetas.error);

        const tipoCambio = await periodosService.getCotizacionActualAsync();
        const grupos = gastosService.agrupar(gastos.data ?? [], tarjetas.data ?? [], tipoCambio);
        res.status(200).json(single({ grupos, valorUSD: tipoCambio }));
    },
    getById: async (req: any, res: any) => {
        const { data, error } = await gastosService.firstOrDefaultAsync(req.params.id);

        if (error) return res.status(500).json(error);
        if (!data || data.length === 0) return res.status(404).json({ message: "gasto no encontrado" });

        const tipoCambio = await periodosService.getCotizacionActualAsync();
        res.status(200).json(single(gastosService.calcularVOs(data[0], tipoCambio)));
    },
    create: async (req: any, res: any) => {
        const { data, error } = await gastosService.insertAsync(req.body);

        if (error) return res.status(500).json(error);

        const tipoCambio = await periodosService.getCotizacionActualAsync();
        res.status(201).json(single(gastosService.calcularVOs(data, tipoCambio)));
    },
    delete: async (req: any, res: any) => {
        const { error } = await gastosService.deleteAsync(req.params.id);

        if (error) return res.status(500).json(error);

        res.status(204).send();
    },
    update: async (req: any, res: any) => {
        const { data, error } = await gastosService.updateAsync(req.params.id, req.body);

        if (error) return res.status(500).json(error);

        const tipoCambio = await periodosService.getCotizacionActualAsync();
        res.status(200).json(single(gastosService.calcularVOs(data, tipoCambio)));
    },
    pagarCuota: async (req: any, res: any) => {
        const { data, error } = await gastosService.firstOrDefaultAsync(req.params.id);

        if (error) return res.status(500).json(error);
        if (!data || data.length === 0) return res.status(404).json({ message: "gasto no encontrado" });

        const { data: updated, error: paymentError } = await gastosService.pagarCuota(data[0]);

        if (paymentError) return res.status(400).json(paymentError);

        const tipoCambio = await periodosService.getCotizacionActualAsync();
        res.status(200).json(single(gastosService.calcularVOs(updated, tipoCambio)));
    },
};
