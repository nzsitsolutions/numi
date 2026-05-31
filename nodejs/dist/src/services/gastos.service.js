import supabase from "../config/supabase.js";
export default {
    getListAsync: () => {
        return supabase
            .from("gastos")
            .select("*")
            .eq("activo", true)
            .order("nombre");
    },
    firstOrDefaultAsync: (id) => {
        return supabase.from("gastos").select("*").eq("id", id);
    },
    insertAsync: (dto) => {
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
            activo: true,
        })
            .select("*")
            .single();
    },
    updateAsync: (id, dto) => {
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
        })
            .eq("id", id)
            .select("*")
            .single();
    },
    deleteAsync: (id) => {
        // Soft delete — nunca borramos datos financieros, solo los desactivamos
        return supabase.from("gastos").update({ activo: false }).eq("id", id);
    },
    pagarCuota: async (gasto) => {
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
    calcularVOs: (gasto) => {
        const esFijo = String(gasto.tipo).toLowerCase() === "fijo";
        const cuotasRestantes = esFijo
            ? 1
            : (gasto.cuotas_total ?? 0) - gasto.cuotas_pagadas;
        const montoTotalRestante = esFijo
            ? gasto.monto_ars
            : gasto.monto_ars * cuotasRestantes;
        const totalAPagar = esFijo
            ? gasto.monto_ars
            : gasto.monto_ars * (gasto.cuotas_total ?? 0);
        const avancePorcentaje = gasto.cuotas_total && gasto.cuotas_total > 0
            ? (gasto.cuotas_pagadas / gasto.cuotas_total) * 100
            : gasto.cuotas_pagadas > 0 ? 100 : 0;
        return {
            id: gasto.id,
            nombre: gasto.nombre,
            tipo: gasto.tipo,
            cuotasTotal: gasto.cuotas_total,
            cuotasPagadas: gasto.cuotas_pagadas,
            montoARS: gasto.monto_ars,
            montoUSD: gasto.monto_usd,
            tarjetaId: gasto.tarjeta_id,
            fechaInicio: gasto.fecha_inicio,
            activo: gasto.activo,
            cuotasRestantes,
            montoTotalRestante,
            totalAPagar,
            avancePorcentaje: Math.round(avancePorcentaje * 100) / 100,
        };
    },
};
