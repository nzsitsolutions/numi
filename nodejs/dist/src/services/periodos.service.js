import supabase from "../config/supabase.js";
export default {
    getListAsync: () => {
        return supabase
            .from("periodos_mensuales")
            .select("*")
            .order("anio", { ascending: false })
            .order("mes", { ascending: false });
    },
    firstOrDefaultAsync: (anio, mes) => {
        return supabase
            .from("periodos_mensuales")
            .select("*")
            .eq("anio", anio)
            .eq("mes", mes);
    },
    insertAsync: (dto) => {
        return supabase
            .from("periodos_mensuales")
            .insert({
            anio: dto.anio,
            mes: dto.mes,
            tipo_cambio: dto.tipoCambio,
        })
            .select("*")
            .single();
    },
    updateTipoCambioAsync: (anio, mes, tipoCambio) => {
        return supabase
            .from("periodos_mensuales")
            .update({ tipo_cambio: tipoCambio })
            .eq("anio", anio)
            .eq("mes", mes)
            .select("*")
            .single();
    },
    calcularVOs: (periodo) => {
        return {
            id: periodo.id,
            anio: periodo.anio,
            mes: periodo.mes,
            tipoCambio: periodo.tipo_cambio,
        };
    },
};
