import { prisma } from '../lib/prisma';
import { ordenes, webpedidos, pagos, gastos, productos_inventario, cierres_inventario_detalles } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Helper para convertir Decimal a Number
const toNumber = (decimal: Decimal | number | string | null | undefined): number => {
    if (decimal === null || decimal === undefined) return 0;
    // Convierte el Decimal de Prisma a string y luego a float
    return parseFloat(decimal.toString());
};

// Interfaz para los filtros de fecha
interface DateRange {
    startDate: Date;
    endDate: Date;
}

// =======================================================
// === 1. REPORTES DE VENTAS Y ÓRDENES
// =======================================================

export const reportsService = {

    /**
     * Genera el resumen de ventas (KPIs, totales y tendencia diaria)
     */
    async getSalesSummaryByDateRange(tenantId: number, range: DateRange) {
        const { startDate, endDate } = range;

        // 1. Calcular KPIs generales de ventas
        const salesData = await prisma.ordenes.aggregate({
            _sum: { total: true, descuento: true },
            _count: { id: true },
            where: {
                tenant_id: tenantId,
                estado: 'Cerrada', // Solo órdenes cerradas (POS)
                closed_at: { gte: startDate, lte: endDate }
            }
        });

        // 2. Calcular Ventas Web confirmadas y entregadas
        const webSalesData = await prisma.webpedidos.aggregate({
            _sum: { total: true },
            _count: { id: true },
            where: {
                tenant_id: tenantId,
                estado: { in: ['Confirmado', 'EnPreparacion', 'ListoParaRecoger', 'EnCamino', 'Entregado'] },
                created_at: { gte: startDate, lte: endDate }
            }
        });
        
        // El total de ventas es POS cerradas + WebPedidos completados
        const totalVentas = toNumber(salesData._sum.total) + toNumber(webSalesData._sum.total);

        // 3. Tendencia de ventas por día (solo usando órdenes cerradas)
        const dailyTrend = await prisma.$queryRaw<any[]>`
            SELECT 
                DATE(closed_at) AS dia,
                SUM(total) AS total
            FROM ordenes
            WHERE 
                tenant_id = ${tenantId} AND 
                estado = 'Cerrada' AND
                closed_at BETWEEN ${startDate} AND ${endDate}
            GROUP BY dia
            ORDER BY dia ASC;
        `;
        
        // Formatear la tendencia a números (Prisma devuelve Decimales de la DB)
        const trendData = dailyTrend.map(row => ({
            dia: row.dia.toISOString().split('T')[0], // Convertir Date a string de fecha
            total: toNumber(row.total),
        }));

        return {
            totalVentas: totalVentas,
            totalDescuentos: toNumber(salesData._sum.descuento),
            ordenesPOS: salesData._count.id,
            webPedidos: webSalesData._count.id,
            ventaPromedio: salesData._count.id > 0 ? toNumber(salesData._sum.total) / salesData._count.id : 0,
            tendencia: trendData,
        };
    },

    // =======================================================
    // === 2. REPORTES DE INVENTARIO Y COSTOS
    // =======================================================

    /**
     * Obtiene el resumen de inventario (Stock Crítico, Valoración y Mermas)
     */
    async getInventorySummaryAndAlerts(tenantId: number, range: DateRange) {
        const { startDate, endDate } = range;
        
        // 1. Productos en Stock Crítico
        const lowStockCount = await prisma.productos_inventario.count({
            where: {
                tenant_id: tenantId,
                activo: true,
                stock_actual: { lte: prisma.productos_inventario.fields.stock_minimo }
            }
        });

        // 2. Valoración total del inventario (sum(stock_actual * costo_unitario))
        // Dado que Prisma no soporta Aggregation con fórmulas complejas, usamos queryRaw
        const inventoryValueResult = await prisma.$queryRaw<any[]>`
            SELECT SUM(stock_actual * costo_unitario) AS valor_total 
            FROM productos_inventario 
            WHERE tenant_id = ${tenantId} AND activo = TRUE;
        `;
        const inventoryValue = inventoryValueResult.length > 0 ? toNumber(inventoryValueResult[0].valor_total) : 0;
        
        // 3. Valor total de Mermas/Diferencias registradas en Cierres
        const mermaValueResult = await prisma.cierres_inventario.aggregate({
            _sum: { total_diferencias: true },
            where: {
                tenant_id: tenantId,
                estado: 'Finalizado',
                fecha_fin: { gte: startDate, lte: endDate }
            }
        });
        const totalMermas = toNumber(mermaValueResult._sum.total_diferencias);

        // 4. Total de Compras (Entradas) en el rango de fechas
        const comprasTotal = await prisma.compras.aggregate({
            _sum: { total: true },
            where: {
                tenant_id: tenantId,
                fecha: { gte: startDate, lte: endDate },
                // Solo compras que afectan inventario (o todas, si no podemos filtrar por el tipo de gasto)
                tipos_gasto: { afecta_inventario: true } 
            }
        });
        const totalCompras = toNumber(comprasTotal._sum.total);

        return {
            lowStockCount,
            inventoryValue,
            totalMermas,
            totalCompras,
        };
    },

    // =======================================================
    // === 3. REPORTES DE FINANZAS, GASTOS Y CAJA
    // =======================================================

    /**
     * Obtiene el resumen financiero (Ingresos por Pago, Gastos por Tipo)
     */
    async getFinanceSummaryByDateRange(tenantId: number, range: DateRange) {
        const { startDate, endDate } = range;

        // 1. Distribución de Ingresos por Método de Pago (desde Pagos de Órdenes)
        const pagosPorMetodo = await prisma.pagos.groupBy({
            by: ['metodo_pago'],
            _sum: { monto: true },
            where: {
                tenant_id: tenantId,
                created_at: { gte: startDate, lte: endDate }
            }
        });

        const ingresosPorMetodo = pagosPorMetodo.map(p => ({
            metodo: p.metodo_pago,
            total: toNumber(p._sum.monto)
        }));
        
        const totalIngresos = ingresosPorMetodo.reduce((sum, p) => sum + p.total, 0);

        // 2. Distribución de Gastos por Tipo (Gastos Operativos + Compras)
        const gastosOperativos = await prisma.gastos.findMany({
            where: {
                tenant_id: tenantId,
                fecha: { gte: startDate, lte: endDate }
            },
            include: { tipos_gasto: true }
        });
        
        const gastosMap: Record<string, { nombre: string, total: number }> = {};
        let totalGastos = 0;

        gastosOperativos.forEach(gasto => {
            const tipoGastoNombre = gasto.tipos_gasto.nombre;
            const monto = toNumber(gasto.monto);
            
            if (!gastosMap[tipoGastoNombre]) {
                gastosMap[tipoGastoNombre] = {
                    nombre: tipoGastoNombre,
                    total: 0
                };
            }
            gastosMap[tipoGastoNombre].total += monto;
            totalGastos += monto;
        });

        const gastosPorTipo = Object.values(gastosMap);
        
        // 3. Diferencias de Caja (Conteo de Desfalcos/Sobrantes)
        const cierresCaja = await prisma.cajas.findMany({
            where: {
                tenant_id: tenantId,
                estado: 'Cerrada',
                fecha_cierre: { gte: startDate, lte: endDate }
            },
            select: {
                id: true,
                diferencia: true, // Decimal
            }
        });
        
        let totalSobrante = 0;
        let totalDesfalco = 0;
        let cierresConDiferencia = 0;
        
        cierresCaja.forEach(caja => {
            const diff = toNumber(caja.diferencia);
            if (diff > 0) {
                totalSobrante += diff;
                cierresConDiferencia++;
            } else if (diff < 0) {
                totalDesfalco += Math.abs(diff);
                cierresConDiferencia++;
            }
        });


        return {
            totalIngresos,
            totalGastos,
            margenBruto: totalIngresos - totalGastos, // Ingresos - Gastos = Margen
            ingresosPorMetodo,
            gastosPorTipo,
            totalSobrante,
            totalDesfalco,
            cierresConDiferencia
        };
    },
};