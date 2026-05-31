import supabase from "../../config/supabase.js";
import gastosService from "../gastos.service.js";
import { MovimientoRaw } from "./deduplicacion.service.js";
import { ConfirmarMovimientoDto } from "../../types/api.types.js";

export default {
    getPendientesAsync: () => {
        return supabase
            .from("movimientos_importados")
            .select("*")
            .eq("estado_revision", "Pendiente")
            .order("fecha", { ascending: false });
    },

    firstOrDefaultAsync: (id: string) => {
        return supabase.from("movimientos_importados").select("*").eq("id", id);
    },

    insertManyAsync: (movimientos: MovimientoRaw[], archivoOrigen?: string) => {
        const filas = movimientos.map((m) => ({
            origen: m.origen,
            fecha: m.fecha,
            descripcion: m.descripcion,
            monto_ars: m.montoARS,
            cuota_actual: m.cuotaActual,
            cuotas_total: m.cuotasTotal ?? null,
            estado_revision: "Pendiente",
            archivo_origen: archivoOrigen ?? null,
        }));
        return supabase.from("movimientos_importados").insert(filas).select("*");
    },

    // Confirma un movimiento: crea el gasto real y marca el movimiento como Confirmado
    confirmarAsync: async (movimiento: any, dto: ConfirmarMovimientoDto) => {
        const { data: gasto, error: gastoError } = await gastosService.insertAsync({
            nombre: dto.nombre,
            tipo: dto.tipo,
            cuotasTotal: dto.cuotasTotal ?? movimiento.cuotas_total ?? undefined,
            cuotasPagadas: movimiento.cuota_actual ?? 0,
            montoARS: movimiento.monto_ars,
            tarjetaId: dto.tarjetaId,
            fechaInicio: movimiento.fecha,
        });

        if (gastoError) return { data: null, error: gastoError };

        const { error: movError } = await supabase
            .from("movimientos_importados")
            .update({ estado_revision: "Confirmado", gasto_id: gasto.id })
            .eq("id", movimiento.id);

        if (movError) return { data: null, error: movError };

        return { data: gasto, error: null };
    },

    descartarAsync: (id: string) => {
        return supabase
            .from("movimientos_importados")
            .update({ estado_revision: "Descartado" })
            .eq("id", id)
            .select("*")
            .single();
    },
};
