"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantConfigService = void 0;
// src/services/tenant-config.service.ts
const prisma_1 = require("../lib/prisma");
exports.tenantConfigService = {
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
    async updateOrderConfig(tenantId, configData) {
        return await prisma_1.prisma.tenant_config_pedidos.upsert({
            where: { tenant_id: tenantId },
            update: configData,
            create: {
                tenant_id: tenantId,
                ...configData
            }
        });
    }
};
