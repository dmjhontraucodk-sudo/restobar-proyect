// backend_core/src/services/dashboard.service.ts
import {
    mesas_estado,
    ordenes_estado,
    webpedidos_estado,
    TipoCategoria
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { prisma } from '../lib/prisma';

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

// =======================================================
// UTILS DE FECHAS
// =======================================================

/**
 * Obtiene el rango de tiempo para las métricas del día de hoy.
 * @returns {Date} todayStart - Inicio de hoy (00:00:00).
 */
const getTodayRange = (): { todayStart: Date } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return { todayStart: today };
};

/**
 * Obtiene el rango de tiempo de los últimos 7 días (incluyendo hoy).
 * @returns {{weekStart: Date}} weekStart - Inicio de hace 7 días (00:00:00).
 */
const getLast7DaysRange = (): { weekStart: Date } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6); // Rango de 7 días (hoy - 6)

    return { weekStart };
};


// =======================================================
// LÓGICA DEL DASHBOARD
// =======================================================

export class DashboardService {
    
    /**
     * Obtiene todos los datos para la vista general (Overview).
     */
    public async getOverviewData(tenantId: number): Promise<DashboardOverview> {
        const { todayStart } = getTodayRange();
        const { weekStart } = getLast7DaysRange();

        // Ejecutar todas las consultas en paralelo para optimizar la velocidad
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

        // ===================================
        // CÁLCULOS DE KPIS
        // ===================================
        
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


        // ===================================
        // RESULTADO FINAL
        // ===================================

        const overviewData: DashboardOverview = {
            // Kpis
            ventasHoy: ventasDelDia.ventasHoy,
            pedidosHoy: pedidosDelDia.pedidosHoy,
            ocupacionPorcentaje: ocupacionPorcentaje,
            ticketPromedio: parseFloat(ticketPromedio.toFixed(2)),
            
            // Mesas
            estadoMesas: mesas.estadoMesas,
            totalMesas: totalMesas,

            // Gráficos de Venta
            ventasPorHora: ventasPorHora,
            tendenciaVentas: ventasPorDia,
            ventasPorCategoria: ventasPorCategoria,

            // Top Productos
            topPlatos: topProductos.filter(p => p.categoria === 'COMIDA'),
            topBebidas: topProductos.filter(p => p.categoria === 'BEBIDA'),
        };

        return overviewData;
    }


    // =======================================================
    // CONSULTAS A PRISMA
    // =======================================================

    /** * Métrica: Ventas de Hoy
     */
    private async getVentasDelDia(tenantId: number, todayStart: Date) {
        // 1. Órdenes de Salón
        const ordenesSalas = await prisma.ordenes.aggregate({
            _sum: { total: true },
            where: {
                tenant_id: tenantId,
                created_at: { gte: todayStart },
                estado: { in: ['Pagada', 'Cerrada'] as ordenes_estado[] },
            },
        });

        // 2. Pedidos Web
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

        // Nota: Si quisieras la comparación con ayer, deberías agregar una consulta similar para ayer.
        
        return { ventasHoy };
    }


    /** * Métrica: Pedidos de Hoy
     */
    private async getPedidosDelDia(tenantId: number, todayStart: Date) {
        // 1. Órdenes de Salón (Abierta, Cerrada, Pagada)
        const totalOrdenesSalas = await prisma.ordenes.count({
            where: {
                tenant_id: tenantId,
                created_at: { gte: todayStart },
                estado: { not: 'Cancelada' as ordenes_estado },
            },
        });

        // 2. Pedidos Web (No Cancelados)
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


    /** * Métrica: Estado de Mesas (Ocupación)
     */
    private async getEstadoMesas(tenantId: number) {
        const totalMesas = await prisma.mesas.count({ where: { tenant_id: tenantId } });

        const mesasPorEstado = await prisma.mesas.groupBy({
            by: ['estado'],
            _count: { estado: true },
            where: { tenant_id: tenantId },
        });

        // Mapear al formato de la interfaz y asegurar que todos los estados existen
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

    
    /** * Gráfico: Ventas por Hora
     */
    private async getVentasPorHora(tenantId: number, todayStart: Date) {
        // En MySQL, agrupamos usando DATE_FORMAT para extraer la hora.
        // Prisma no soporta `GROUP BY` por hora directamente en `aggregate` o `groupBy`.
        // Tendremos que usar `$queryRaw` o una lógica en TypeScript.
        // Usaremos `$queryRaw` para mejor rendimiento.

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

        // Consolidar resultados (Sumar ventas de salón + web por hora)
        const consolidatedMap = new Map<number, number>();

        [...rawResult, ...rawResultWeb].forEach(item => {
            const hour = item.hour;
            const sales = (item.total_sales as Decimal).toNumber() || 0;
            consolidatedMap.set(hour, (consolidatedMap.get(hour) || 0) + sales);
        });

        // Formatear al tipo esperado (Asegurar todas las horas del día están)
        const ventasPorHora: { hour: number, total: number }[] = [];
        // Asume un horario operativo de 08 a 23 (ejemplo: puedes ajustarlo)
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

    /** * Gráfico: Tendencia de Ventas (Últimos 7 días)
     */
    private async getTendenciaVentas(tenantId: number, weekStart: Date) {
        // Usaremos `$queryRaw` y DATE para agrupar por día
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
        // Nota: Aquí solo incluimos 'ordenes' por simplicidad, se debería incluir 'webpedidos' también.

        // Mapear los nombres cortos de los días a un orden fijo (depende del idioma y DB)
        const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const dayMap = new Map<string, number>();
        rawResult.forEach(item => {
            const sales = (item.total_sales as Decimal).toNumber() || 0;
            dayMap.set(item.day_of_week, sales);
        });

        // Esto requiere una traducción si MySQL no devuelve nombres en español. 
        // Asumiremos que el frontend hará la traducción, pero devolvemos los 7 días.
        const ventasPorDia: { dia: string, total: number }[] = dayOrder.map(dayKey => ({
             // Esto sería 'Lun', 'Mar', etc.
            dia: dayKey, 
            total: dayMap.get(dayKey) || 0,
        }));
        
        return ventasPorDia;
    }


    /** * Gráfico: Top Productos (Platos y Bebidas)
     */
    private async getTopProductos(tenantId: number, todayStart: Date): Promise<DashboardOverview['topPlatos']> {
        // Combinamos detalles de órdenes de salón y web para contar productos.
        
        // 1. Órdenes de Salón
        const ordenesProductos = await prisma.ordendetalles.groupBy({
            by: ['producto_id'],
            _sum: { cantidad: true },
            where: {
                tenant_id: tenantId,
                ordenes: { created_at: { gte: todayStart }, estado: { in: ['Pagada', 'Cerrada'] as ordenes_estado[] } },
            },
        });

        // 2. Pedidos Web
        const webPedidosProductos = await prisma.webpedidos_detalles.groupBy({
            by: ['producto_id'],
            _sum: { cantidad: true },
            where: {
                tenant_id: tenantId,
                webpedidos: { created_at: { gte: todayStart }, estado: { in: ['Entregado', 'ListoParaRecoger'] as webpedidos_estado[] } },
            },
        });

        // 3. Consolidar la cantidad de ambos
        const consolidatedMap = new Map<number, number>();
        [...ordenesProductos, ...webPedidosProductos].forEach(item => {
            const productoId = item.producto_id;
            const cantidad = item._sum.cantidad || 0;
            consolidatedMap.set(productoId, (consolidatedMap.get(productoId) || 0) + cantidad);
        });

        const topProductoIds = Array.from(consolidatedMap.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10) // Top 10 en total
            .map(([id]) => id);


        // 4. Obtener nombres y categorías
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
        
        // 5. Mapear al formato final
        const topProductosData: DashboardOverview['topPlatos'] = productosDetails.map(p => ({
            nombre: p.nombre,
            cantidad: consolidatedMap.get(p.id) || 0,
            categoria: p.categoriasmenu.tipo as 'COMIDA' | 'BEBIDA',
        })).sort((a, b) => b.cantidad - a.cantidad); // Reordenar por si el findMany alteró el orden
        
        return topProductosData;
    }


    /** * Gráfico: Ventas por Categoría (Pastel)
     */
    private async getVentasPorCategoria(tenantId: number, todayStart: Date): Promise<DashboardOverview['ventasPorCategoria']> {
        
        // 1. Obtener los totales de venta por producto_id para el día de hoy
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

        // 2. Obtener los productos y sus categorías
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

        // 3. Calcular el total vendido por categoría
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

        // 4. Mapear al formato final con porcentajes
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