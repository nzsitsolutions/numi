import { getSupabase } from "../config/supabase.js";
import gastosService from "./gastos.service.js";
import { ResumenMensual } from "../types/database.types.js";

const r2 = (n: number) => Math.round(n * 100) / 100;

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
            getSupabase().from("gastos").select("*").eq("activo", true),
            getSupabase().from("ingresos").select("*").gte("periodo", desde).lt("periodo", hasta),
            getSupabase().from("tarjetas").select("*"),
            getSupabase().from("periodos_mensuales").select("*").eq("anio", anio).eq("mes", mes).maybeSingle(),
            getSupabase().from("deudas_extra").select("*").eq("estado", "activa"),
        ]);

        const primerError = gastos.error || ingresos.error || tarjetas.error || deudas.error;
        if (primerError) return { data: null, error: { message: primerError.message } };

        const tipoCambio = periodoMensual.data?.tipo_cambio ?? 1;

        const tarjetasData = tarjetas.data ?? [];
        const ingresosData = ingresos.data ?? [];
        const deudasData = deudas.data ?? [];

        // Cada gasto con sus VOs ya en ARS (USD convertido por la cotización del período)
        const vos = (gastos.data ?? []).map((g) => gastosService.calcularVOs(g, tipoCambio));

        const conTarjeta = vos.filter((v) => v.tarjetaId != null);
        const sinTarjeta = vos.filter((v) => v.tarjetaId == null);

        const tarjetasMensualARS = conTarjeta.reduce((s, v) => s + v.montoMensualARS, 0);
        const noTarjetasMensualARS = sinTarjeta.reduce((s, v) => s + v.montoMensualARS, 0);

        // Desglose del mes: parte pura en ARS y parte pura en USD (solo de lo que se paga este mes)
        const pagaEsteMes = (v: typeof vos[number]) => v.montoMensualARS > 0;
        const totalMensualARS = vos.reduce((s, v) => s + (pagaEsteMes(v) ? (v.montoARS ?? 0) : 0), 0);
        const totalMensualUSD = vos.reduce((s, v) => s + (pagaEsteMes(v) ? (v.montoUSD ?? 0) : 0), 0);

        // sinDeudas = suma mensual de los gastos fijos (en ARS, USD convertido)
        const sinDeudasARS = vos
            .filter((v) => v.tipo === "fijo")
            .reduce((s, v) => s + v.montoMensualARS, 0);

        // cierre total = Σ de todo lo que falta pagar (payoff completo)
        const cierreTotalARS = vos.reduce((s, v) => s + v.montoTotalRestante, 0);

        const totalIngresosARS = ingresosData.reduce((s, i) => s + i.monto_ars, 0);
        const totalIngresosUSD = ingresosData.reduce((s, i) => s + (i.monto_usd ?? 0), 0);

        const resumen: ResumenMensual = {
            valorUSD: tipoCambio,
            totalMensualARS: r2(totalMensualARS),
            totalMensualUSD: r2(totalMensualUSD),
            totalMesARS: r2(tarjetasMensualARS + noTarjetasMensualARS),
            sinDeudasARS: r2(sinDeudasARS),
            cierreTotalARS: r2(cierreTotalARS),
            tarjetasMensualARS: r2(tarjetasMensualARS),
            noTarjetasMensualARS: r2(noTarjetasMensualARS),
            totalIngresosARS: r2(totalIngresosARS),
            totalIngresosUSD: r2(totalIngresosUSD),
            tarjetas: tarjetasData.map((t) => {
                const gastosDeTarjeta = vos.filter((v) => v.tarjetaId === t.id);
                // usadoUSD: lo restante de la tarjeta expresado en USD
                const usadoUSD = gastosDeTarjeta.reduce(
                    (s, v) => s + (tipoCambio ? v.montoTotalRestante / tipoCambio : 0),
                    0,
                );
                const limiteUSD = t.limite_usd ?? 0;
                const cierreARS = gastosDeTarjeta.reduce((s, v) => s + v.montoTotalRestante, 0);
                return {
                    id: t.id,
                    nombre: t.nombre,
                    limiteUSD,
                    usadoUSD: r2(usadoUSD),
                    disponibleUSD: r2(limiteUSD - usadoUSD),
                    cierreARS: r2(cierreARS),
                    fechaCierre: t.fecha_cierre,
                    fechaVencimiento: t.fecha_vencimiento,
                };
            }),
            deudasExtras: deudasData.map((d) => ({
                descripcion: d.descripcion,
                monto: d.monto,
                moneda: d.moneda,
                montoARS: r2(d.moneda === "USD" ? d.monto * tipoCambio : d.monto),
            })),
        };

        return { data: resumen, error: null };
    },
};
