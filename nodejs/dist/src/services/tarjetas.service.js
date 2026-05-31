import supabase from "../config/supabase.js";
export default {
    getListAsync: () => {
        return supabase.from("tarjetas").select("*").order("fecha_cierre");
    },
    firstOrDefaultAsync: (id) => {
        return supabase.from("tarjetas").select("*").eq("id", id);
    },
    insertAsync: (dto) => {
        return supabase
            .from("tarjetas")
            .insert({
            limite_usd: dto.limiteUSD,
            fecha_cierre: dto.fechaCierre,
            fecha_vencimiento: dto.fechaVencimiento,
            gasto_id: dto.gastoId ?? null,
            es_no_tarjeta: dto.esNoTarjeta ?? false,
        })
            .select("*")
            .single();
    },
    updateAsync: (id, dto) => {
        return supabase
            .from("tarjetas")
            .update({
            ...(dto.limiteUSD !== undefined && { limite_usd: dto.limiteUSD }),
            ...(dto.fechaCierre !== undefined && { fecha_cierre: dto.fechaCierre }),
            ...(dto.fechaVencimiento !== undefined && { fecha_vencimiento: dto.fechaVencimiento }),
            ...(dto.gastoId !== undefined && { gasto_id: dto.gastoId }),
            ...(dto.esNoTarjeta !== undefined && { es_no_tarjeta: dto.esNoTarjeta }),
        })
            .eq("id", id)
            .select("*")
            .single();
    },
    deleteAsync: (id) => {
        return supabase.from("tarjetas").delete().eq("id", id);
    },
    calcularVOs: (tarjeta) => {
        return {
            id: tarjeta.id,
            limiteUSD: tarjeta.limite_usd,
            fechaCierre: tarjeta.fecha_cierre,
            fechaVencimiento: tarjeta.fecha_vencimiento,
            gastoId: tarjeta.gasto_id,
            esNoTarjeta: tarjeta.es_no_tarjeta,
        };
    },
};
