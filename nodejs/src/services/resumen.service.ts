import supabase from "../config/supabase.js";
import { ResumenMensual } from "../types/database.types.js";

export default {
    getResumenMensualAsync: async (
        anio: number,
        mes: number,
    ): Promise<{ data: ResumenMensual | null; error: { message: string } | null }> => {
        // periodo es timestamptz → filtramos por rango [inicio de mes, inicio del mes siguiente)
        const desde = new Date(Date.UTC(anio, mes - 1, 1)).toISOString();
        const hasta = new Date(Date.UTC(anio, mes, 1)).toISOString();

        // Carga en paralelo todo lo que necesita el resumen
        const [gastos, ingresos, tarjetas, periodoMensual, deudas] = await Promise.all([
            supabase.from("gastos").select("*").eq("activo", true),
            supabase.from("ingresos").select("*").gte("periodo", desde).lt("periodo", hasta),
            supabase.from("tarjetas").select("*"),
            supabase.from("periodos_mensuales").select("*").eq("anio", anio).eq("mes", mes).maybeSingle(),
            supabase.from("deudas_extra").select("*").eq("estado", "activa"),
        ]);

        const primerError = gastos.error || ingresos.error || tarjetas.error || deudas.error;
        if (primerError) return { data: null, error: { message: primerError.message } };

        const tipoCambio = periodoMensual.data?.tipo_cambio ?? 1;

        const gastosData = gastos.data ?? [];
        const ingresosData = ingresos.data ?? [];
        const tarjetasData = tarjetas.data ?? [];
        const deudasData = deudas.data ?? [];

        // La relación es gastos.tarjeta_id → sin tarjeta = tarjeta_id NULL
        const tieneTarjeta = (g: any): boolean => g.tarjeta_id != null;

        // Cuota mensual de cada gasto — lo que efectivamente paga este mes
        const cuotaMensual = (g: any): number => {
            if (String(g.tipo).toLowerCase() === "fijo") return g.monto_ars + g.monto_usd * tipoCambio;
            const restantes = (g.cuotas_total ?? 0) - g.cuotas_pagadas;
            if (restantes <= 0) return 0;
            return g.monto_ars;
        };

        const gastosConTarjeta = gastosData.filter((g) => tieneTarjeta(g));
        const gastosSinTarjeta = gastosData.filter((g) => !tieneTarjeta(g));

        const tarjetasMensualARS = gastosConTarjeta.reduce((s, g) => s + cuotaMensual(g), 0);
        const noTarjetasMensualARS = gastosSinTarjeta.reduce((s, g) => s + cuotaMensual(g), 0);

        // Gastos puramente en USD (monto_usd > 0 y monto_ars = 0)
        const totalMensualUSD = gastosData
            .filter((g) => g.monto_usd > 0 && g.monto_ars === 0)
            .reduce((s, g) => s + g.monto_usd, 0);

        const totalMensualARS = gastosData
            .filter((g) => g.monto_ars > 0)
            .reduce((s, g) => s + cuotaMensual(g), 0);

        const totalIngresosARS = ingresosData.reduce((s, i) => s + i.monto_ars, 0);
        const totalIngresosUSD = ingresosData.reduce((s, i) => s + (i.monto_usd ?? 0), 0);

        const resumen: ResumenMensual = {
            valorUSD: tipoCambio,
            totalMensualARS,
            totalMensualUSD,
            totalMesARS: totalMensualARS + totalMensualUSD * tipoCambio,
            sinDeudasARS: noTarjetasMensualARS,
            cierreTotalARS: tarjetasMensualARS + noTarjetasMensualARS,
            tarjetasMensualARS,
            noTarjetasMensualARS,
            totalIngresosARS,
            totalIngresosUSD,
            tarjetas: tarjetasData.map((t) => {
                // usadoUSD: suma de todos los gastos de esta tarjeta (USD directo o ARS convertido)
                const usadoUSD = gastosData
                    .filter((g) => g.tarjeta_id === t.id)
                    .reduce((s, g) => s + (g.monto_usd > 0 ? g.monto_usd : g.monto_ars / tipoCambio), 0);
                return {
                    id: t.id,
                    nombre: t.nombre,
                    limiteUSD: t.limite_usd,
                    usadoUSD,
                    fechaCierre: t.fecha_cierre,
                };
            }),
            deudasExtras: deudasData.map((d) => ({
                descripcion: d.descripcion,
                monto: d.monto,
                moneda: d.moneda,
            })),
        };

        return { data: resumen, error: null };
    },
};
