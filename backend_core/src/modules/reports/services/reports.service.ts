import { prisma } from '@shared/database/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

const toNumber = (decimal: Decimal | number | string | null | undefined): number => {
    if (decimal === null || decimal === undefined) return 0;
    return parseFloat(decimal.toString());
};

interface DateRange {
    startDate: Date;
    endDate: Date;
}

export const reportsService = {

    async getSalesSummaryByDateRange(tenantId: number, range: DateRange) {
        const { startDate, endDate } = range;

        const salesData = await prisma.ordenes.aggregate({
            _sum: { total: true, descuento: true },
            _count: { id: true },
            where: {
                tenant_id: tenantId,
                estado: 'Cerrada',
                closed_at: { gte: startDate, lte: endDate }
            }
        });

        const webSalesData = await prisma.webpedidos.aggregate({
            _sum: { total: true },
            _count: { id: true },
            where: {
                tenant_id: tenantId,
                estado: { in: ['Confirmado', 'EnPreparacion', 'ListoParaRecoger', 'EnCamino', 'Entregado'] },
                created_at: { gte: startDate, lte: endDate }
            }
        });
        
        const totalVentas = toNumber(salesData._sum.total) + toNumber(webSalesData._sum.total);

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
        
        const trendData = dailyTrend.map(row => ({
            dia: row.dia.toISOString().split('T')[0],
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

    async getInventorySummaryAndAlerts(tenantId: number, range: DateRange) {
        const { startDate, endDate } = range;
        
        const lowStockCount = await prisma.productos_inventario.count({
            where: {
                tenant_id: tenantId,
                activo: true,
                stock_actual: { lte: prisma.productos_inventario.fields.stock_minimo }
            }
        });

        const inventoryValueResult = await prisma.$queryRaw<any[]>`
            SELECT SUM(stock_actual * costo_unitario) AS valor_total 
            FROM productos_inventario 
            WHERE tenant_id = ${tenantId} AND activo = TRUE;
        `;
        const inventoryValue = inventoryValueResult.length > 0 ? toNumber(inventoryValueResult[0].valor_total) : 0;
        
        const mermaValueResult = await prisma.cierres_inventario.aggregate({
            _sum: { total_diferencias: true },
            where: {
                tenant_id: tenantId,
                estado: 'Finalizado',
                fecha_fin: { gte: startDate, lte: endDate }
            }
        });
        const totalMermas = toNumber(mermaValueResult._sum.total_diferencias);

        const comprasTotal = await prisma.compras.aggregate({
            _sum: { total: true },
            where: {
                tenant_id: tenantId,
                fecha: { gte: startDate, lte: endDate },
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

    async getFinanceSummaryByDateRange(tenantId: number, range: DateRange) {
        const { startDate, endDate } = range;

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
        
        const cierresCaja = await prisma.cajas.findMany({
            where: {
                tenant_id: tenantId,
                estado: 'Cerrada',
                fecha_cierre: { gte: startDate, lte: endDate }
            },
            select: {
                id: true,
                diferencia: true,
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
            margenBruto: totalIngresos - totalGastos,
            ingresosPorMetodo,
            gastosPorTipo,
            totalSobrante,
            totalDesfalco,
            cierresConDiferencia
        };
    },
};
