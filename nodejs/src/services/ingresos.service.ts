import { getSupabase } from "../config/supabase.js";
import { CreateIngresoDto, UpdateIngresoDto } from "../types/api.types.js";
import { IngresoDto } from "../types/ingreso-dto.js";

export default {
    getListAsync: (periodo?: string) => {
        const query = getSupabase().from("ingresos").select("*").order("periodo", { ascending: false });
        return periodo ? query.eq("periodo", periodo) : query;
    },
    firstOrDefaultAsync: (id: string) => {
        return getSupabase().from("ingresos").select("*").eq("id", id);
    },
    insertAsync: (dto: CreateIngresoDto) => {
        return getSupabase()
            .from("ingresos")
            .insert({
                descripcion: dto.descripcion,
                monto_ars: dto.montoARS,
                monto_usd: dto.montoUSD ?? 0,
                moneda: dto.moneda,
                periodo: dto.periodo,
                tipo_cambio: dto.tipoCambio ?? null,
            })
            .select("*")
            .single();
    },
    updateAsync: (id: string, dto: UpdateIngresoDto) => {
        return getSupabase()
            .from("ingresos")
            .update({
                ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
                ...(dto.montoARS !== undefined && { monto_ars: dto.montoARS }),
                ...(dto.montoUSD !== undefined && { monto_usd: dto.montoUSD }),
                ...(dto.moneda !== undefined && { moneda: dto.moneda }),
                ...(dto.periodo !== undefined && { periodo: dto.periodo }),
                ...(dto.tipoCambio !== undefined && { tipo_cambio: dto.tipoCambio }),
            })
            .eq("id", id)
            .select("*")
            .single();
    },
    deleteAsync: (id: string) => {
        return getSupabase().from("ingresos").delete().eq("id", id);
    },
    calcularVOs: (ingreso: any): IngresoDto => {
        return {
            id: ingreso.id,
            descripcion: ingreso.descripcion,
            montoARS: ingreso.monto_ars,
            montoUSD: ingreso.monto_usd,
            moneda: ingreso.moneda,
            periodo: ingreso.periodo,
            tipoCambio: ingreso.tipo_cambio,
        };
    },
};
