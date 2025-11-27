// backend/src/services/notification.service.ts
// Servicio centralizado para notificaciones (emails, alertas, etc.)

import { Resend } from 'resend';
import { tenantConfigService } from './tenant-config.service';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface ProductoAgotado {
  nombre: string;
  stockActual: number;
}

export interface ProductoStockBajo {
  nombre: string;
  stockActual: number;
  nivelAlerta: number;
  unidadMedida: string;
}

export const notificationService = {
  /**
   * Obtener email destino con jerarquía correcta
   */
  obtenerEmailDestino(config: any, tipo: 'pedidos' | 'stock' | 'resumen'): string | null {
    // Para PEDIDOS: email_nuevos_pedidos -> email_negocio
    if (tipo === 'pedidos') {
      return config.email_nuevos_pedidos || config.email_negocio;
    }
    
    // Para STOCK: email_stock_critico -> email_nuevos_pedidos -> email_negocio
    if (tipo === 'stock') {
      return config.email_stock_critico || config.email_nuevos_pedidos || config.email_negocio;
    }
    
    // Para RESUMEN: email_nuevos_pedidos -> email_negocio
    if (tipo === 'resumen') {
      return config.email_nuevos_pedidos || config.email_negocio;
    }
    
    return config.email_negocio;
  },

  /**
   * Notificar nuevo pedido web al restaurante
   */
  async notificarNuevoPedidoWeb(
    tenantId: number,
    pedido: {
      numero_pedido: string;
      cliente_nombre: string;
      total: number;
      tipo_pedido: string;
    }
  ) {
    try {
      const config = await tenantConfigService.getConfig(tenantId);
      
      // ✅ JERARQUÍA PARA PEDIDOS: email_nuevos_pedidos -> email_negocio
      const emailDestino = this.obtenerEmailDestino(config, 'pedidos');
      
      if (!emailDestino) {
        console.log('ℹ️ [NOTIF] Email para pedidos no configurado');
        return;
      }

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: emailDestino,
        subject: `🆕 Nuevo Pedido Web #${pedido.numero_pedido}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Nuevo Pedido Recibido</h2>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Pedido:</strong> #${pedido.numero_pedido}</p>
              <p><strong>Cliente:</strong> ${pedido.cliente_nombre}</p>
              <p><strong>Total:</strong> S/ ${pedido.total.toFixed(2)}</p>
              <p><strong>Tipo:</strong> ${pedido.tipo_pedido === 'EntregaDomicilio' ? '🚚 Delivery' : '🏪 Recojo en tienda'}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              Revisa el pedido completo en el Dashboard → Pedidos Web
            </p>
          </div>
        `
      });

      console.log(`✅ [NOTIF] Email de nuevo pedido enviado a: ${emailDestino}`);
    } catch (error) {
      console.error('❌ [NOTIF] Error al enviar email de nuevo pedido:', error);
      throw error;
    }
  },

  /**
   * Notificar producto agotado
   */
  async notificarProductoAgotado(
    tenantId: number,
    producto: ProductoAgotado
  ) {
    try {
      const config = await tenantConfigService.getConfig(tenantId);
      
      if (!config.alertar_agotados) {
        console.log('ℹ️ [NOTIF] Alertas de agotados desactivadas');
        return;
      }

      // ✅ JERARQUÍA PARA STOCK: email_stock_critico -> email_nuevos_pedidos -> email_negocio
      const emailDestino = this.obtenerEmailDestino(config, 'stock');
      
      if (!emailDestino) {
        console.log('ℹ️ [NOTIF] Email para alertas de stock no configurado');
        return;
      }

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: emailDestino,
        subject: `⚠️ Producto Agotado: ${producto.nombre}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">⚠️ Producto Agotado</h2>
            <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0;">
              <p><strong>Producto:</strong> ${producto.nombre}</p>
              <p><strong>Stock Actual:</strong> ${producto.stockActual}</p>
            </div>
            <p style="color: #6b7280;">
              Por favor, reabastecer lo antes posible para evitar ventas perdidas.
            </p>
          </div>
        `
      });

      console.log(`✅ [NOTIF] Email de producto agotado enviado a ${emailDestino}`);
    } catch (error) {
      console.error('❌ [NOTIF] Error al enviar alerta de producto agotado:', error);
      throw error;
    }
  },

  /**
   * Notificar productos con stock bajo
   */
  async notificarStockBajo(
    tenantId: number,
    productos: ProductoStockBajo[]
  ) {
    try {
      const config = await tenantConfigService.getConfig(tenantId);
      
      if (!config.alertas_stock_bajo) {
        console.log('ℹ️ [NOTIF] Alertas de stock bajo desactivadas');
        return;
      }

      // ✅ JERARQUÍA PARA STOCK: email_stock_critico -> email_nuevos_pedidos -> email_negocio
      const emailDestino = this.obtenerEmailDestino(config, 'stock');
      
      if (!emailDestino) {
        console.log('ℹ️ [NOTIF] Email para alertas de stock no configurado');
        return;
      }

      if (productos.length === 0) {
        return;
      }

      const listaProductos = productos
        .map(p => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px; text-align: left;">${p.nombre}</td>
            <td style="padding: 12px; text-align: center;">${p.stockActual} ${p.unidadMedida}</td>
            <td style="padding: 12px; text-align: center;">${p.nivelAlerta} ${p.unidadMedida}</td>
          </tr>
        `)
        .join('');

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: emailDestino,
        subject: `📦 Alerta: ${productos.length} Producto(s) con Stock Bajo`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">📦 Productos con Stock Bajo</h2>
            <p>Los siguientes productos están por debajo del nivel de alerta configurado:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <thead>
                <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                  <th style="padding: 12px; text-align: left;">Producto</th>
                  <th style="padding: 12px; text-align: center;">Stock Actual</th>
                  <th style="padding: 12px; text-align: center;">Nivel Alerta</th>
                </tr>
              </thead>
              <tbody>
                ${listaProductos}
              </tbody>
            </table>
            <p style="color: #6b7280; font-size: 14px;">
              Considera reabastecer estos productos para mantener operaciones normales.
            </p>
          </div>
        `
      });

      console.log(`✅ [NOTIF] Email de stock bajo enviado a ${emailDestino}: ${productos.length} productos`);
    } catch (error) {
      console.error('❌ [NOTIF] Error al enviar alerta de stock bajo:', error);
      throw error;
    }
  },

  /**
   * Enviar resumen diario de ventas
   */
  async enviarResumenDiario(
    tenantId: number,
    estadisticas: {
      pedidos_totales: number;
      ventas_totales: number;
      ticket_promedio: number;
      pedidos_por_tipo: {
        pos: number;
        web: number;
      };
    }
  ) {
    try {
      const config = await tenantConfigService.getConfig(tenantId);
      
      if (!config.resumen_diario_activo) {
        console.log('ℹ️ [NOTIF] Resumen diario desactivado');
        return;
      }

      // ✅ JERARQUÍA PARA RESUMEN: email_nuevos_pedidos -> email_negocio
      const emailDestino = this.obtenerEmailDestino(config, 'resumen');
      
      if (!emailDestino) {
        console.log('ℹ️ [NOTIF] Email para resumen diario no configurado');
        return;
      }

      const fecha = new Date().toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: emailDestino,
        subject: `📊 Resumen Diario - ${fecha}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">📊 Resumen del Día</h2>
            <p style="color: #6b7280;">${fecha}</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="background: white; padding: 15px; border-radius: 6px; text-align: center;">
                  <p style="color: #6b7280; margin: 0; font-size: 14px;">Pedidos Totales</p>
                  <p style="color: #1f2937; margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">
                    ${estadisticas.pedidos_totales}
                  </p>
                </div>
                
                <div style="background: white; padding: 15px; border-radius: 6px; text-align: center;">
                  <p style="color: #6b7280; margin: 0; font-size: 14px;">Ventas Totales</p>
                  <p style="color: #10b981; margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">
                    S/ ${estadisticas.ventas_totales.toFixed(2)}
                  </p>
                </div>
                
                <div style="background: white; padding: 15px; border-radius: 6px; text-align: center;">
                  <p style="color: #6b7280; margin: 0; font-size: 14px;">Ticket Promedio</p>
                  <p style="color: #1f2937; margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">
                    S/ ${estadisticas.ticket_promedio.toFixed(2)}
                  </p>
                </div>
                
                <div style="background: white; padding: 15px; border-radius: 6px; text-align: center;">
                  <p style="color: #6b7280; margin: 0; font-size: 14px;">POS / Web</p>
                  <p style="color: #1f2937; margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">
                    ${estadisticas.pedidos_por_tipo.pos} / ${estadisticas.pedidos_por_tipo.web}
                  </p>
                </div>
              </div>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Este resumen se envía automáticamente todos los días a las ${config.resumen_diario_hora || '20:00'}
            </p>
          </div>
        `
      });

      console.log(`✅ [NOTIF] Resumen diario enviado a ${emailDestino}`);
    } catch (error) {
      console.error('❌ [NOTIF] Error al enviar resumen diario:', error);
      throw error;
    }
  }
};