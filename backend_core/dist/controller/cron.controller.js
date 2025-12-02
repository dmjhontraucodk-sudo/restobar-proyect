"use strict";
// backend/src/controller/cron.controller.ts
// Controlador para ejecutar tareas de cron manualmente (para testing)
Object.defineProperty(exports, "__esModule", { value: true });
exports.cronController = void 0;
const inventory_alerts_service_1 = require("../services/inventory-alerts.service");
const notification_service_1 = require("../services/notification.service");
const prisma_1 = require("../lib/prisma");
exports.cronController = {
    /**
     * Ejecutar resumen diario manualmente
     */
    async ejecutarResumenDiario(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso no autorizado' });
            }
            console.log(`📊 [MANUAL] Ejecutando resumen diario para tenant: ${tenantId}`);
            // Generar estadísticas del día
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const manana = new Date(hoy);
            manana.setDate(manana.getDate() + 1);
            const pedidosWeb = await prisma_1.prisma.webpedidos.findMany({
                where: {
                    tenant_id: tenantId,
                    created_at: {
                        gte: hoy,
                        lt: manana
                    }
                }
            });
            const ordenesPos = await prisma_1.prisma.ordenes.findMany({
                where: {
                    tenant_id: tenantId,
                    created_at: {
                        gte: hoy,
                        lt: manana
                    },
                    estado: 'Cerrada'
                }
            });
            // Calcular totales de manera más segura
            const ventasWeb = pedidosWeb.reduce((sum, p) => sum + Number(p.total || 0), 0);
            const ventasPos = ordenesPos.reduce((sum, o) => sum + Number(o.total || 0), 0);
            const ventasTotales = ventasWeb + ventasPos;
            const totalPedidos = pedidosWeb.length + ordenesPos.length;
            const estadisticas = {
                pedidos_totales: totalPedidos,
                ventas_totales: ventasTotales,
                ticket_promedio: totalPedidos > 0 ? ventasTotales / totalPedidos : 0,
                pedidos_por_tipo: {
                    pos: ordenesPos.length,
                    web: pedidosWeb.length
                },
                fecha: hoy.toISOString().split('T')[0] // Agregar fecha del reporte
            };
            // Enviar email
            await notification_service_1.notificationService.enviarResumenDiario(tenantId, estadisticas);
            res.json({
                success: true,
                message: 'Resumen diario enviado correctamente',
                estadisticas,
                enviado: true
            });
        }
        catch (error) {
            console.error('Error al ejecutar resumen diario:', error);
            res.status(500).json({
                success: false,
                error: 'Error al generar resumen diario',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },
    /**
     * Verificar stock bajo manualmente
     */
    async verificarStockBajoManual(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso no autorizado' });
            }
            console.log(`📦 [MANUAL] Verificando stock bajo para tenant: ${tenantId}`);
            const productos = await inventory_alerts_service_1.inventoryAlertsService.verificarStockBajo(tenantId);
            res.json({
                success: true,
                message: productos.length > 0
                    ? `Se encontraron ${productos.length} productos con stock bajo`
                    : 'Todos los productos tienen stock suficiente',
                productos,
                count: productos.length,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Error al verificar stock bajo:', error);
            res.status(500).json({
                success: false,
                error: 'Error al verificar stock bajo',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },
    /**
     * Ver estado de los cron jobs
     */
    async getEstadoCronJobs(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso no autorizado' });
            }
            // Obtener configuración de cron jobs para este tenant
            const config = await prisma_1.prisma.tenant_config.findUnique({
                where: { tenant_id: tenantId }
            });
            if (!config) {
                return res.status(404).json({
                    success: false,
                    error: 'Configuración no encontrada'
                });
            }
            const horaActual = new Date().toLocaleTimeString('es-PE', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            res.json({
                success: true,
                cron_jobs: {
                    resumen_diario: {
                        activo: config.resumen_diario_activo,
                        hora_programada: config.resumen_diario_hora || '20:00',
                        hora_actual: horaActual,
                        email_destino: config.email_nuevos_pedidos || 'No configurado',
                        ejecutado: horaActual === (config.resumen_diario_hora || '20:00')
                    },
                    alertas_stock_bajo: {
                        activo: config.alertas_stock_bajo,
                        nivel_alerta: Number(config.nivel_alerta_stock) || 10,
                        hora_verificacion: '08:00',
                        email_destino: config.email_stock_critico || 'No configurado'
                    },
                    alertar_agotados: {
                        activo: config.alertar_agotados,
                        email_destino: config.email_stock_critico || 'No configurado'
                    }
                },
                tenant: {
                    id: tenantId,
                    nombre: config.nombre_negocio || 'Sin nombre'
                }
            });
        }
        catch (error) {
            console.error('Error al obtener estado de cron jobs:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener estado',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};
