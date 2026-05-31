import supabase from "../../config/supabase.js";
import gastosService from "../gastos.service.js";
import driveService from "./drive.service.js";
import naranjaxParser from "./naranjax.parser.js";
import deduplicacionService from "./deduplicacion.service.js";
// Helper compartido: arma las filas e inserta movimientos como Pendiente
const insertMovimientos = (movimientos, archivoOrigen) => {
    const filas = movimientos.map((m) => ({
        origen: m.origen,
        fecha: m.fecha,
        descripcion: m.descripcion,
        monto_ars: m.montoARS,
        cuota_actual: m.cuotaActual,
        cuotas_total: m.cuotasTotal ?? null,
        estado_revision: "pendiente",
        archivo_origen: archivoOrigen ?? null,
    }));
    return supabase.from("movimientos_importados").insert(filas).select("*");
};
export default {
    getPendientesAsync: () => {
        return supabase
            .from("movimientos_importados")
            .select("*")
            .eq("estado_revision", "pendiente")
            .order("fecha", { ascending: false });
    },
    firstOrDefaultAsync: (id) => {
        return supabase.from("movimientos_importados").select("*").eq("id", id);
    },
    insertManyAsync: (movimientos, archivoOrigen) => {
        return insertMovimientos(movimientos, archivoOrigen);
    },
    // Procesa un PDF ya en memoria (upload directo): parse -> dedup -> insert
    procesarBufferAsync: async (buffer, archivoOrigen) => {
        const movimientos = await naranjaxParser.parsearBufferAsync(buffer);
        const { nuevos, duplicados } = await deduplicacionService.filtrarNuevos(movimientos);
        if (nuevos.length > 0) {
            const { error } = await insertMovimientos(nuevos, archivoOrigen);
            if (error)
                throw new Error(error.message);
        }
        return { totalEnArchivo: movimientos.length, nuevos: nuevos.length, duplicados, errores: 0 };
    },
    // Watcher manual de Drive: por cada PDF nuevo -> download -> parse -> dedup -> insert -> mover
    syncDriveNaranjaXAsync: async () => {
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        if (!folderId)
            throw new Error("Falta GOOGLE_DRIVE_FOLDER_ID");
        // Estructura: <carpeta principal>/pendientes (origen) y /procesados (destino)
        const pendientesId = await driveService.getSubfolderIdAsync(folderId, "pendientes");
        const procesadosId = await driveService.getSubfolderIdAsync(folderId, "procesados");
        const archivos = await driveService.listarPdfsAsync(pendientesId);
        const result = { totalEnArchivo: 0, nuevos: 0, duplicados: 0, errores: 0 };
        for (const archivo of archivos) {
            try {
                const buffer = await driveService.descargarAsync(archivo.id);
                const movimientos = await naranjaxParser.parsearBufferAsync(buffer);
                const { nuevos, duplicados } = await deduplicacionService.filtrarNuevos(movimientos);
                if (nuevos.length > 0) {
                    const { error } = await insertMovimientos(nuevos, archivo.name);
                    if (error)
                        throw new Error(error.message);
                }
                // Solo movemos el archivo si todo lo anterior salió bien
                await driveService.moverAsync(archivo.id, pendientesId, procesadosId);
                result.totalEnArchivo += movimientos.length;
                result.nuevos += nuevos.length;
                result.duplicados += duplicados;
            }
            catch (e) {
                result.errores++;
                console.error(`[importacion] error procesando ${archivo.name}:`, e.message);
            }
        }
        return result;
    },
    // Confirma un movimiento: crea el gasto real y marca el movimiento como Confirmado
    confirmarAsync: async (movimiento, dto) => {
        const { data: gasto, error: gastoError } = await gastosService.insertAsync({
            nombre: dto.nombre,
            tipo: dto.tipo,
            cuotasTotal: dto.cuotasTotal ?? movimiento.cuotas_total ?? undefined,
            cuotasPagadas: movimiento.cuota_actual ?? 0,
            montoARS: movimiento.monto_ars,
            tarjetaId: dto.tarjetaId,
            fechaInicio: movimiento.fecha,
        });
        if (gastoError)
            return { data: null, error: gastoError };
        const { error: movError } = await supabase
            .from("movimientos_importados")
            .update({ estado_revision: "confirmado", gasto_id: gasto.id })
            .eq("id", movimiento.id);
        if (movError)
            return { data: null, error: movError };
        return { data: gasto, error: null };
    },
    descartarAsync: (id) => {
        return supabase
            .from("movimientos_importados")
            .update({ estado_revision: "descartado" })
            .eq("id", id)
            .select("*")
            .single();
    },
};
