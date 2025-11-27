// backend/src/services/inventory-alerts.service.ts
// ✅ 100% CORRECTO según schema.prisma real

import { prisma } from '../lib/prisma';
import { tenantConfigService } from './tenant-config.service';
import { notificationService } from './notification.service';

function toNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (value && typeof value.toNumber === 'function') return value.toNumber();
  return Number(value) || 0;
}

export const inventoryAlertsService = {
  /**
   * Verificar si un producto está agotado y enviar alerta
   */
  async verificarProductoAgotado(
    tenantId: number,
    productoInventarioId: number,
    nombreProducto: string,
    stockActual: number
  ) {
    try {
      const config = await tenantConfigService.getOperacionesConfig(tenantId);
      
      if (!config.alertar_agotados) {
        console.log('ℹ️ [INVENTARIO] Alertas de agotados desactivadas');
        return;
      }

      if (stockActual <= 0) {
        console.log(`⚠️ [INVENTARIO] Producto agotado: ${nombreProducto}`);
        
        await notificationService.notificarProductoAgotado(tenantId, {
          nombre: nombreProducto,
          stockActual: stockActual
        });
      }
    } catch (error) {
      console.error('❌ [INVENTARIO] Error al verificar producto agotado:', error);
    }
  },

  /**
   * Verificar todos los productos con stock bajo
   */
  async verificarStockBajo(tenantId: number) {
    try {
      const config = await tenantConfigService.getInventarioConfig(tenantId);
      
      if (!config.alertas_stock_bajo) {
        console.log('ℹ️ [INVENTARIO] Alertas de stock bajo desactivadas');
        return [];
      }

      const nivelAlerta = toNumber(config.nivel_alerta_stock);

      // productos_inventario tiene stock_actual directamente
      const productosStockBajo = await prisma.productos_inventario.findMany({
        where: {
          tenant_id: tenantId,
          stock_actual: {
            lte: nivelAlerta,
            gt: 0
          },
          activo: true
        }
      });

      if (productosStockBajo.length > 0) {
        console.log(`⚠️ [INVENTARIO] ${productosStockBajo.length} productos con stock bajo`);
        
        const productosFormateados = productosStockBajo.map((item: any) => ({
          nombre: item.nombre,
          stockActual: toNumber(item.stock_actual),
          nivelAlerta: nivelAlerta,
          unidadMedida: 'unidades'
        }));

        await notificationService.notificarStockBajo(tenantId, productosFormateados);
        
        return productosFormateados;
      }

      console.log('✅ [INVENTARIO] Todos los productos tienen stock suficiente');
      return [];
    } catch (error) {
      console.error('❌ [INVENTARIO] Error al verificar stock bajo:', error);
      return [];
    }
  },

  /**
   * Verificar disponibilidad de items para un pedido
   */
  async verificarDisponibilidadPedido(
    tenantId: number,
    items: Array<{ producto_id: number; cantidad: number; nombre?: string }>
  ): Promise<{
    disponible: boolean;
    productosAgotados: string[];
    productosInsuficientes: Array<{ nombre: string; disponible: number; requerido: number }>;
  }> {
    const config = await tenantConfigService.getOperacionesConfig(tenantId);
    
    const productosAgotados: string[] = [];
    const productosInsuficientes: Array<{ nombre: string; disponible: number; requerido: number }> = [];

    for (const item of items) {
      // productos tiene producto_inventario_id
      const productoMenu = await prisma.productos.findUnique({
        where: { id: item.producto_id },
        include: {
          producto_inventario: true // Relación singular
        }
      });

      if (productoMenu?.producto_inventario) {
        const stockActual = toNumber(productoMenu.producto_inventario.stock_actual);
        const cantidadRequerida = item.cantidad;
        const nombreProducto = item.nombre || productoMenu.nombre;

        if (stockActual <= 0) {
          productosAgotados.push(nombreProducto);
          
          if (config.alertar_agotados) {
            await this.verificarProductoAgotado(
              tenantId,
              productoMenu.producto_inventario.id,
              nombreProducto,
              stockActual
            );
          }
        } else if (stockActual < cantidadRequerida) {
          productosInsuficientes.push({
            nombre: nombreProducto,
            disponible: stockActual,
            requerido: cantidadRequerida
          });
        }
      }
    }

    return {
      disponible: productosAgotados.length === 0 && productosInsuficientes.length === 0,
      productosAgotados,
      productosInsuficientes
    };
  },

  /**
   * Descontar inventario después de una venta
   */
  async descontarInventario(
    tenantId: number,
    items: Array<{ producto_id: number; cantidad: number }>,
    empleadoId: number,
    referencia: string
  ) {
    console.log(`📦 [INVENTARIO] Descontando inventario para: ${referencia}`);
    
    for (const item of items) {
      // Buscar producto del menú con su inventario
      const productoMenu = await prisma.productos.findUnique({
        where: { id: item.producto_id },
        include: {
          producto_inventario: true // Relación singular
        }
      });

      if (!productoMenu?.producto_inventario) {
        console.log(`⚠️ [INVENTARIO] Producto ${item.producto_id} no tiene inventario asociado`);
        continue;
      }

      const productoInventario = productoMenu.producto_inventario;
      const stockAnterior = toNumber(productoInventario.stock_actual);
      const cantidadDescontar = item.cantidad;
      const stockNuevo = Math.max(0, stockAnterior - cantidadDescontar);

      // Actualizar stock en productos_inventario
      await prisma.productos_inventario.update({
        where: { id: productoInventario.id },
        data: {
          stock_actual: stockNuevo,
          stock_anterior: stockAnterior, // ✅ Campo existe en schema
          ultimo_conteo: new Date()
        }
      });

      // Registrar en Kardex - ⭐ CAMPOS CORRECTOS SEGÚN SCHEMA
      await prisma.kardex.create({
        data: {
          tenant_id: tenantId,
          producto_inventario_id: productoInventario.id,
          tipo_movimiento: 'Salida',
          motivo: 'Venta',
          cantidad: cantidadDescontar,
          costo_unitario: toNumber(productoInventario.costo_unitario),
          valor_total: toNumber(productoInventario.costo_unitario) * cantidadDescontar,
          saldo_cantidad: stockNuevo, // ✅ Campo correcto
          saldo_valor: toNumber(productoInventario.costo_unitario) * stockNuevo, // ✅ Campo correcto
          documento_tipo: 'Pedido',
          observaciones: `Venta - ${productoMenu.nombre} - ${referencia}`,
          usuario_id: empleadoId
        }
      });

      console.log(`✅ [INVENTARIO] ${productoMenu.nombre}: ${stockAnterior} → ${stockNuevo}`);

      // Verificar si quedó con stock bajo o agotado
      const config = await tenantConfigService.getInventarioConfig(tenantId);
      
      if (stockNuevo <= 0) {
        await this.verificarProductoAgotado(
          tenantId,
          productoInventario.id,
          productoMenu.nombre,
          stockNuevo
        );
      } else if (config.alertas_stock_bajo && stockNuevo <= toNumber(config.nivel_alerta_stock)) {
        await this.verificarStockBajo(tenantId);
      }
    }

    console.log(`✅ [INVENTARIO] Descuento completado para: ${referencia}`);
  }
};