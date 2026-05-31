import supabase from "../config/supabase.js";

export default {
    getListAsync: () => {
        return supabase.from("gastos").select("*");
    },
    firstOrDefaultAsync: (id: string) => {
        return supabase.from("gastos").select("*").eq("id", id);
    },
    insertAsync: (data: any) => {
        return supabase.from("gastos").insert(data).select("*");
    },
    deleteAsync: (id: string) => {
        return supabase.from("gastos").delete().eq("id", id);
    },
    updateAsync: (id: string, data: any) => {
        return supabase.from("gastos").update(data).eq("id", id);
    },
    pagarCuota: async (gasto: any) => {
        if (gasto.tipo.toLowerCase() === "fijo") return { data: null, error: { message: "los gastos fijos no tienen cuotas" } };

        if (gasto.cuotasPagadas >= (gasto.cuotasTotal ?? 0)) {
            return {
                data: null,
                error: { message: "no existen cuotas pendientes por pagar" }
            };
        }

        return supabase
            .from('gastos')
            .update({ cuotas_pagadas: gasto.cuotasPagadas + 1 })
            .eq('id', gasto.id)
            .select()
            .single()
    },
    calcularVOs: (gasto: any) => {
        const esFijo = gasto.tipo.toLowerCase() === 'fijo'

        const cuotasRestantes = esFijo
            ? 1
            : (gasto.cuotas_total ?? 0) - gasto.cuotas_pagadas

        const montoTotalRestante = esFijo
            ? gasto.monto_ars
            : gasto.monto_ars * cuotasRestantes

        const totalAPagar = esFijo
            ? gasto.monto_ars
            : gasto.monto_ars * (gasto.cuotas_total ?? 0)

        const avancePorcentaje = gasto.cuotas_total && gasto.cuotas_total > 0
            ? (gasto.cuotas_pagadas / gasto.cuotas_total) * 100
            : gasto.cuotas_pagadas > 0 ? 100 : 0

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
        }
    }
}