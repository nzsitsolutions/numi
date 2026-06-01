import supabase from "../config/supabase.js";
import { CreateGastoDto, UpdateGastoDto } from "../types/api.types.js";
import { GastoConCalculo, GrupoTarjeta } from "../types/database.types.js";

const r2 = (n: number) => Math.round(n * 100) / 100;

// Calcula los VOs de un gasto en ARS (con la parte USD convertida por tipoCambio).
const calcularVOs = (gasto: any, tipoCambio: number = 1): GastoConCalculo => {
    const esFijo = String(gasto.tipo).toLowerCase() === "fijo";
    const cuotasTotal = gasto.cuotas_total ?? 0;
    const cuotasPagadas = gasto.cuotas_pagadas ?? 0;

    // Monto unitario (una cuota / mes) en ARS, con la parte USD ya convertida
    const montoUnitARS = (gasto.monto_ars ?? 0) + (gasto.monto_usd ?? 0) * tipoCambio;

    const cuotasRestantes = esFijo ? 1 : cuotasTotal - cuotasPagadas;

    const totalAPagar = esFijo ? montoUnitARS : montoUnitARS * cuotasTotal;
    const montoPagado = esFijo ? 0 : montoUnitARS * cuotasPagadas;
    const montoTotalRestante = esFijo ? montoUnitARS : montoUnitARS * Math.max(cuotasRestantes, 0);

    // Lo que efectivamente paga este mes (0 si ya terminó de pagar las cuotas)
    const montoMensualARS = esFijo ? montoUnitARS : cuotasRestantes > 0 ? montoUnitARS : 0;

    const avancePorcentaje = cuotasTotal > 0
        ? (cuotasPagadas / cuotasTotal) * 100
        : cuotasPagadas > 0 ? 100 : 0;

    return {
        id: gasto.id,
        nombre: gasto.nombre,
        tipo: gasto.tipo,
        cuotasTotal: gasto.cuotas_total,
        cuotasPagadas,
        montoARS: gasto.monto_ars,
        montoUSD: gasto.monto_usd,
        tarjetaId: gasto.tarjeta_id,
        fechaInicio: gasto.fecha_inicio,
        activo: gasto.activo,
        cuotasRestantes,
        montoMensualARS: r2(montoMensualARS),
        montoPagado: r2(montoPagado),
        montoTotalRestante: r2(montoTotalRestante),
        totalAPagar: r2(totalAPagar),
        avancePorcentaje: r2(avancePorcentaje),
    };
};

export default {
    getListAsync: () => {
        return supabase
            .from("gastos")
            .select("*")
            .eq("activo", true)
            .order("nombre");
    },
    firstOrDefaultAsync: (id: string) => {
        return supabase.from("gastos").select("*").eq("id", id);
    },
    // Trae gastos activos + tarjetas, para agrupar por origen/tarjeta
    getAgrupadoSourceAsync: async () => {
        const [gastos, tarjetas] = await Promise.all([
            supabase.from("gastos").select("*").eq("activo", true).order("nombre"),
            supabase.from("tarjetas").select("id, nombre"),
        ]);
        return { gastos, tarjetas };
    },
    // Arma los grupos (una entrada por tarjeta + una "Sin tarjeta")
    agrupar: (gastos: any[], tarjetas: any[], tipoCambio: number): GrupoTarjeta[] => {
        const nombrePorId = new Map<string, string>(tarjetas.map((t) => [t.id, t.nombre]));

        const grupos = new Map<string, GrupoTarjeta>();
        const keyFor = (id: string | null) => id ?? "__sin__";

        for (const g of gastos) {
            const vo = calcularVOs(g, tipoCambio);
            const k = keyFor(vo.tarjetaId);
            if (!grupos.has(k)) {
                grupos.set(k, {
                    tarjetaId: vo.tarjetaId,
                    tarjetaNombre: vo.tarjetaId ? (nombrePorId.get(vo.tarjetaId) ?? "Tarjeta") : "Sin tarjeta",
                    gastos: [],
                    totalMensualARS: 0,
                    cierreARS: 0,
                });
            }
            const grupo = grupos.get(k)!;
            grupo.gastos.push(vo);
            grupo.totalMensualARS += vo.montoMensualARS;
            grupo.cierreARS += vo.montoTotalRestante;
        }

        return [...grupos.values()].map((grp) => ({
            ...grp,
            totalMensualARS: r2(grp.totalMensualARS),
            cierreARS: r2(grp.cierreARS),
        }));
    },
    insertAsync: (dto: CreateGastoDto) => {
        return supabase
            .from("gastos")
            .insert({
                nombre: dto.nombre,
                tipo: dto.tipo,
                cuotas_total: dto.cuotasTotal ?? null,
                cuotas_pagadas: dto.cuotasPagadas ?? 0,
                monto_ars: dto.montoARS,
                monto_usd: dto.montoUSD ?? 0,
                fecha_inicio: dto.fechaInicio,
                tarjeta_id: dto.tarjetaId ?? null,
                activo: true,
            })
            .select("*")
            .single();
    },
    updateAsync: (id: string, dto: UpdateGastoDto) => {
        return supabase
            .from("gastos")
            .update({
                ...(dto.nombre !== undefined && { nombre: dto.nombre }),
                ...(dto.tipo !== undefined && { tipo: dto.tipo }),
                ...(dto.cuotasTotal !== undefined && { cuotas_total: dto.cuotasTotal }),
                ...(dto.cuotasPagadas !== undefined && { cuotas_pagadas: dto.cuotasPagadas }),
                ...(dto.montoARS !== undefined && { monto_ars: dto.montoARS }),
                ...(dto.montoUSD !== undefined && { monto_usd: dto.montoUSD }),
                ...(dto.fechaInicio !== undefined && { fecha_inicio: dto.fechaInicio }),
                ...(dto.tarjetaId !== undefined && { tarjeta_id: dto.tarjetaId }),
            })
            .eq("id", id)
            .select("*")
            .single();
    },
    deleteAsync: (id: string) => {
        // Soft delete — nunca borramos datos financieros, solo los desactivamos
        return supabase.from("gastos").update({ activo: false }).eq("id", id);
    },
    pagarCuota: async (gasto: any) => {
        if (String(gasto.tipo).toLowerCase() === "fijo") {
            return { data: null, error: { message: "los gastos fijos no tienen cuotas" } };
        }

        if (gasto.cuotas_pagadas >= (gasto.cuotas_total ?? 0)) {
            return {
                data: null,
                error: { message: "no existen cuotas pendientes por pagar" },
            };
        }

        return supabase
            .from("gastos")
            .update({ cuotas_pagadas: gasto.cuotas_pagadas + 1 })
            .eq("id", gasto.id)
            .select()
            .single();
    },
    // tipoCambio: cotización del USD para convertir la parte en dólares a ARS
    calcularVOs: (gasto: any, tipoCambio: number = 1): GastoConCalculo => calcularVOs(gasto, tipoCambio),
};
