"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResumenFinanciero = void 0;
const prisma_1 = require("../../lib/prisma");
const getResumenFinanciero = async (req, res) => {
    try {
        const tenantId = req.user?.tenant_id;
        if (!tenantId) {
            return res.status(403).json({ error: 'Acceso prohibido. Tenant ID no encontrado.' });
        }
        const { fechaInicio, fechaFin } = req.query;
        // 1. Definir el rango de fechas
        // Por defecto: Desde el primer día del mes actual hasta hoy
        const now = new Date();
        const start = fechaInicio
            ? new Date(fechaInicio)
            : new Date(now.getFullYear(), now.getMonth(), 1); // Primer día del mes
        const end = fechaFin
            ? new Date(fechaFin)
            : new Date(); // Hoy
        // Ajustar 'end' para que incluya todo el último día (hasta las 23:59:59)
        end.setHours(23, 59, 59, 999);
        // 2. CONSULTAR INGRESOS (Ventas confirmadas/pagadas)
        // Solo consideramos órdenes en estado 'Pagada' para el flujo real de dinero
        const ventas = await prisma_1.prisma.ordenes.aggregate({
            where: {
                tenant_id: tenantId,
                estado: 'Pagada',
                created_at: {
                    gte: start,
                    lte: end
                }
            },
            _sum: { total: true },
            _count: { id: true }
        });
        // 3. CONSULTAR EGRESOS POR COMPRAS (Insumos de Inventario)
        // Sumamos el total de las compras registradas en el periodo
        const compras = await prisma_1.prisma.compras.aggregate({
            where: {
                tenant_id: tenantId,
                fecha: {
                    gte: start,
                    lte: end
                }
            },
            _sum: { total: true },
            _count: { id: true }
        });
        // 4. CONSULTAR GASTOS OPERATIVOS (Servicios, Alquiler, etc.)
        // Sumamos los gastos generales que NO son inventario
        const gastos = await prisma_1.prisma.gastos.aggregate({
            where: {
                tenant_id: tenantId,
                fecha: {
                    gte: start,
                    lte: end
                }
            },
            _sum: { monto: true },
            _count: { id: true }
        });
        // 5. CÁLCULOS MATEMÁTICOS
        const totalIngresos = Number(ventas._sum.total || 0);
        const totalCompras = Number(compras._sum.total || 0);
        const totalGastos = Number(gastos._sum.monto || 0);
        const totalEgresos = totalCompras + totalGastos;
        const utilidadNeta = totalIngresos - totalEgresos;
        // Cálculo del Margen de Ganancia (%)
        // Fórmula: (Utilidad / Ingresos) * 100
        let margen = '0.0';
        if (totalIngresos > 0) {
            margen = ((utilidadNeta / totalIngresos) * 100).toFixed(1);
        }
        // 6. RESPONDER AL FRONTEND
        res.json({
            periodo: {
                inicio: start.toISOString().split('T')[0],
                fin: end.toISOString().split('T')[0]
            },
            resumen: {
                ingresos: totalIngresos,
                egresos: totalEgresos,
                utilidad: utilidadNeta,
                margen: `${margen}%`
            },
            detalles: {
                ventas_cantidad: ventas._count.id, // Cantidad de tickets vendidos
                ventas_total: totalIngresos, // Total dinero ventas
                compras_cantidad: compras._count.id, // Cantidad de facturas de compra
                compras_total: totalCompras, // Total dinero compras (Insumos)
                gastos_cantidad: gastos._count.id, // Cantidad de recibos de gastos
                gastos_total: totalGastos, // Total dinero gastos (Operativos)
                total_compras_insumos: totalCompras, // Alias para compatibilidad con frontend
                total_gastos_operativos: totalGastos // Alias para compatibilidad con frontend
            }
        });
    }
    catch (error) {
        console.error('Error crítico en reporte financiero:', error);
        res.status(500).json({ error: 'Error interno del servidor al generar reporte financiero.' });
    }
};
exports.getResumenFinanciero = getResumenFinanciero;
