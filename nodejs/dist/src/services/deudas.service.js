import supabase from "../config/supabase.js";
export default {
    getListAsync: () => {
        return supabase
            .from("deudas_extra")
            .select("*")
            .eq("estado", "Activa")
            .order("descripcion");
    },
    firstOrDefaultAsync: (id) => {
        return supabase.from("deudas_extra").select("*").eq("id", id);
    },
    insertAsync: (dto) => {
        return supabase
            .from("deudas_extra")
            .insert({
            descripcion: dto.descripcion,
            monto: dto.monto,
            moneda: dto.moneda,
            estado: "activa",
        })
            .select("*")
            .single();
    },
    updateAsync: (id, dto) => {
        return supabase
            .from("deudas_extra")
            .update({
            ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
            ...(dto.monto !== undefined && { monto: dto.monto }),
            ...(dto.moneda !== undefined && { moneda: dto.moneda }),
            ...(dto.estado !== undefined && { estado: dto.estado }),
        })
            .eq("id", id)
            .select("*")
            .single();
    },
    deleteAsync: (id) => {
        return supabase.from("deudas_extra").update({ estado: "saldada" }).eq("id", id);
    },
    calcularVOs: (deuda) => {
        return {
            id: deuda.id,
            descripcion: deuda.descripcion,
            monto: deuda.monto,
            moneda: deuda.moneda,
            estado: deuda.estado,
        };
    },
};
