import supabase from "../config/supabase.js";
import { CreateDeudaDto, UpdateDeudaDto } from "../types/api.types.js";

export default {
    getListAsync: () => {
        return supabase
            .from("deudas_extra")
            .select("*")
            .eq("estado", "Activa")
            .order("descripcion");
    },
    firstOrDefaultAsync: (id: string) => {
        return supabase.from("deudas_extra").select("*").eq("id", id);
    },
    insertAsync: (dto: CreateDeudaDto) => {
        return supabase
            .from("deudas_extra")
            .insert({
                descripcion: dto.descripcion,
                monto: dto.monto,
                moneda: dto.moneda,
                estado: "Activa",
            })
            .select("*")
            .single();
    },
    updateAsync: (id: string, dto: UpdateDeudaDto) => {
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
    deleteAsync: (id: string) => {
        return supabase.from("deudas_extra").update({ estado: "Saldada" }).eq("id", id);
    },
    calcularVOs: (deuda: any) => {
        return {
            id: deuda.id,
            descripcion: deuda.descripcion,
            monto: deuda.monto,
            moneda: deuda.moneda,
            estado: deuda.estado,
        };
    },
};
