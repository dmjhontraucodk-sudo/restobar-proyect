"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const library_1 = require("@prisma/client/runtime/library");
const prisma_service_1 = require("@shared/database/prisma.service");
const getTodayRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return { todayStart: today };
};
const getLast7DaysRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);
    return { weekStart };
};
class DashboardService {
    async getOverviewData(tenantId) {
        const { todayStart } = getTodayRange();
        const { weekStart } = getLast7DaysRange();
        const [ventasDelDia, pedidosDelDia, mesas, ventasPorHora, ventasPorDia, topProductos, ventasPorCategoria,] = await Promise.all([
            this.getVentasDelDia(tenantId, todayStart),
            this.getPedidosDelDia(tenantId, todayStart),
            this.getEstadoMesas(tenantId),
            this.getVentasPorHora(tenantId, todayStart),
            this.getTendenciaVentas(tenantId, weekStart),
            this.getTopProductos(tenantId, todayStart),
            this.getVentasPorCategoria(tenantId, todayStart),
        ]);
        const totalMesas = mesas.totalMesas;
        const ocupadas = mesas.estadoMesas.find(e => e.estado === 'Ocupada')?.cantidad || 0;
        const reservadas = mesas.estadoMesas.find(e => e.estado === 'Reservada')?.cantidad || 0;
        const ocupacionActual = ocupadas + reservadas;
        const ocupacionPorcentaje = totalMesas > 0
            ? Math.round((ocupacionActual / totalMesas) * 100)
            : 0;
        const ticketPromedio = pedidosDelDia.pedidosHoy > 0
            ? ventasDelDia.ventasHoy / pedidosDelDia.pedidosHoy
            : 0;
        const overviewData = {
            ventasHoy: ventasDelDia.ventasHoy,
            pedidosHoy: pedidosDelDia.pedidosHoy,
            ocupacionPorcentaje: ocupacionPorcentaje,
            ticketPromedio: parseFloat(ticketPromedio.toFixed(2)),
            estadoMesas: mesas.estadoMesas,
            totalMesas: totalMesas,
            ventasPorHora: ventasPorHora,
            tendenciaVentas: ventasPorDia,
            ventasPorCategoria: ventasPorCategoria,
            topPlatos: topProductos.filter(p => p.categoria === 'COMIDA'),
            topBebidas: topProductos.filter(p => p.categoria === 'BEBIDA'),
        };
        return overviewData;
    }
    async getVentasDelDia(tenantId, todayStart) {
        const ordenesSalas = await prisma_service_1.prisma.ordenes.aggregate({
            _sum: { total: true },
            where: {
                tenant_id: tenantId,
                created_at: { gte: todayStart },
                estado: { in: ['Pagada', 'Cerrada'] },
            },
        });
        const pedidosWeb = await prisma_service_1.prisma.webpedidos.aggregate({
            _sum: { total: true },
            where: {
                tenant_id: tenantId,
                created_at: { gte: todayStart },
                estado: { in: ['Entregado', 'ListoParaRecoger'] },
            },
        });
        const ventasHoy = (ordenesSalas._sum.total || new library_1.Decimal(0))
            .plus(pedidosWeb._sum.total || new library_1.Decimal(0))
            .toNumber();
        return { ventasHoy };
    }
    async getPedidosDelDia(tenantId, todayStart) {
        const totalOrdenesSalas = await prisma_service_1.prisma.ordenes.count({
            where: {
                tenant_id: tenantId,
                created_at: { gte: todayStart },
                estado: { not: 'Cancelada' },
            },
        });
        const totalPedidosWeb = await prisma_service_1.prisma.webpedidos.count({
            where: {
                tenant_id: tenantId,
                created_at: { gte: todayStart },
                estado: { not: 'Cancelado' },
            },
        });
        const pedidosHoy = totalOrdenesSalas + totalPedidosWeb;
        return { pedidosHoy };
    }
    async getEstadoMesas(tenantId) {
        const totalMesas = await prisma_service_1.prisma.mesas.count({ where: { tenant_id: tenantId } });
        const mesasPorEstado = await prisma_service_1.prisma.mesas.groupBy({
            by: ['estado'],
            _count: { estado: true },
            where: { tenant_id: tenantId },
        });
        const estadoMap = new Map();
        mesasPorEstado.forEach(item => {
            if (item.estado) {
                estadoMap.set(item.estado, item._count.estado);
            }
        });
        const estados = ['Libre', 'Ocupada', 'Reservada'];
        const estadoMesas = estados.map(estado => ({
            estado: estado,
            cantidad: estadoMap.get(estado) || 0,
        }));
        return { estadoMesas, totalMesas };
    }
    async getVentasPorHora(tenantId, todayStart) {
        const rawResult = await prisma_service_1.prisma.$queryRaw `
            SELECT 
                HOUR(created_at) as hour,
                SUM(CAST(total AS DECIMAL(10, 2))) as total_sales
            FROM ordenes
            WHERE tenant_id = ${tenantId}
            AND created_at >= ${todayStart}
            AND estado IN ('Pagada', 'Cerrada')
            GROUP BY hour
            ORDER BY hour ASC
        `;
        const rawResultWeb = await prisma_service_1.prisma.$queryRaw `
            SELECT 
                HOUR(created_at) as hour,
                SUM(CAST(total AS DECIMAL(10, 2))) as total_sales
            FROM webpedidos
            WHERE tenant_id = ${tenantId}
            AND created_at >= ${todayStart}
            AND estado IN ('Entregado', 'ListoParaRecoger')
            GROUP BY hour
            ORDER BY hour ASC
        `;
        const consolidatedMap = new Map();
        [...rawResult, ...rawResultWeb].forEach(item => {
            const hour = item.hour;
            const sales = item.total_sales.toNumber() || 0;
            consolidatedMap.set(hour, (consolidatedMap.get(hour) || 0) + sales);
        });
        const ventasPorHora = [];
        for (let hour = 8; hour <= 23; hour++) {
            const total = consolidatedMap.get(hour) || 0;
            ventasPorHora.push({
                hour: hour,
                total: parseFloat(total.toFixed(2)),
            });
        }
        return ventasPorHora.map(item => ({
            hora: `${item.hour.toString().padStart(2, '0')}:00`,
            total: item.total
        }));
    }
    async getTendenciaVentas(tenantId, weekStart) {
        const rawResult = await prisma_service_1.prisma.$queryRaw `
            SELECT 
                DATE_FORMAT(created_at, '%a') as day_of_week,
                SUM(CAST(total AS DECIMAL(10, 2))) as total_sales
            FROM ordenes
            WHERE tenant_id = ${tenantId}
            AND created_at >= ${weekStart}
            AND estado IN ('Pagada', 'Cerrada')
            GROUP BY day_of_week
            ORDER BY created_at ASC
        `;
        const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const dayMap = new Map();
        rawResult.forEach(item => {
            const sales = item.total_sales.toNumber() || 0;
            dayMap.set(item.day_of_week, sales);
        });
        const ventasPorDia = dayOrder.map(dayKey => ({
            dia: dayKey,
            total: dayMap.get(dayKey) || 0,
        }));
        return ventasPorDia;
    }
    async getTopProductos(tenantId, todayStart) {
        const ordenesProductos = await prisma_service_1.prisma.ordendetalles.groupBy({
            by: ['producto_id'],
            _sum: { cantidad: true },
            where: {
                tenant_id: tenantId,
                ordenes: { created_at: { gte: todayStart }, estado: { in: ['Pagada', 'Cerrada'] } },
            },
        });
        const webPedidosProductos = await prisma_service_1.prisma.webpedidos_detalles.groupBy({
            by: ['producto_id'],
            _sum: { cantidad: true },
            where: {
                tenant_id: tenantId,
                webpedidos: { created_at: { gte: todayStart }, estado: { in: ['Entregado', 'ListoParaRecoger'] } },
            },
        });
        const consolidatedMap = new Map();
        [...ordenesProductos, ...webPedidosProductos].forEach(item => {
            const productoId = item.producto_id;
            const cantidad = item._sum.cantidad || 0;
            consolidatedMap.set(productoId, (consolidatedMap.get(productoId) || 0) + cantidad);
        });
        const topProductoIds = Array.from(consolidatedMap.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([id]) => id);
        const productosDetails = await prisma_service_1.prisma.productos.findMany({
            where: {
                id: { in: topProductoIds },
                tenant_id: tenantId
            },
            select: {
                id: true,
                nombre: true,
                categoriasmenu: { select: { tipo: true } }
            }
        });
        const topProductosData = productosDetails.map(p => ({
            nombre: p.nombre,
            cantidad: consolidatedMap.get(p.id) || 0,
            categoria: p.categoriasmenu.tipo,
        })).sort((a, b) => b.cantidad - a.cantidad);
        return topProductosData;
    }
    async getVentasPorCategoria(tenantId, todayStart) {
        const ordenesDetalles = await prisma_service_1.prisma.ordendetalles.findMany({
            where: {
                tenant_id: tenantId,
                ordenes: { created_at: { gte: todayStart }, estado: { in: ['Pagada', 'Cerrada'] } },
            },
            select: {
                cantidad: true,
                precio_unitario: true,
                producto_id: true,
            }
        });
        const productIds = ordenesDetalles.map(d => d.producto_id);
        const productsMap = new Map();
        const productsWithCategory = await prisma_service_1.prisma.productos.findMany({
            where: { id: { in: productIds }, tenant_id: tenantId },
            select: {
                id: true,
                nombre: true,
                categoriasmenu: { select: { nombre: true } }
            }
        });
        productsWithCategory.forEach(p => {
            productsMap.set(p.id, { nombre: p.nombre, categoriaNombre: p.categoriasmenu.nombre });
        });
        const categoryTotals = new Map();
        let grandTotal = 0;
        ordenesDetalles.forEach(detalle => {
            const { producto_id, cantidad, precio_unitario } = detalle;
            const productInfo = productsMap.get(producto_id);
            if (productInfo) {
                const totalItem = precio_unitario.toNumber() * cantidad;
                const currentTotal = categoryTotals.get(productInfo.categoriaNombre) || 0;
                categoryTotals.set(productInfo.categoriaNombre, currentTotal + totalItem);
                grandTotal += totalItem;
            }
        });
        const ventasPorCategoria = [];
        categoryTotals.forEach((total, nombre) => {
            const porcentaje = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
            ventasPorCategoria.push({
                nombre: nombre,
                total: parseFloat(total.toFixed(2)),
                porcentaje: parseFloat(porcentaje.toFixed(2)),
            });
        });
        return ventasPorCategoria.sort((a, b) => b.total - a.total);
    }
}
exports.DashboardService = DashboardService;
