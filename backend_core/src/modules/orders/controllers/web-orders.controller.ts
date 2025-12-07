import { Response } from 'express';
import { webOrdersService, webpedidos_estado } from '../services/web-orders.service';
import { emailService } from '@core/email/email.service';
import { cierrePosService } from '../../orders/services/cierre-pos.service';
// Comenta o elimina esta línea:
// import { notificationService } from '@core/notifications/notification.service';
import { pagos_metodo_pago } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { AuthRequest } from '@shared/middleware/auth.middleware';
import { RequestWithTenant } from '@shared/middleware/tenant.middleware';

type OrderRequest = AuthRequest & RequestWithTenant;

function toNumber(value: number | Decimal): number {
  if (typeof value === 'number') return value;
  return value.toNumber();
}

export const webOrdersController = {
  
  async getWebOrders(req: OrderRequest, res: Response): Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      const { estado } = req.query;

      if (!tenantId) {
        return res.status(403).json({ error: 'Acceso no autorizado' });
      }

      const filters: { estado?: webpedidos_estado } = {};
      if (estado && typeof estado === 'string' && webOrdersService.isValidOrderStatus(estado)) {
        filters.estado = estado as webpedidos_estado;
      }

      const orders = await webOrdersService.getWebOrdersByTenant(tenantId, filters);

      return res.json({
        success: true,
        orders,
        count: orders.length
      });
    } catch (error: any) {
      console.error('Error en getWebOrders:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor al obtener pedidos' 
      });
    }
  },

  async getWebOrderDetail(req: OrderRequest, res: Response): Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      const orderId = parseInt(req.params.id);

      if (!tenantId) {
        return res.status(403).json({ error: 'Acceso no autorizado' });
      }

      const order = await webOrdersService.getWebOrderById(tenantId, orderId);

      if (!order) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      return res.json({
        success: true,
        order
      });
    } catch (error: any) {
      console.error('Error en getWebOrderDetail:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor al obtener el pedido' 
      });
    }
  },

  async updateOrderStatus(req: OrderRequest, res: Response): Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      const empleadoId = req.user?.id;
      const orderId = parseInt(req.params.id);
      const { nuevo_estado, razon_cancelacion } = req.body;

      if (!tenantId) return res.status(403).json({ error: 'Acceso no autorizado' });
      if (!empleadoId) return res.status(401).json({ error: 'Usuario no identificado' });

      if (!nuevo_estado) return res.status(400).json({ error: 'Nuevo estado requerido' });

      if (!webOrdersService.isValidOrderStatus(nuevo_estado)) {
        return res.status(400).json({ 
          error: 'Estado inválido',
          estados_validos: Object.values(webpedidos_estado)
        });
      }

      // Lógica de caja y cobro, y descuento de inventario solo cuando se ENTREGA
      if (nuevo_estado === webpedidos_estado.Entregado) {
        const cajaAbierta = await cierrePosService.verificarCajaAbierta(tenantId, empleadoId);
        
        if (!cajaAbierta) {
          return res.status(400).json({ 
            success: false,
            error: 'No se puede marcar como Entregado',
            message: 'Debe haber una caja abierta para finalizar pedidos web.',
            codigo: 'CAJA_NO_ABIERTA',
            accion_requerida: 'Abrir Caja'
          });
        }

        try {
          const pedidoParaCaja = await webOrdersService.getWebOrderById(tenantId, orderId);
          
          if (!pedidoParaCaja) return res.status(404).json({ error: 'Pedido no encontrado' });

          const metodoPago: pagos_metodo_pago = pagos_metodo_pago.Efectivo; // Asumiendo efectivo por defecto para cobro admin
          const montoTotal = toNumber(pedidoParaCaja.total);

          await cierrePosService.registrarVentaEnCaja({
            tenantId,
            empleadoId,
            ordenId: orderId,
            monto: montoTotal,
            metodoPago: metodoPago,
            tipoDocumento: 'WebPedido'
          });
          console.log(`✅ Venta registrada en caja para pedido ${orderId}`);

        } catch (cajaError: any) {
          return res.status(500).json({ 
            success: false,
            error: 'Error al registrar la venta en caja',
            details: cajaError.message
          });
        }

        // ✅ Descuento de inventario aquí, para productos "cerrados" (con ID)
        try {
          await webOrdersService.processInventoryDeduction(tenantId, orderId, empleadoId);
          console.log(`✅ Inventario descontado para pedido ${orderId} (estado: Entregado)`);
        } catch (invError: any) {
          console.error(`❌ Error al descontar inventario para pedido ${orderId}:`, invError.message);
          return res.status(500).json({ 
            success: false,
            error: 'Error al descontar el inventario para el pedido.',
            details: invError.message
          });
        }
      }

      const updatedOrder = await webOrdersService.updateOrderStatus(
        tenantId, 
        orderId, 
        nuevo_estado as webpedidos_estado
      );

      const tenantConfig = await webOrdersService.getOrderConfig(tenantId);
      if (updatedOrder.cliente_email) {
        try {
          switch (nuevo_estado) {
            case webpedidos_estado.Confirmado:
              if (tenantConfig.notif_pedido_confirmado) {
                await emailService.sendOrderConfirmation(updatedOrder, tenantConfig);
              }
              break;
            case webpedidos_estado.Cancelado:
              if (tenantConfig.notif_pedido_cancelado) {
                await emailService.sendOrderCancellation(updatedOrder, tenantConfig, razon_cancelacion);
              }
              break;
            case webpedidos_estado.ListoParaRecoger:
              if (tenantConfig.notif_pedido_listo) {
                await emailService.sendOrderReady(updatedOrder, tenantConfig);
              }
              break;
          }
        } catch (emailError) {
          console.error('⚠️ Error al enviar email (no crítico):', emailError);
        }
      }

      return res.json({
        success: true,
        message: `Estado del pedido actualizado a ${nuevo_estado}`,
        order: updatedOrder
      });

    } catch (error: any) {
      console.error('❌ Error en updateOrderStatus:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message || 'Error interno del servidor al actualizar el estado' 
      });
    }
  },

  async convertToPosOrder(req: OrderRequest, res: Response): Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      const empleadoId = req.user?.id;
      const orderId = parseInt(req.params.id);

      if (!tenantId || !empleadoId) {
        return res.status(403).json({ error: 'Acceso no autorizado' });
      }

      const posOrder = await webOrdersService.convertToPosOrder(
        tenantId, 
        orderId, 
        empleadoId
      );

      return res.json({
        success: true,
        message: 'Pedido convertido a orden POS exitosamente',
        posOrder
      });
    } catch (error: any) {
      console.error('Error en convertToPosOrder:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message || 'Error interno del servidor al convertir el pedido' 
      });
    }
  },

  async assignMotorized(req: OrderRequest, res: Response): Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      const orderId = parseInt(req.params.id);
      const { motorizado_id } = req.body;

      if (!tenantId) return res.status(403).json({ error: 'Acceso no autorizado' });
      if (!motorizado_id) return res.status(400).json({ error: 'ID de motorizado requerido' });

      const order = await webOrdersService.assignMotorized(tenantId, orderId, parseInt(motorizado_id));

      return res.json({
        success: true,
        message: 'Motorizado asignado correctamente',
        order
      });
    } catch (error: any) {
      console.error('Error en assignMotorized:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message || 'Error al asignar motorizado' 
      });
    }
  },

  async getOrderConfig(req: OrderRequest, res: Response): Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;

      if (!tenantId) {
        return res.status(403).json({ error: 'Acceso no autorizado' });
      }

      const config = await webOrdersService.getOrderConfig(tenantId);

      return res.json({
        success: true,
        config
      });
    } catch (error: any) {
      console.error('Error en getOrderConfig:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor al obtener configuración' 
      });
    }
  },

  async updateOrderConfig(req: OrderRequest, res: Response): Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      const configData = req.body;

      if (!tenantId) {
        return res.status(403).json({ error: 'Acceso no autorizado' });
      }

      const updatedConfig = await webOrdersService.updateOrderConfig(tenantId, configData);

      return res.json({
        success: true,
        message: 'Configuración actualizada exitosamente',
        config: updatedConfig
      });
    } catch (error: any) {
      console.error('Error en updateOrderConfig:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor al actualizar configuración' 
      });
    }
  },

  async getOrderStats(req: OrderRequest, res: Response): Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;

      if (!tenantId) {
        return res.status(403).json({ error: 'Acceso no autorizado' });
      }

      const stats = await webOrdersService.getOrderStats(tenantId);

      return res.json({
        success: true,
        stats
      });
    } catch (error: any) {
      console.error('Error en getOrderStats:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor al obtener estadísticas' 
      });
    }
  }
};