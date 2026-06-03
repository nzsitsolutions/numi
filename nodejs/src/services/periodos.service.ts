import { getSupabase } from "../config/supabase.js";
import { CreatePeriodoDto } from "../types/api.types.js";

export default {
    getListAsync: () => {
        return getSupabase()
            .from("periodos_mensuales")
            .select("*")
            .order("anio", { ascending: false })
            .order("mes", { ascending: false });
    },
    firstOrDefaultAsync: (anio: number, mes: number) => {
        return getSupabase()
            .from("periodos_mensuales")
            .select("*")
            .eq("anio", anio)
            .eq("mes", mes);
    },
    insertAsync: (dto: CreatePeriodoDto) => {
        return getSupabase()
            .from("periodos_mensuales")
            .insert({
                anio: dto.anio,
                mes: dto.mes,
                tipo_cambio: dto.tipoCambio,
            })
            .select("*")
            .single();
    },
    updateTipoCambioAsync: (anio: number, mes: number, tipoCambio: number) => {
        return getSupabase()
            .from("periodos_mensuales")
            .update({ tipo_cambio: tipoCambio })
            .eq("anio", anio)
            .eq("mes", mes)
            .select("*")
            .single();
    },
    // Cotización vigente: la del mes actual; si no hay, la del período más reciente; si no, 1
    getCotizacionActualAsync: async (): Promise<number> => {
        const hoy = new Date();
        const anio = hoy.getUTCFullYear();
        const mes = hoy.getUTCMonth() + 1;

        const actual = await getSupabase()
            .from("periodos_mensuales")
            .select("tipo_cambio")
            .eq("anio", anio)
            .eq("mes", mes)
            .maybeSingle();
        if (actual.data?.tipo_cambio) return actual.data.tipo_cambio;

        const ultimo = await getSupabase()
            .from("periodos_mensuales")
            .select("tipo_cambio")
            .order("anio", { ascending: false })
            .order("mes", { ascending: false })
            .limit(1)
            .maybeSingle();
        return ultimo.data?.tipo_cambio ?? 1;
    },
    calcularVOs: (periodo: any) => {
        return {
            id: periodo.id,
            anio: periodo.anio,
            mes: periodo.mes,
            tipoCambio: periodo.tipo_cambio,
        };
    },
};
