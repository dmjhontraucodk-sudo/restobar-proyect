"use strict";
// src/services/tenant-config.service.ts
// ACTUALIZADO con funciones para validaciones de pedidos web
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantConfigService = void 0;
const prisma_1 = require("../lib/prisma");
// ========== SERVICE PRINCIPAL ==========
exports.tenantConfigService = {
    // ============================================================
    // FUNCIONES ANTIGUAS (MANTIENEN COMPATIBILIDAD)
    // ============================================================
    /**
     * ✅ FUNCIÓN ANTIGUA - NO TOCAR
     * Obtiene configuración de pedidos web (tabla vieja)
     */
    async getOrderConfig(tenantId) {
        let config = await prisma_1.prisma.tenant_config_pedidos.findUnique({
            where: { tenant_id: tenantId }
        });
        if (!config) {
            // Crear configuración por defecto si no existe
            config = await prisma_1.prisma.tenant_config_pedidos.create({
                data: {
                    tenant_id: tenantId,
                    dias_limite_reserva: 2,
                    notif_pedido_confirmado: true,
                    notif_pedido_cancelado: true,
                    notif_pedido_listo: true,
                    email_asunto_confirmado: 'Confirmación de tu pedido',
                    email_asunto_cancelado: 'Actualización sobre tu pedido',
                    email_asunto_listo: '¡Tu pedido está listo!'
                }
            });
        }
        return config;
    },
    /**
     * ✅ FUNCIÓN ANTIGUA - NO TOCAR
     * Actualiza configuración de pedidos web (tabla vieja)
     */
    async updateOrderConfig(tenantId, configData) {
        return await prisma_1.prisma.tenant_config_pedidos.upsert({
            where: { tenant_id: tenantId },
            update: configData,
            create: {
                tenant_id: tenantId,
                ...configData
            }
        });
    },
    // ============================================================
    // FUNCIONES NUEVAS (PARA tenant_config)
    // ============================================================
    /**
     * 🆕 Obtener configuración completa del tenant
     */
    async getConfig(tenantId) {
        let config = await prisma_1.prisma.tenant_config.findUnique({
            where: { tenant_id: tenantId }
        });
        // Si no existe, crear con valores por defecto
        if (!config) {
            config = await this.createDefaultConfig(tenantId);
        }
        return config;
    },
    /**
     * 🆕 Crear configuración por defecto
     */
    async createDefaultConfig(tenantId) {
        return await prisma_1.prisma.tenant_config.create({
            data: {
                tenant_id: tenantId,
                nombre_negocio: 'Mi Restaurante',
                tipo_negocio: 'Restaurante',
                acepta_efectivo: true,
                ticket_formato: '80mm',
                tiempo_preparacion: 30,
                alertar_agotados: false,
                pedidos_online_activos: false,
                costo_delivery: 0,
                monto_minimo_pedido: 0,
                tiempo_prep_web: 30,
                pedidos_web_inicio: '08:00',
                pedidos_web_fin: '22:00',
                reservas_activas: false,
                dias_limite_reserva: 7,
                alertas_stock_bajo: false,
                nivel_alerta_stock: 10,
                fondo_caja_inicial: 100,
                alerta_diferencia_monto: 50,
                alerta_diferencia_pct: 5,
                requiere_obs_cierre: false,
                notif_stock_critico: false,
                resumen_diario_activo: false,
                resumen_diario_hora: '20:00'
            }
        });
    },
    /**
     * 🆕 Actualizar configuración (parcial)
     */
    async updateConfig(tenantId, data) {
        const existingConfig = await prisma_1.prisma.tenant_config.findUnique({
            where: { tenant_id: tenantId }
        });
        if (!existingConfig) {
            // Si no existe, crear con los datos proporcionados
            return await prisma_1.prisma.tenant_config.create({
                data: {
                    tenant_id: tenantId,
                    ...data
                }
            });
        }
        // Actualizar solo los campos proporcionados
        return await prisma_1.prisma.tenant_config.update({
            where: { tenant_id: tenantId },
            data
        });
    },
    /**
     * 🆕 Actualizar sección específica
     */
    async updateSection(tenantId, section, data) {
        return await this.updateConfig(tenantId, data);
    },
    // ============================================================
    // 🆕 FUNCIONES PARA VALIDACIONES DE PEDIDOS WEB
    // ============================================================
    /**
     * 🆕 Verificar si los pedidos online están activos
     */
    async verificarPedidosOnlineActivos(tenantId) {
        const config = await this.getConfig(tenantId);
        return config.pedidos_online_activos;
    },
    /**
     * 🆕 Verificar si está dentro del horario de pedidos web
     */
    async verificarHorarioPedidosWeb(tenantId) {
        const config = await this.getConfig(tenantId);
        const horaActual = new Date().toLocaleTimeString('es-PE', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        const horaInicio = config.pedidos_web_inicio || '00:00';
        const horaFin = config.pedidos_web_fin || '23:59';
        const dentroDeHorario = horaActual >= horaInicio && horaActual <= horaFin;
        return {
            dentroDeHorario,
            horario: { inicio: horaInicio, fin: horaFin },
            horaActual
        };
    },
    /**
     * 🆕 Calcular el tiempo estimado de preparación para un pedido
     */
    async calcularTiempoEstimado(tenantId, esWeb = false) {
        const config = await this.getConfig(tenantId);
        const minutos = esWeb ? config.tiempo_prep_web : config.tiempo_preparacion;
        const horaEstimada = new Date();
        horaEstimada.setMinutes(horaEstimada.getMinutes() + minutos);
        return {
            minutos,
            horaEstimada
        };
    },
    /**
     * 🆕 Obtener solo configuración de operaciones
     */
    async getOperacionesConfig(tenantId) {
        const config = await this.getConfig(tenantId);
        return {
            tiempo_preparacion: config.tiempo_preparacion,
            alertar_agotados: config.alertar_agotados,
        };
    },
    /**
     * 🆕 Obtener solo configuración de pedidos web
     */
    async getPedidosWebConfig(tenantId) {
        const config = await this.getConfig(tenantId);
        return {
            pedidos_online_activos: config.pedidos_online_activos,
            costo_delivery: config.costo_delivery,
            monto_minimo_pedido: config.monto_minimo_pedido,
            tiempo_prep_web: config.tiempo_prep_web,
            pedidos_web_inicio: config.pedidos_web_inicio,
            pedidos_web_fin: config.pedidos_web_fin,
            mensaje_bienvenida_web: config.mensaje_bienvenida_web,
            reservas_activas: config.reservas_activas,
            dias_limite_reserva: config.dias_limite_reserva,
        };
    },
    /**
     * 🆕 Obtener solo configuración de inventario
     */
    async getInventarioConfig(tenantId) {
        const config = await this.getConfig(tenantId);
        return {
            alertas_stock_bajo: config.alertas_stock_bajo,
            nivel_alerta_stock: config.nivel_alerta_stock,
        };
    },
    /**
     * 🆕 Obtener solo configuración de caja
     */
    async getCajaConfig(tenantId) {
        const config = await this.getConfig(tenantId);
        return {
            fondo_caja_inicial: config.fondo_caja_inicial,
            alerta_diferencia_monto: config.alerta_diferencia_monto,
            alerta_diferencia_pct: config.alerta_diferencia_pct,
            requiere_obs_cierre: config.requiere_obs_cierre,
        };
    },
    /**
     * 🆕 Obtener solo configuración de notificaciones
     */
    async getNotificacionesConfig(tenantId) {
        const config = await this.getConfig(tenantId);
        return {
            email_nuevos_pedidos: config.email_nuevos_pedidos,
            whatsapp_pedidos_listos: config.whatsapp_pedidos_listos,
            notif_stock_critico: config.notif_stock_critico,
            email_stock_critico: config.email_stock_critico,
            resumen_diario_activo: config.resumen_diario_activo,
            resumen_diario_hora: config.resumen_diario_hora,
        };
    },
    // ============================================================
    // FUNCIONES DE VALIDACIÓN
    // ============================================================
    /**
     * 🆕 Validar horarios
     */
    validateHorarios(inicio, fin) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(inicio) || !timeRegex.test(fin)) {
            return false;
        }
        const [inicioHora, inicioMin] = inicio.split(':').map(Number);
        const [finHora, finMin] = fin.split(':').map(Number);
        const inicioMinutos = inicioHora * 60 + inicioMin;
        const finMinutos = finHora * 60 + finMin;
        return finMinutos > inicioMinutos;
    },
    /**
     * 🆕 Validar datos de configuración
     */
    validateConfig(data) {
        const errors = [];
        // Validar horarios de apertura
        if (data.horario_apertura && data.horario_cierre) {
            if (!this.validateHorarios(data.horario_apertura, data.horario_cierre)) {
                errors.push('Los horarios de apertura/cierre no son válidos');
            }
        }
        // Validar horarios de pedidos web
        if (data.pedidos_web_inicio && data.pedidos_web_fin) {
            if (!this.validateHorarios(data.pedidos_web_inicio, data.pedidos_web_fin)) {
                errors.push('Los horarios de pedidos web no son válidos');
            }
        }
        // Validar montos
        if (data.costo_delivery !== undefined && data.costo_delivery < 0) {
            errors.push('El costo de delivery no puede ser negativo');
        }
        if (data.monto_minimo_pedido !== undefined && data.monto_minimo_pedido < 0) {
            errors.push('El monto mínimo no puede ser negativo');
        }
        if (data.fondo_caja_inicial !== undefined && data.fondo_caja_inicial < 0) {
            errors.push('El fondo de caja no puede ser negativo');
        }
        // Validar tiempos
        if (data.tiempo_preparacion !== undefined && (data.tiempo_preparacion < 5 || data.tiempo_preparacion > 240)) {
            errors.push('El tiempo de preparación debe estar entre 5 y 240 minutos');
        }
        // Validar formato de ticket
        if (data.ticket_formato && !['58mm', '80mm'].includes(data.ticket_formato)) {
            errors.push('El formato de ticket debe ser 58mm o 80mm');
        }
        // Validar emails
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (data.email_negocio && !emailRegex.test(data.email_negocio)) {
            errors.push('El email del negocio no es válido');
        }
        if (data.email_nuevos_pedidos && !emailRegex.test(data.email_nuevos_pedidos)) {
            errors.push('El email de notificaciones no es válido');
        }
        if (data.email_stock_critico && !emailRegex.test(data.email_stock_critico)) {
            errors.push('El email de alertas de stock no es válido');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    },
    /**
     * 🆕 Resetear configuración a valores por defecto
     */
    async resetToDefaults(tenantId) {
        return await prisma_1.prisma.tenant_config.update({
            where: { tenant_id: tenantId },
            data: {
                nombre_negocio: 'Mi Restaurante',
                logo_url: null,
                eslogan: null,
                tipo_negocio: 'Restaurante',
                acepta_efectivo: true,
                acepta_tarjeta: false,
                acepta_yape: false,
                acepta_plin: false,
                acepta_transferencia: false,
                ticket_formato: '80mm',
                ticket_mostrar_logo: true,
                ticket_copias: 1,
                tiempo_preparacion: 30,
                alertar_agotados: false,
                pedidos_online_activos: false,
                costo_delivery: 0,
                monto_minimo_pedido: 0,
                tiempo_prep_web: 30,
                pedidos_web_inicio: '08:00',
                pedidos_web_fin: '22:00',
                horario_apertura: '08:00',
                horario_cierre: '22:00',
                alertas_stock_bajo: false,
                nivel_alerta_stock: 10,
                fondo_caja_inicial: 100,
                alerta_diferencia_monto: 50,
                alerta_diferencia_pct: 5,
                requiere_obs_cierre: false,
                notif_stock_critico: false,
                resumen_diario_activo: false,
                resumen_diario_hora: '20:00'
            }
        });
    }
};
