// src/controller/web-orders.controller.ts
import { Request, Response } from 'express';
import { webOrdersService, webpedidos_estado } from '../services/web-orders.service';
import { emailService } from '../services/email.service';

interface AuthRequest extends Request {
  user?: {
    id: number;
    tenant_id: number;
    email: string;
    rol_id: number;
  };
  tenant?: {
    id: number;
    subdominio: string;
    configuracion: any;
  };
}

export const webOrdersController = {
  // Obtener todos los pedidos web del tenant (ADMIN)
  async getWebOrders(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const { estado } = req.query;

      if (!tenantId) {
        return res.status(403).json({ error: 'Acceso no autorizado' });
      }

      // Validar y convertir el estado si viene como query param
      const filters: { estado?: webpedidos_estado } = {};
      if (estado && typeof estado === 'string' && webOrdersService.isValidOrderStatus(estado)) {
        filters.estado = estado as webpedidos_estado;
      }

      const orders = await webOrdersService.getWebOrdersByTenant(tenantId, filters);

      res.json({
        success: true,
        orders,
        count: orders.length
      });
    } catch (error) {
      console.error('Error en getWebOrders:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor al obtener pedidos' 
      });
    }
  },

  // Obtener detalle de pedido específico (ADMIN)
  async getWebOrderDetail(req: AuthRequest, res: Response) {
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

      res.json({
        success: true,
        order
      });
    } catch (error) {
      console.error('Error en getWebOrderDetail:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor al obtener el pedido' 
      });
    }
  },

  // Crear pedido desde la web pública (PÚBLICO)
  async createWebOrder(req: Request, res: Response) {
    try {
      const tenant = (req as any).tenant;
      
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant no encontrado' });
      }

      const { 
        cliente_nombre, 
        cliente_email, 
        cliente_telefono, 
        tipo_pedido,
        direccion_entrega,
        instrucciones_entrega,
        hora_programada,
        notas_especiales,
        notas, 
        items 
      } = req.body;

      // Validaciones básicas
      if (!cliente_nombre || !cliente_telefono || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ 
          error: 'Datos incompletos: nombre, teléfono y al menos un producto son requeridos' 
        });
      }

      if (tipo_pedido === 'EntregaDomicilio' && !direccion_entrega) {
        return res.status(400).json({ 
          error: 'Dirección de entrega requerida para entrega a domicilio' 
        });
      }

      // Crear pedido
      const newOrder = await webOrdersService.createWebOrder(tenant.id, {
        cliente_nombre,
        cliente_email,
        cliente_telefono,
        tipo_pedido,
        direccion_entrega,
        instrucciones_entrega,
        hora_programada,
        notas_especiales,
        notas,
        items
      });

      // Obtener configuración para notificaciones
      const tenantConfig = await webOrdersService.getOrderConfig(tenant.id);
      
      // Enviar email de confirmación si está habilitado
      if (tenantConfig.notif_pedido_confirmado && cliente_email) {
        try {
          await emailService.sendOrderConfirmation(newOrder, tenantConfig);
        } catch (emailError) {
          console.error('Error al enviar email de confirmación:', emailError);
          // No fallar el pedido si el email falla
        }
      }

      res.status(201).json({
        success: true,
        message: 'Pedido creado exitosamente',
        order: newOrder
      });
    } catch (error: any) {
      console.error('Error en createWebOrder:', error);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Error interno del servidor al crear el pedido' 
      });
    }
  },

  // Cambiar estado del pedido (ADMIN)
  async updateOrderStatus(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const orderId = parseInt(req.params.id);
      const { nuevo_estado, razon_cancelacion } = req.body;

      if (!tenantId) {
        return res.status(403).json({ error: 'Acceso no autorizado' });
      }

      if (!nuevo_estado) {
        return res.status(400).json({ error: 'Nuevo estado requerido' });
      }

      // Validar que el estado sea válido
      if (!webOrdersService.isValidOrderStatus(nuevo_estado)) {
        return res.status(400).json({ 
          error: 'Estado inválido',
          estados_validos: Object.values(webpedidos_estado)
        });
      }

      const updatedOrder = await webOrdersService.updateOrderStatus(
        tenantId, 
        orderId, 
        nuevo_estado as webpedidos_estado
      );

      // Obtener configuración para notificaciones
      const tenantConfig = await webOrdersService.getOrderConfig(tenantId);

      // Enviar notificaciones según el estado
      if (updatedOrder.cliente_email) {
        try {
          switch (nuevo_estado) {
            case 'Confirmado':
              if (tenantConfig.notif_pedido_confirmado) {
                await emailService.sendOrderConfirmation(updatedOrder, tenantConfig);
              }
              break;
            case 'Cancelado':
              if (tenantConfig.notif_pedido_cancelado) {
                await emailService.sendOrderCancellation(updatedOrder, tenantConfig, razon_cancelacion);
              }
              break;
            case 'ListoParaRecoger':
              if (tenantConfig.notif_pedido_listo) {
                await emailService.sendOrderReady(updatedOrder, tenantConfig);
              }
              break;
          }
        } catch (emailError) {
          console.error('Error al enviar notificación por email:', emailError);
          // No fallar la actualización si el email falla
        }
      }

      res.json({
        success: true,
        message: `Estado del pedido actualizado a ${nuevo_estado}`,
        order: updatedOrder
      });
    } catch (error: any) {
      console.error('Error en updateOrderStatus:', error);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Error interno del servidor al actualizar el estado' 
      });
    }
  },

  // Convertir pedido web a orden POS (ADMIN)
  async convertToPosOrder(req: AuthRequest, res: Response) {
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

      res.json({
        success: true,
        message: 'Pedido convertido a orden POS exitosamente',
        posOrder
      });
    } catch (error: any) {
      console.error('Error en convertToPosOrder:', error);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Error interno del servidor al convertir el pedido' 
      });
    }
  },

  // Obtener configuración de pedidos (ADMIN)
  async getOrderConfig(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;

      if (!tenantId) {
        return res.status(403).json({ error: 'Acceso no autorizado' });
      }

      const config = await webOrdersService.getOrderConfig(tenantId);

      res.json({
        success: true,
        config
      });
    } catch (error) {
      console.error('Error en getOrderConfig:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor al obtener configuración' 
      });
    }
  },

  // Actualizar configuración de pedidos (ADMIN)
  async updateOrderConfig(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const configData = req.body;

      if (!tenantId) {
        return res.status(403).json({ error: 'Acceso no autorizado' });
      }

      const updatedConfig = await webOrdersService.updateOrderConfig(tenantId, configData);

      res.json({
        success: true,
        message: 'Configuración actualizada exitosamente',
        config: updatedConfig
      });
    } catch (error) {
      console.error('Error en updateOrderConfig:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor al actualizar configuración' 
      });
    }
  },

  // Obtener estadísticas de pedidos (ADMIN)
  async getOrderStats(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;

      if (!tenantId) {
        return res.status(403).json({ error: 'Acceso no autorizado' });
      }

      const stats = await webOrdersService.getOrderStats(tenantId);

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error en getOrderStats:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor al obtener estadísticas' 
      });
    }
  }
};