import { MovimientoRaw } from "./deduplicacion.service.js";
import { PDFParse } from "pdf-parse";

const parseMonto = (s: string): number => Number(s.replace(/\./g, "").replace(",", "."));

const parseFecha = (dd: string, mm: string, yy: string): string => `20${yy}-${mm}-${dd}`;

const extraerTexto = async (buffer: Buffer): Promise<string> => {
    const parser = new PDFParse({ data: buffer });
    try {
        const result = await parser.getText();
        return result.text as string;
    } finally {
        await parser.destroy?.();
    }
};

const parsearTexto = (texto: string): MovimientoRaw[] => {
    const lineas = texto.split("\n").map((l) => l.trim()).filter(Boolean);

    const headerIdx = lineas.findIndex(
        (l) => /FECHA/i.test(l) && /CUPON/i.test(l) && /DETALLE/i.test(l),
    );
    if (headerIdx === -1) return [];

    const movimientos: MovimientoRaw[] = [];
    let lastFecha: string | null = null;

    for (let i = headerIdx + 1; i < lineas.length; i++) {
        let linea = lineas[i];
        if (/^(Otros|Total)\b/i.test(linea)) break;

        let fecha: string | null = lastFecha;
        const fm = linea.match(/^(\d{2})\/(\d{2})\/(\d{2})\b/);
        if (fm) {
            fecha = parseFecha(fm[1], fm[2], fm[3]);
            lastFecha = fecha;
            linea = linea.replace(/^(\d{2})\/(\d{2})\/(\d{2})\b/, "").trim();
        }

        const amounts = linea.match(/-?\d{1,3}(?:\.\d{3})*,\d{2}/g);
        if (!amounts || amounts.length === 0) continue;

        const montoStr = amounts.length >= 2 ? amounts[amounts.length - 2] : amounts[amounts.length - 1];
        const montoARS = parseMonto(montoStr);
        linea = linea.replace(/-?\d{1,3}(?:\.\d{3})*,\d{2}/g, "").trim();

        linea = linea.replace(/^(NX Virtual|Naranja X)\s+\d+\s*/i, "").trim();

        let cuotaActual: number | null = null;
        let cuotasTotal: number | null = null;
        const cm = linea.match(/\b(\d{1,2})\/(\d{1,2})\b/);
        if (cm) {
            cuotaActual = parseInt(cm[1], 10);
            cuotasTotal = parseInt(cm[2], 10);
            linea = linea.replace(/\b(\d{1,2})\/(\d{1,2})\b/, "").trim();
        } else {
            const lone = linea.match(/\s(\d{1,2})$/);
            if (lone) {
                cuotaActual = parseInt(lone[1], 10);
                linea = linea.replace(/\s\d{1,2}$/, "").trim();
            }
        }

        const descripcion = linea.replace(/\s+/g, " ").trim();
        if (!fecha || !descripcion) continue;

        movimientos.push({ fecha, descripcion, montoARS, cuotaActual, cuotasTotal, origen: "NaranjaX" });
    }

    return movimientos;
};

export default {
    parsearBufferAsync: async (buffer: Buffer): Promise<MovimientoRaw[]> => {
        const texto = await extraerTexto(buffer);
        return parsearTexto(texto);
    },
    parsearTexto,
    extraerTexto,
};
