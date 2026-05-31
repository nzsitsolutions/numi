import { createRequire } from "module";
// pdf-parse v2 es CommonJS y expone la clase PDFParse
const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");
// "57.202,67" -> 57202.67 ; "-57.202,67" -> -57202.67
const parseMonto = (s) => Number(s.replace(/\./g, "").replace(",", "."));
// "10/05/26" -> "2026-05-10"
const parseFecha = (dd, mm, yy) => `20${yy}-${mm}-${dd}`;
// Extrae el texto plano de un PDF
const extraerTexto = async (buffer) => {
    const parser = new PDFParse({ data: buffer });
    try {
        const result = await parser.getText();
        return result.text;
    }
    finally {
        await parser.destroy?.();
    }
};
// Parsea la sección "Detalle de consumos" del resumen NaranjaX
const parsearTexto = (texto) => {
    const lineas = texto.split("\n").map((l) => l.trim()).filter(Boolean);
    // La tabla arranca en el header de columnas y termina en "Otros cargos" / "Total"
    const headerIdx = lineas.findIndex((l) => /FECHA/i.test(l) && /CUPON/i.test(l) && /DETALLE/i.test(l));
    if (headerIdx === -1)
        return [];
    const movimientos = [];
    let lastFecha = null;
    for (let i = headerIdx + 1; i < lineas.length; i++) {
        let linea = lineas[i];
        if (/^(Otros|Total)\b/i.test(linea))
            break;
        // Fecha al inicio (algunas líneas la heredan de la anterior, ej. nota de crédito)
        let fecha = lastFecha;
        const fm = linea.match(/^(\d{2})\/(\d{2})\/(\d{2})\b/);
        if (fm) {
            fecha = parseFecha(fm[1], fm[2], fm[3]);
            lastFecha = fecha;
            linea = linea.replace(/^(\d{2})\/(\d{2})\/(\d{2})\b/, "").trim();
        }
        // Toda línea de consumo termina con un monto; si no hay, es una etiqueta -> se saltea
        const amounts = linea.match(/-?\d{1,3}(?:\.\d{3})*,\d{2}/g);
        if (!amounts || amounts.length === 0)
            continue;
        // Columnas [$][U$S]: si hay 2 montos, el ARS es el penúltimo; si hay 1, es el único
        const montoStr = amounts.length >= 2 ? amounts[amounts.length - 2] : amounts[amounts.length - 1];
        const montoARS = parseMonto(montoStr);
        linea = linea.replace(/-?\d{1,3}(?:\.\d{3})*,\d{2}/g, "").trim();
        // Tarjeta + cupón al inicio (no se persisten)
        linea = linea.replace(/^(NX Virtual|Naranja X)\s+\d+\s*/i, "").trim();
        // Cuota/Plan: "05/06" -> actual 5, total 6 ; o un número suelto al final -> solo actual
        let cuotaActual = null;
        let cuotasTotal = null;
        const cm = linea.match(/\b(\d{1,2})\/(\d{1,2})\b/);
        if (cm) {
            cuotaActual = parseInt(cm[1], 10);
            cuotasTotal = parseInt(cm[2], 10);
            linea = linea.replace(/\b(\d{1,2})\/(\d{1,2})\b/, "").trim();
        }
        else {
            const lone = linea.match(/\s(\d{1,2})$/);
            if (lone) {
                cuotaActual = parseInt(lone[1], 10);
                linea = linea.replace(/\s\d{1,2}$/, "").trim();
            }
        }
        const descripcion = linea.replace(/\s+/g, " ").trim();
        if (!fecha || !descripcion)
            continue;
        movimientos.push({ fecha, descripcion, montoARS, cuotaActual, cuotasTotal, origen: "NaranjaX" });
    }
    return movimientos;
};
export default {
    parsearBufferAsync: async (buffer) => {
        const texto = await extraerTexto(buffer);
        return parsearTexto(texto);
    },
    parsearTexto,
    extraerTexto,
};
