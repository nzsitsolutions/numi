import supabase from "../../config/supabase.js";
// Clave de comparación: fecha (solo día) + descripción normalizada + monto
const claveDe = (fecha, descripcion, montoARS) => {
    const f = String(fecha).slice(0, 10);
    const d = (descripcion ?? "").trim().toUpperCase().replace(/\s+/g, " ");
    return `${f}|${d}|${Number(montoARS).toFixed(2)}`;
};
export default {
    // Opción B: deduplica en memoria comparando contra lo ya importado, sin guardar hash
    filtrarNuevos: async (movimientos) => {
        const { data } = await supabase
            .from("movimientos_importados")
            .select("fecha, descripcion, monto_ars");
        const existentes = new Set((data ?? []).map((r) => claveDe(r.fecha, r.descripcion, r.monto_ars)));
        const nuevos = movimientos.filter((m) => !existentes.has(claveDe(m.fecha, m.descripcion, m.montoARS)));
        const duplicados = movimientos.length - nuevos.length;
        return { nuevos, duplicados };
    },
};
