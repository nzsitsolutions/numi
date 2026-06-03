import { getSupabase } from "../../config/supabase.js";

export interface MovimientoRaw {
    fecha: string;     
    descripcion: string;
    montoARS: number;
    cuotaActual: number | null;
    cuotasTotal?: number | null;
    origen: string;
}

const claveDe = (fecha: any, descripcion: string, montoARS: number): string => {
    const f = String(fecha).slice(0, 10);
    const d = (descripcion ?? "").trim().toUpperCase().replace(/\s+/g, " ");
    return `${f}|${d}|${Number(montoARS).toFixed(2)}`;
};

export default {
    filtrarNuevos: async (
        movimientos: MovimientoRaw[],
    ): Promise<{ nuevos: MovimientoRaw[]; duplicados: number }> => {
        const { data } = await getSupabase()
            .from("movimientos_importados")
            .select("fecha, descripcion, monto_ars");

        const existentes = new Set(
            (data ?? []).map((r: any) => claveDe(r.fecha, r.descripcion, r.monto_ars)),
        );

        const nuevos = movimientos.filter(
            (m) => !existentes.has(claveDe(m.fecha, m.descripcion, m.montoARS)),
        );
        const duplicados = movimientos.length - nuevos.length;

        return { nuevos, duplicados };
    },
};
