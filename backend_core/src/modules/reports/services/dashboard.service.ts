import {
    mesas_estado,
    ordenes_estado,
    webpedidos_estado
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '@shared/database/prisma.service';

interface TopProductoData {
    nombre: string;
    cantidad: number;
    categoria: 'COMIDA' | 'BEBIDA';
}

interface MesasEstadoData {
    estado: mesas_estado;
    cantidad: number;
}

interface VentasPorHoraData {
    hora: string;
    total: number;
}

interface VentasPorDiaData {
    dia: string;
    total: number;
}

export interface DashboardOverview {
    ventasHoy: number;
    pedidosHoy: number;
    ocupacionPorcentaje: number;
    ticketPromedio: number;
    
    estadoMesas: MesasEstadoData[];
    totalMesas: number;

    ventasPorHora: VentasPorHoraData[];
    tendenciaVentas: VentasPorDiaData[];
    ventasPorCategoria: Array<{ 
        nombre: string; 
        porcentaje: number; 
        total: number 
    }>;

    topPlatos: TopProductoData[];
    topBebidas: TopProductoData[];
}

const getTodayRange = (): { todayStart: Date } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return { todayStart: today };
};

const getLast7DaysRange = (): { weekStart: Date } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);

    return { weekStart };
};

export class DashboardService {
    
    public async getOverviewData(tenantId: number): Promise<DashboardOverview> {
        const { todayStart } = getTodayRange();
        const { weekStart } = getLast7DaysRange();

        const [
            ventasDelDia,
            pedidosDelDia,
            mesas,
            ventasPorHora,
            ventasPorDia,
            topProductos,
            ventasPorCategoria,
        ] = await Promise.all([
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

        const overviewData: DashboardOverview = {
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

    private async getVentasDelDia(tenantId: number, todayStart: Date) {
        const ordenesSalas = await prisma.ordenes.aggregate({
            _sum: { total: true },
            where: {
                tenant_id: tenantId,
                created_at: { gte: todayStart },
                estado: { in: ['Pagada', 'Cerrada'] as ordenes_estado[] },
            },
        });

        const pedidosWeb = await prisma.webpedidos.aggregate({
            _sum: { total: true },
            where: {
                tenant_id: tenantId,
                created_at: { gte: todayStart },
                estado: { in: ['Entregado', 'ListoParaRecoger'] as webpedidos_estado[] },
            },
        });

        const ventasHoy = (ordenesSalas._sum.total || new Decimal(0))
            .plus(pedidosWeb._sum.total || new Decimal(0))
            .toNumber();
        
        return { ventasHoy };
    }

    private async getPedidosDelDia(tenantId: number, todayStart: Date) {
        const totalOrdenesSalas = await prisma.ordenes.count({
            where: {
                tenant_id: tenantId,
                created_at: { gte: todayStart },
                estado: { not: 'Cancelada' as ordenes_estado },
            },
        });

        const totalPedidosWeb = await prisma.webpedidos.count({
            where: {
                tenant_id: tenantId,
                created_at: { gte: todayStart },
                estado: { not: 'Cancelado' as webpedidos_estado },
            },
        });

        const pedidosHoy = totalOrdenesSalas + totalPedidosWeb;

        return { pedidosHoy };
    }

    private async getEstadoMesas(tenantId: number) {
        const totalMesas = await prisma.mesas.count({ where: { tenant_id: tenantId } });

        const mesasPorEstado = await prisma.mesas.groupBy({
            by: ['estado'],
            _count: { estado: true },
            where: { tenant_id: tenantId },
        });

        const estadoMap = new Map<mesas_estado, number>();
        mesasPorEstado.forEach(item => {
            if (item.estado) {
                estadoMap.set(item.estado as mesas_estado, item._count.estado);
            }
        });
        
        const estados: mesas_estado[] = ['Libre', 'Ocupada', 'Reservada'];
        const estadoMesas = estados.map(estado => ({
            estado: estado,
            cantidad: estadoMap.get(estado) || 0,
        }));

        return { estadoMesas, totalMesas };
    }
    
    private async getVentasPorHora(tenantId: number, todayStart: Date) {
        const rawResult: Array<{ hour: number, total_sales: Decimal }> = await prisma.$queryRaw`
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
        
        const rawResultWeb: Array<{ hour: number, total_sales: Decimal }> = await prisma.$queryRaw`
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

        const consolidatedMap = new Map<number, number>();

        [...rawResult, ...rawResultWeb].forEach(item => {
            const hour = item.hour;
            const sales = (item.total_sales as Decimal).toNumber() || 0;
            consolidatedMap.set(hour, (consolidatedMap.get(hour) || 0) + sales);
        });

        const ventasPorHora: { hour: number, total: number }[] = [];
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

    private async getTendenciaVentas(tenantId: number, weekStart: Date) {
        const rawResult: Array<{ day_of_week: string, total_sales: Decimal }> = await prisma.$queryRaw`
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
        const dayMap = new Map<string, number>();
        rawResult.forEach(item => {
            const sales = (item.total_sales as Decimal).toNumber() || 0;
            dayMap.set(item.day_of_week, sales);
        });

        const ventasPorDia: { dia: string, total: number }[] = dayOrder.map(dayKey => ({
            dia: dayKey, 
            total: dayMap.get(dayKey) || 0,
        }));
        
        return ventasPorDia;
    }

    private async getTopProductos(tenantId: number, todayStart: Date): Promise<DashboardOverview['topPlatos']> {
        const ordenesProductos = await prisma.ordendetalles.groupBy({
            by: ['producto_id'],
            _sum: { cantidad: true },
            where: {
                tenant_id: tenantId,
                ordenes: { created_at: { gte: todayStart }, estado: { in: ['Pagada', 'Cerrada'] as ordenes_estado[] } },
            },
        });

        const webPedidosProductos = await prisma.webpedidos_detalles.groupBy({
            by: ['producto_id'],
            _sum: { cantidad: true },
            where: {
                tenant_id: tenantId,
                webpedidos: { created_at: { gte: todayStart }, estado: { in: ['Entregado', 'ListoParaRecoger'] as webpedidos_estado[] } },
            },
        });

        const consolidatedMap = new Map<number, number>();
        [...ordenesProductos, ...webPedidosProductos].forEach(item => {
            const productoId = item.producto_id;
            const cantidad = item._sum.cantidad || 0;
            consolidatedMap.set(productoId, (consolidatedMap.get(productoId) || 0) + cantidad);
        });

        const topProductoIds = Array.from(consolidatedMap.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([id]) => id);

        const productosDetails = await prisma.productos.findMany({
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
        
        const topProductosData: DashboardOverview['topPlatos'] = productosDetails.map(p => ({
            nombre: p.nombre,
            cantidad: consolidatedMap.get(p.id) || 0,
            categoria: p.categoriasmenu.tipo as 'COMIDA' | 'BEBIDA',
        })).sort((a, b) => b.cantidad - a.cantidad);
        
        return topProductosData;
    }

    private async getVentasPorCategoria(tenantId: number, todayStart: Date): Promise<DashboardOverview['ventasPorCategoria']> {
        const ordenesDetalles = await prisma.ordendetalles.findMany({
            where: {
                tenant_id: tenantId,
                ordenes: { created_at: { gte: todayStart }, estado: { in: ['Pagada', 'Cerrada'] as ordenes_estado[] } },
            },
            select: {
                cantidad: true,
                precio_unitario: true,
                producto_id: true,
            }
        });

        const productIds = ordenesDetalles.map(d => d.producto_id);
        const productsMap = new Map<number, { nombre: string, categoriaNombre: string }>();

        const productsWithCategory = await prisma.productos.findMany({
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

        const categoryTotals = new Map<string, number>();
        let grandTotal = 0;

        ordenesDetalles.forEach(detalle => {
            const { producto_id, cantidad, precio_unitario } = detalle;
            const productInfo = productsMap.get(producto_id);

            if (productInfo) {
                const totalItem = (precio_unitario as Decimal).toNumber() * cantidad;
                const currentTotal = categoryTotals.get(productInfo.categoriaNombre) || 0;
                categoryTotals.set(productInfo.categoriaNombre, currentTotal + totalItem);
                grandTotal += totalItem;
            }
        });

        const ventasPorCategoria: DashboardOverview['ventasPorCategoria'] = [];
        
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
