import { Response } from 'express';
import { pedidosWebFlowService } from '../services/pedidos-web-flow.service';
import { tenantConfigService } from '@modules/tenant/services/tenant-config.service';
import { notificationService } from '@core/notifications/notification.service';
import { emailService } from '@core/email/email.service';
import { clientsService } from '@modules/clients';
import { webOrdersService } from '../services/web-orders.service';
import { Decimal } from '@prisma/client/runtime/library';
import { RequestWithTenant } from '@shared/middleware/tenant.middleware';

function toNumber(value: number | Decimal): number {
  if (typeof value === 'number') return value;
  return value.toNumber();
}

export const pedidosWebFlowController = {
  async createWebOrder(req: RequestWithTenant, res: Response) : Promise<any> {
    try {
      const tenant = req.tenant;
      
      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: 'Tenant no encontrado'
        });
      }

      const tenantId = tenant.id;
      const { 
        cliente_nombre, 
        cliente_email, 
        cliente_telefono,
        tipo_documento,
        documento_identidad,
        tipo_pedido,
        direccion_entrega,
        instrucciones_entrega,
        notas_especiales,
        items,
        subtotal
      } = req.body;

      console.log(`
🌐 [WEB-PEDIDO] Nuevo pedido web para tenant: ${tenant.subdominio}`);

      if (!cliente_nombre || !cliente_telefono || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Datos incompletos: nombre, teléfono y productos son requeridos'
        });
      }

      if (tipo_pedido === 'EntregaDomicilio' && !direccion_entrega) {
        return res.status(400).json({
          success: false,
          error: 'Dirección de entrega requerida para delivery'
        });
      }

      const activo = await tenantConfigService.verificarPedidosOnlineActivos(tenantId);
      
      if (!activo) {
        console.log(`❌ [WEB-PEDIDO] Pedidos online desactivados`);
        return res.status(403).json({
          success: false,
          error: 'PEDIDOS_WEB_DESACTIVADOS',
          message: 'Los pedidos online están temporalmente desactivados. Por favor, intenta más tarde.'
        });
      }

      const horarioCheck = await tenantConfigService.verificarHorarioPedidosWeb(tenantId);
      
      if (!horarioCheck.dentroDeHorario) {
        console.log(`❌ [WEB-PEDIDO] Fuera de horario: ${horarioCheck.horaActual}`);
        return res.status(403).json({
          success: false,
          error: 'FUERA_DE_HORARIO',
          message: `Horario de atención: ${horarioCheck.horario.inicio} - ${horarioCheck.horario.fin}`,
          horario: horarioCheck.horario,
          hora_actual: horarioCheck.horaActual
        });
      }

      const config = await tenantConfigService.getPedidosWebConfig(tenantId);
      const montoMinimo = toNumber(config.monto_minimo_pedido);
      
      const subtotalNumero = Number(subtotal) || 0;
      
      if (subtotalNumero < montoMinimo) {
        return res.status(400).json({
          success: false,
          error: 'MONTO_MINIMO_NO_ALCANZADO',
          message: `El monto mínimo de pedido es S/ ${montoMinimo.toFixed(2)}`,
          monto_minimo: montoMinimo,
          monto_actual: subtotalNumero,
          faltante: montoMinimo - subtotalNumero
        });
      }

      const costoEnvio = tipo_pedido === 'EntregaDomicilio' 
        ? toNumber(config.costo_delivery)
        : 0;
      
      const total = subtotalNumero + costoEnvio;

      const tiempoEstimado = await tenantConfigService.calcularTiempoEstimado(tenantId, true);

      // Buscar o crear el cliente y obtener su ID
      const cliente_id = await clientsService.findOrCreateClient(tenantId, {
        nombre: cliente_nombre,
        cliente_email,
        cliente_telefono,
        tipo_documento,
        documento_identidad,
      });

      const newOrder = await pedidosWebFlowService.crearWebPedido(tenantId, {
        cliente_id, // Pasar el ID del cliente
        cliente_nombre,
        cliente_email,
        cliente_telefono,
        tipo_documento,
        documento_identidad,
        tipo_pedido,
        direccion_entrega,
        instrucciones_entrega,
        notas_especiales,
        items,
        subtotal: subtotalNumero,
        costo_envio: costoEnvio,
        total,
      });

      const configNotif = await tenantConfigService.getNotificacionesConfig(tenantId);
      
      if (configNotif.email_nuevos_pedidos) {
        try {
          await notificationService.notificarNuevoPedidoWeb(tenantId, {
            numero_pedido: newOrder.numero_pedido,
            cliente_nombre: newOrder.cliente_nombre,
            total: toNumber(newOrder.total),
            tipo_pedido: newOrder.tipo_pedido
          });
        } catch (emailError) {
          console.error('⚠️ Error al enviar email (no crítico):', emailError);
        }
      }

      const tenantConfig = await webOrdersService.getOrderConfig(tenantId);
      
      if (tenantConfig.notif_pedido_confirmado && cliente_email) {
        try {
          await emailService.sendOrderConfirmation(newOrder, tenantConfig);
        } catch (emailError) {
          console.error('Error al enviar email de confirmación:', emailError);
        }
      }

      res.status(201).json({
        success: true,
        message: 'Pedido creado exitosamente',
        order: newOrder,
        tiempo_estimado: {
          minutos: tiempoEstimado.minutos,
          hora_estimada: tiempoEstimado.horaEstimada
        }
      });

    } catch (error: any) {
      console.error('❌ [WEB-PEDIDO] Error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error interno del servidor al crear el pedido'
      });
    }
  },

  async getPublicConfig(req: RequestWithTenant, res: Response) : Promise<any> {
    try {
      const tenant = req.tenant;
      
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant no encontrado' });
      }

      const config = await tenantConfigService.getPedidosWebConfig(tenant.id);
      const horarioCheck = await tenantConfigService.verificarHorarioPedidosWeb(tenant.id);

      res.json({
        success: true,
        config: {
          pedidos_activos: config.pedidos_online_activos,
          horario: horarioCheck.horario,
          dentro_de_horario: horarioCheck.dentroDeHorario,
          monto_minimo: toNumber(config.monto_minimo_pedido),
          costo_delivery: toNumber(config.costo_delivery),
          tiempo_preparacion: config.tiempo_prep_web,
          mensaje_bienvenida: config.mensaje_bienvenida_web,
          reservas_activas: config.reservas_activas,
          dias_limite_reserva: config.dias_limite_reserva
        }
      });
    } catch (error) {
      console.error('Error en getPublicConfig:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener configuración'
      });
    }
  }
};
