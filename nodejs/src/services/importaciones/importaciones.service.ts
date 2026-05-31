import supabase from "../../config/supabase.js";
import gastosService from "../gastos.service.js";
import driveService from "./drive.service.js";
import naranjaxParser from "./naranjax.parser.js";
import deduplicacionService, { MovimientoRaw } from "./deduplicacion.service.js";
import { ImportacionResultDto } from "../../types/api.types.js";

const insertMovimientos = (movimientos: MovimientoRaw[], archivoOrigen?: string) => {
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
    firstOrDefaultAsync: (id: string) => {
        return supabase.from("movimientos_importados").select("*").eq("id", id);
    },
    insertManyAsync: (movimientos: MovimientoRaw[], archivoOrigen?: string) => {
        return insertMovimientos(movimientos, archivoOrigen);
    },
    procesarBufferAsync: async (buffer: Buffer, archivoOrigen?: string): Promise<ImportacionResultDto> => {
        const movimientos = await naranjaxParser.parsearBufferAsync(buffer);
        const { nuevos, duplicados } = await deduplicacionService.filtrarNuevos(movimientos);

        if (nuevos.length > 0) {
            const { error } = await insertMovimientos(nuevos, archivoOrigen);
            if (error) throw new Error(error.message);
        }

        return { totalEnArchivo: movimientos.length, nuevos: nuevos.length, duplicados, errores: 0 };
    },
    syncDriveNaranjaXAsync: async (): Promise<ImportacionResultDto> => {
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        if (!folderId) throw new Error("Falta GOOGLE_DRIVE_FOLDER_ID");

        const pendientesId = await driveService.getSubfolderIdAsync(folderId, "pendientes");
        const procesadosId = await driveService.getSubfolderIdAsync(folderId, "procesados");
        const archivos = await driveService.listarPdfsAsync(pendientesId);

        const result: ImportacionResultDto = { totalEnArchivo: 0, nuevos: 0, duplicados: 0, errores: 0 };

        for (const archivo of archivos) {
            try {
                const buffer = await driveService.descargarAsync(archivo.id);
                const movimientos = await naranjaxParser.parsearBufferAsync(buffer);
                const { nuevos, duplicados } = await deduplicacionService.filtrarNuevos(movimientos);

                if (nuevos.length > 0) {
                    const { error } = await insertMovimientos(nuevos, archivo.name);
                    if (error) throw new Error(error.message);
                }

                await driveService.moverAsync(archivo.id, pendientesId, procesadosId);

                result.totalEnArchivo += movimientos.length;
                result.nuevos += nuevos.length;
                result.duplicados += duplicados;
            } catch (e) {
                result.errores++;
                console.error(`[importacion] error procesando ${archivo.name}:`, (e as Error).message);
            }
        }

        return result;
    },
    confirmarAsync: async (movimiento: any) => {
        const tipo: "fijo" | "cuotas" = movimiento.cuotas_total != null ? "cuotas" : "fijo";

        const { data: tarjeta, error: tarjetaError } = await supabase
            .from("tarjetas")
            .select("id")
            .eq("nombre", movimiento.origen)
            .maybeSingle();

        if (tarjetaError) return { data: null, error: { message: tarjetaError.message } };
        if (!tarjeta) {
            return { data: null, error: { message: `No existe una tarjeta con nombre '${movimiento.origen}'` } };
        }

        const { data: gasto, error: gastoError } = await gastosService.insertAsync({
            nombre: movimiento.descripcion,
            tipo,
            cuotasTotal: movimiento.cuotas_total ?? undefined,
            cuotasPagadas: movimiento.cuota_actual ?? 0,
            montoARS: movimiento.monto_ars,
            fechaInicio: movimiento.fecha,
        });

        if (gastoError) return { data: null, error: gastoError };

        await supabase.from("tarjetas").update({ gasto_id: gasto.id }).eq("id", tarjeta.id);

        const { error: movError } = await supabase
            .from("movimientos_importados")
            .update({ estado_revision: "confirmado", gasto_id: gasto.id })
            .eq("id", movimiento.id);

        if (movError) return { data: null, error: movError };

        return { data: gasto, error: null };
    },
    descartarAsync: (id: string) => {
        return supabase
            .from("movimientos_importados")
            .update({ estado_revision: "descartado" })
            .eq("id", id)
            .select("*")
            .single();
    },
};
