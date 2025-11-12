// src/services/tenant-config.service.ts
import { prisma } from '../lib/prisma';

export const tenantConfigService = {
  async getOrderConfig(tenantId: number) {
    let config = await prisma.tenant_config_pedidos.findUnique({
      where: { tenant_id: tenantId }
    });

    if (!config) {
      // Crear configuración por defecto si no existe
      config = await prisma.tenant_config_pedidos.create({
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

  async updateOrderConfig(tenantId: number, configData: any) {
    return await prisma.tenant_config_pedidos.upsert({
      where: { tenant_id: tenantId },
      update: configData,
      create: {
        tenant_id: tenantId,
        ...configData
      }
    });
  }
};