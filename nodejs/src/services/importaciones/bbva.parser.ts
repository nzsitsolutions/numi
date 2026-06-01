import { createRequire } from "module";
import { MovimientoRaw } from "./deduplicacion.service.js";

// BBVA Argentina exporta los "Últimos movimientos" del homebanking en Excel (.xlsx).
// Columnas: A=Fecha y hora, B=Movimientos, C=Cuota, D=Monto.
//   Fecha:  "16/05/26"  (dd/mm/yy)
//   Cuota:  "02/03" (actual/total) | "-" (sin cuotas -> fijo)
//   Monto:  "$ 94.635,67" (ARS) | "USD 0,00" (holds/autorizaciones, se descartan)
const require = createRequire(import.meta.url);
const xlsx = require("xlsx");

// "$ 94.635,67" -> 94635.67  ; "-$ 1.000,00" -> -1000
const parseMonto = (s: string): number =>
    Number(String(s).replace(/[^0-9,-]/g, "").replace(/\./g, "").replace(",", "."));

// "16/05/26" -> "2026-05-16"
const parseFecha = (s: string): string | null => {
    const m = String(s).match(/^(\d{2})\/(\d{2})\/(\d{2})/);
    return m ? `20${m[3]}-${m[2]}-${m[1]}` : null;
};

// Lee el xlsx a una matriz de celdas string
const extraerFilas = (buffer: Buffer): string[][] => {
    const wb = xlsx.read(buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    return xlsx.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" }) as string[][];
};

const parsearFilas = (filas: string[][]): MovimientoRaw[] => {
    const movimientos: MovimientoRaw[] = [];

    for (const fila of filas) {
        const [fechaRaw, descRaw, cuotaRaw, montoRaw] = fila;

        const fecha = parseFecha(fechaRaw ?? "");
        if (!fecha) continue; // saltea título, header y filas sin fecha válida

        // Solo gastos en pesos: las filas "USD ..." son holds/autorizaciones, no consumos ARS
        if (!String(montoRaw).trim().startsWith("$")) continue;

        const montoARS = parseMonto(montoRaw);
        if (!montoARS) continue; // descarta montos en 0

        // Cuota "NN/NN" -> actual/total ; "-" o vacío -> sin cuotas
        let cuotaActual: number | null = null;
        let cuotasTotal: number | null = null;
        const cm = String(cuotaRaw ?? "").match(/(\d{1,2})\/(\d{1,2})/);
        if (cm) {
            cuotaActual = parseInt(cm[1], 10);
            cuotasTotal = parseInt(cm[2], 10);
        }

        const descripcion = String(descRaw ?? "").replace(/\s+/g, " ").trim();
        if (!descripcion) continue;

        movimientos.push({ fecha, descripcion, montoARS, cuotaActual, cuotasTotal, origen: "BBVA" });
    }

    return movimientos;
};

export default {
    parsearBufferAsync: async (buffer: Buffer): Promise<MovimientoRaw[]> => {
        return parsearFilas(extraerFilas(buffer));
    },
    extraerFilas,
    parsearFilas,
};
