import { getSupabase } from "../config/supabase.js";
import { CreateDeudaDto, UpdateDeudaDto } from "../types/api.types.js";

const calcularVOs = (deuda: any) => {
    const tieneCuotas = deuda.cuotas_total != null && deuda.cuotas_total > 0;
    const cuotasTotal: number = deuda.cuotas_total ?? 0;
    const cuotasPagadas: number = deuda.cuotas_pagadas ?? 0;
    const cuotasRestantes = tieneCuotas ? Math.max(cuotasTotal - cuotasPagadas, 0) : null;
    const avancePorcentaje = tieneCuotas && cuotasTotal > 0
        ? Math.round((cuotasPagadas / cuotasTotal) * 100)
        : null;

    // Auto-saldar si terminó de pagar todas las cuotas
    const estadoFinal = tieneCuotas && cuotasRestantes === 0 ? "saldada" : deuda.estado;

    return {
        id: deuda.id,
        descripcion: deuda.descripcion,
        monto: deuda.monto,
        moneda: deuda.moneda,
        estado: estadoFinal,
        notas: deuda.notas ?? null,
        cuotasTotal: tieneCuotas ? cuotasTotal : null,
        cuotasPagadas: tieneCuotas ? cuotasPagadas : null,
        cuotasRestantes,
        avancePorcentaje,
    };
};

export default {
    getListAsync: () => {
        return getSupabase()
            .from("deudas_extra")
            .select("*")
            .eq("estado", "activa")
            .order("descripcion");
    },
    firstOrDefaultAsync: (id: string) => {
        return getSupabase().from("deudas_extra").select("*").eq("id", id);
    },
    insertAsync: (dto: CreateDeudaDto) => {
        return getSupabase()
            .from("deudas_extra")
            .insert({
                descripcion: dto.descripcion,
                monto: dto.monto,
                moneda: dto.moneda,
                estado: "activa",
                ...(dto.cuotasTotal != null && { cuotas_total: dto.cuotasTotal }),
                ...(dto.notas && { notas: dto.notas }),
            })
            .select("*")
            .single();
    },
    updateAsync: (id: string, dto: UpdateDeudaDto) => {
        return getSupabase()
            .from("deudas_extra")
            .update({
                ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
                ...(dto.monto !== undefined && { monto: dto.monto }),
                ...(dto.moneda !== undefined && { moneda: dto.moneda }),
                ...(dto.estado !== undefined && { estado: dto.estado }),
                ...(dto.cuotasTotal !== undefined && { cuotas_total: dto.cuotasTotal }),
                ...(dto.cuotasPagadas !== undefined && { cuotas_pagadas: dto.cuotasPagadas }),
                ...(dto.notas !== undefined && { notas: dto.notas }),
            })
            .eq("id", id)
            .select("*")
            .single();
    },
    pagarCuotaAsync: async (id: string) => {
        // Fetch current state, increment cuotas_pagadas by 1
        const { data: current, error: fetchErr } = await getSupabase()
            .from("deudas_extra")
            .select("cuotas_pagadas, cuotas_total")
            .eq("id", id)
            .single();
        if (fetchErr || !current) return { data: null, error: fetchErr };

        const nuevasPagadas = (current.cuotas_pagadas ?? 0) + 1;
        const saldada = current.cuotas_total != null && nuevasPagadas >= current.cuotas_total;

        return getSupabase()
            .from("deudas_extra")
            .update({
                cuotas_pagadas: nuevasPagadas,
                ...(saldada && { estado: "saldada" }),
            })
            .eq("id", id)
            .select("*")
            .single();
    },
    deleteAsync: (id: string) => {
        return getSupabase().from("deudas_extra").update({ estado: "saldada" }).eq("id", id);
    },
    calcularVOs,
};
