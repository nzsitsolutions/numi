import supabase from "../../config/supabase.js";
import gastosService from "../gastos.service.js";
import driveService from "./drive.service.js";
import naranjaxParser from "./naranjax.parser.js";
import bbvaParser from "./bbva.parser.js";
import deduplicacionService, { MovimientoRaw } from "./deduplicacion.service.js";
import { ImportacionResultDto } from "../../types/api.types.js";

type ParseFn = (buffer: Buffer) => Promise<MovimientoRaw[]>;

// Helper compartido: arma las filas e inserta movimientos como pendiente
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

// Pipeline genérico para un buffer ya en memoria (upload directo)
const procesarBuffer = async (
    parsear: ParseFn,
    buffer: Buffer,
    archivoOrigen?: string,
): Promise<ImportacionResultDto> => {
    const movimientos = await parsear(buffer);
    const { nuevos, duplicados } = await deduplicacionService.filtrarNuevos(movimientos);

    if (nuevos.length > 0) {
        const { error } = await insertMovimientos(nuevos, archivoOrigen);
        if (error) throw new Error(error.message);
    }

    return { totalEnArchivo: movimientos.length, nuevos: nuevos.length, duplicados, errores: 0 };
};

// Pipeline genérico para Drive: carpeta origen -> parsear -> dedup -> insertar -> mover a destino
const syncDrive = async (
    sourceFolder: string,
    destFolder: string,
    parsear: ParseFn,
    mimeType?: string,
): Promise<ImportacionResultDto> => {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) throw new Error("Falta GOOGLE_DRIVE_FOLDER_ID");

    const entradaId = await driveService.getSubfolderIdAsync(folderId, sourceFolder);
    const procesadosId = await driveService.getSubfolderIdAsync(folderId, destFolder);
    const archivos = await driveService.listarArchivosAsync(entradaId, mimeType);

    const result: ImportacionResultDto = { totalEnArchivo: 0, nuevos: 0, duplicados: 0, errores: 0 };

    for (const archivo of archivos) {
        try {
            const buffer = await driveService.descargarAsync(archivo.id);
            const movimientos = await parsear(buffer);
            const { nuevos, duplicados } = await deduplicacionService.filtrarNuevos(movimientos);

            if (nuevos.length > 0) {
                const { error } = await insertMovimientos(nuevos, archivo.name);
                if (error) throw new Error(error.message);
            }

            // Solo movemos el archivo si todo lo anterior salió bien
            await driveService.moverAsync(archivo.id, entradaId, procesadosId);

            result.totalEnArchivo += movimientos.length;
            result.nuevos += nuevos.length;
            result.duplicados += duplicados;
        } catch (e) {
            result.errores++;
            console.error(`[importacion] error procesando ${archivo.name}:`, (e as Error).message);
        }
    }

    return result;
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

    // ── NaranjaX (PDF) ──
    procesarBufferAsync: (buffer: Buffer, archivoOrigen?: string) =>
        procesarBuffer(naranjaxParser.parsearBufferAsync, buffer, archivoOrigen),
    syncDriveNaranjaXAsync: () =>
        syncDrive("pendientes", "procesados", naranjaxParser.parsearBufferAsync, "application/pdf"),

    // ── BBVA (CSV) ──
    procesarBufferBbvaAsync: (buffer: Buffer, archivoOrigen?: string) =>
        procesarBuffer(bbvaParser.parsearBufferAsync, buffer, archivoOrigen),
    syncDriveBbvaAsync: () =>
        syncDrive("bbva-entrada", "bbva-procesados", bbvaParser.parsearBufferAsync),

    // Confirma un movimiento: deriva todo del propio movimiento y crea el gasto real
    confirmarAsync: async (movimiento: any) => {
        // tipo: si trae cuotas_total es "cuotas", si no "fijo"
        const tipo: "fijo" | "cuotas" = movimiento.cuotas_total != null ? "cuotas" : "fijo";

        // tarjeta: se busca por nombre == origen del movimiento (ej. "NaranjaX").
        // Si no existe, se corta con error y NO se crea el gasto.
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

        // La relación vive en tarjetas.gasto_id -> vinculamos la tarjeta hallada a este gasto
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
