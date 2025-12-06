"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cronService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_service_1 = require("@shared/database/prisma.service");
const notification_service_1 = require("@core/notifications/notification.service");
const inventory_alerts_service_1 = require("@modules/inventory/services/inventory-alerts.service");
exports.cronService = {
    /**
     * Iniciar todos los cron jobs
     */
    iniciarCronJobs() {
        console.log('📅 [CRON] Iniciando tareas programadas...');
        // ========== RESUMEN DIARIO ==========
        // Se ejecuta cada hora y verifica si algún tenant tiene configurado el resumen
        node_cron_1.default.schedule('0 * * * *', async () => {
            await this.verificarResumenDiario();
        });
        // ========== VERIFICAR STOCK BAJO ==========
        // Se ejecuta a las 8:00 AM todos los días
        node_cron_1.default.schedule('0 8 * * *', async () => {
            await this.verificarStockBajoTodosTenants();
        });
        console.log('✅ [CRON] Tareas programadas iniciadas correctamente');
    },
    /**
     * Verificar si algún tenant tiene habilitado el resumen diario
     * y si es la hora configurada
     */
    async verificarResumenDiario() {
        try {
            const horaActual = new Date().toLocaleTimeString('es-PE', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            console.log(`🕐 [CRON] Verificando resumen diario (${horaActual})`);
            // Buscar todos los tenants con resumen diario activo
            const tenantsConResumen = await prisma_service_1.prisma.tenant_config.findMany({
                where: {
                    resumen_diario_activo: true
                }
            });
            for (const config of tenantsConResumen) {
                // Verificar si el tenant existe y está activo
                const tenant = await prisma_service_1.prisma.tenants.findUnique({
                    where: { id: config.tenant_id }
                });
                if (!tenant || !tenant.isActive)
                    continue;
                // Verificar si es la hora configurada para este tenant
                const horaResumen = config.resumen_diario_hora || '20:00';
                if (horaActual === horaResumen) {
                    console.log(`📊 [CRON] Generando resumen diario para tenant: ${tenant.nombre_empresa}`);
                    await this.generarResumenDiario(config.tenant_id);
                }
            }
        }
        catch (error) {
            console.error('❌ [CRON] Error al verificar resumen diario:', error);
        }
    },
    /**
     * Generar y enviar resumen diario de un tenant
     */
    async generarResumenDiario(tenantId) {
        try {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const manana = new Date(hoy);
            manana.setDate(manana.getDate() + 1);
            // Obtener estadísticas del día
            const pedidosWeb = await prisma_service_1.prisma.webpedidos.findMany({
                where: {
                    tenant_id: tenantId,
                    created_at: {
                        gte: hoy,
                        lt: manana
                    }
                }
            });
            const ordenesPos = await prisma_service_1.prisma.ordenes.findMany({
                where: {
                    tenant_id: tenantId,
                    created_at: {
                        gte: hoy,
                        lt: manana
                    },
                    estado: 'Cerrada'
                }
            });
            // Calcular totales
            const ventasWeb = pedidosWeb.reduce((sum, p) => sum + Number(p.total), 0);
            const ventasPos = ordenesPos.reduce((sum, o) => sum + Number(o.total), 0);
            const ventasTotales = ventasWeb + ventasPos;
            const estadisticas = {
                pedidos_totales: pedidosWeb.length + ordenesPos.length,
                ventas_totales: ventasTotales,
                ticket_promedio: ventasTotales / (pedidosWeb.length + ordenesPos.length) || 0,
                pedidos_por_tipo: {
                    pos: ordenesPos.length,
                    web: pedidosWeb.length
                }
            };
            // Enviar email
            await notification_service_1.notificationService.enviarResumenDiario(tenantId, estadisticas);
            console.log(`✅ [CRON] Resumen diario enviado para tenant ${tenantId}`);
        }
        catch (error) {
            console.error(`❌ [CRON] Error al generar resumen diario para tenant ${tenantId}:`, error);
        }
    },
    /**
     * Verificar stock bajo para todos los tenants
     */
    async verificarStockBajoTodosTenants() {
        try {
            console.log('📦 [CRON] Verificando stock bajo para todos los tenants...');
            // Obtener todos los tenants activos con alertas habilitadas
            const tenantsConAlertas = await prisma_service_1.prisma.tenant_config.findMany({
                where: {
                    alertas_stock_bajo: true
                }
            });
            for (const config of tenantsConAlertas) {
                // Verificar si el tenant está activo
                const tenant = await prisma_service_1.prisma.tenants.findUnique({
                    where: { id: config.tenant_id }
                });
                if (tenant && tenant.isActive) {
                    console.log(`📦 [CRON] Verificando stock bajo para: ${tenant.nombre_empresa}`);
                    await inventory_alerts_service_1.inventoryAlertsService.verificarStockBajo(config.tenant_id);
                }
            }
            console.log('✅ [CRON] Verificación de stock bajo completada');
        }
        catch (error) {
            console.error('❌ [CRON] Error al verificar stock bajo:', error);
        }
    },
    /**
     * Detener todos los cron jobs (útil para testing)
     */
    detenerCronJobs() {
        console.log('🛑 [CRON] Deteniendo tareas programadas...');
        // node-cron detiene automáticamente al cerrar el proceso
    }
};
