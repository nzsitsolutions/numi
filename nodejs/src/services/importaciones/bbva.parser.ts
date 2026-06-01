import { MovimientoRaw } from "./deduplicacion.service.js";

// BBVA Argentina exporta los movimientos desde el homebanking en CSV (más limpio que el PDF de NaranjaX).
// Columnas típicas: fecha, descripción, débito, crédito, saldo.
// El formato/separador/encoding exacto se confirma con una muestra real en
// nodejs/samples/bbva-sample.csv y recién ahí se completa parsearFilas().

// Divide el CSV en filas de celdas (separador ; o ,). Simple a propósito;
// se ajustará cuando veamos el archivo real (comillas, decimales, encoding).
const extraerFilas = (csv: string): string[][] => {
    return csv
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => l.split(/[;,]/).map((c) => c.trim()));
};

// Mapea las filas de BBVA a movimientos. origen siempre "BBVA".
// TODO: implementar con la muestra real (qué columnas, si se toman solo débitos
// como gastos, formato de fecha/monto, fila de header a saltear, etc.).
const parsearFilas = (_filas: string[][]): MovimientoRaw[] => {
    throw new Error("Parser BBVA pendiente: falta la muestra del CSV (nodejs/samples/bbva-sample.csv) para mapear las columnas reales");
};

export default {
    parsearBufferAsync: async (buffer: Buffer): Promise<MovimientoRaw[]> => {
        const csv = buffer.toString("utf-8");
        return parsearFilas(extraerFilas(csv));
    },
    extraerFilas,
    parsearFilas,
};
