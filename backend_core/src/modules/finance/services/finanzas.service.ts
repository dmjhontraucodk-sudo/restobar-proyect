import { prisma } from '@shared/database/prisma.service';

export const finanzasService = {
    async getResumen(tenantId: number, start: Date, end: Date) {
        const [ventas, compras, gastos] = await Promise.all([
            prisma.ordenes.aggregate({
                where: {
                    tenant_id: tenantId,
                    estado: 'Pagada',
                    created_at: { gte: start, lte: end }
                },
                _sum: { total: true },
                _count: { id: true }
            }),
            prisma.compras.aggregate({
                where: {
                    tenant_id: tenantId,
                    fecha: { gte: start, lte: end }
                },
                _sum: { total: true },
                _count: { id: true }
            }),
            prisma.gastos.aggregate({
                where: {
                    tenant_id: tenantId,
                    fecha: { gte: start, lte: end }
                },
                _sum: { monto: true },
                _count: { id: true }
            })
        ]);

        const totalIngresos = Number(ventas._sum.total || 0);
        const totalCompras = Number(compras._sum.total || 0);
        const totalGastos = Number(gastos._sum.monto || 0);
        const totalEgresos = totalCompras + totalGastos;
        const utilidadNeta = totalIngresos - totalEgresos;
        let margen = '0.0';
        if (totalIngresos > 0) {
            margen = ((utilidadNeta / totalIngresos) * 100).toFixed(1);
        }

        return {
            periodo: { inicio: start.toISOString().split('T')[0], fin: end.toISOString().split('T')[0] },
            resumen: { ingresos: totalIngresos, egresos: totalEgresos, utilidad: utilidadNeta, margen: `${margen}%` },
            detalles: {
                ventas_cantidad: ventas._count.id,
                ventas_total: totalIngresos,
                compras_cantidad: compras._count.id,
                compras_total: totalCompras,
                gastos_cantidad: gastos._count.id,
                gastos_total: totalGastos,
                total_compras_insumos: totalCompras,
                total_gastos_operativos: totalGastos
            }
        };
    }
};
