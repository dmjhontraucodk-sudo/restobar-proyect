// backend/src/controller/inventory.controller.ts

import { Request, Response } from 'express';
import { inventoryAlertsService } from '../services/inventory-alerts.service';
import { prisma } from '../lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

interface AuthRequest extends Request {
  user?: {
    id: number;
    tenant_id: number;
    email: string;
    rol_id: number;
  };
}

// ✅ Función mejorada que maneja valores null
function toNumber(value: number | Decimal | null): number {
  if (value === null) return 0;
  if (typeof value === 'number') return value;
  return value.toNumber();
}

// ✅ Función para manejar valores null de manera segura
function safeToNumber(value: number | Decimal | null, defaultValue: number = 0): number {
  if (value === null) return defaultValue;
  if (typeof value === 'number') return value;
  return value.toNumber();
}

export const inventoryController = {
  /**
   * Verificar stock bajo manualmente
   */
  async verificarStockBajo(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;

      if (!tenantId) {
        return res.status(403).json({ error: 'Acceso no autorizado' });
      }

      console.log(`🔍 [INVENTARIO] Verificando stock bajo para tenant: ${tenantId}`);

      const productosStockBajo = await inventoryAlertsService.verificarStockBajo(tenantId);

      res.json({
        success: true,
        message: productosStockBajo.length > 0
          ? `Se encontraron ${productosStockBajo.length} productos con stock bajo`
          : 'Todos los productos tienen stock suficiente',
        productos: productosStockBajo,
        count: productosStockBajo.length
      });
    } catch (error) {
      console.error('Error en verificarStockBajo:', error);
      res.status(500).json({
        success: false,
        error: 'Error al verificar stock bajo'
      });
    }
  },

  /**
   * Obtener productos con stock crítico
   */
  async getProductosStockCritico(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;

      if (!tenantId) {
        return res.status(403).json({ error: 'Acceso no autorizado' });
      }

      // Productos agotados (stock <= 0)
      const productosAgotados = await prisma.productos_inventario.findMany({
        where: {
          tenant_id: tenantId,
          stock_actual: {
            lte: 0
          },
          activo: true
        }
      });

      // Productos con stock bajo
      const productosStockBajo = await prisma.productos_inventario.findMany({
        where: {
          tenant_id: tenantId,
          stock_actual: {
            gt: 0,
            lte: 10
          },
          activo: true
        }
      });

      res.json({
        success: true,
        productos_agotados: productosAgotados.map((p: any) => ({
          id: p.id,
          nombre: p.nombre,
          stock: safeToNumber(p.stock_actual),
          costo_unitario: safeToNumber(p.costo_unitario)
        })),
        productos_stock_bajo: productosStockBajo.map((p: any) => ({
          id: p.id,
          nombre: p.nombre,
          stock: safeToNumber(p.stock_actual),
          stock_minimo: safeToNumber(p.stock_minimo, 10) // Usar 10 como valor por defecto para stock_minimo
        })),
        count_agotados: productosAgotados.length,
        count_stock_bajo: productosStockBajo.length
      });
    } catch (error) {
      console.error('Error en getProductosStockCritico:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener productos con stock crítico'
      });
    }
  },

  /**
   * Verificar disponibilidad para un pedido
   */
  async verificarDisponibilidad(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const { items } = req.body;

      if (!tenantId) {
        return res.status(403).json({ error: 'Acceso no autorizado' });
      }

      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Items requeridos' });
      }

      const resultado = await inventoryAlertsService.verificarDisponibilidadPedido(
        tenantId,
        items
      );

      if (!resultado.disponible) {
        return res.status(400).json({
          success: false,
          error: 'STOCK_INSUFICIENTE',
          message: 'Algunos productos no tienen suficiente stock',
          productos_agotados: resultado.productosAgotados,
          productos_insuficientes: resultado.productosInsuficientes
        });
      }

      res.json({
        success: true,
        message: 'Todos los productos tienen stock suficiente',
        disponible: true
      });
    } catch (error) {
      console.error('Error en verificarDisponibilidad:', error);
      res.status(500).json({
        success: false,
        error: 'Error al verificar disponibilidad'
      });
    }
  },

  /**
   * Actualizar stock manualmente (con alertas)
   */
  async actualizarStock(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const empleadoId = req.user?.id;
      const { producto_inventario_id } = req.params;
      const { cantidad_actual, observaciones } = req.body;

      if (!tenantId || !empleadoId) {
        return res.status(403).json({ error: 'Acceso no autorizado' });
      }

      const productoInvId = parseInt(producto_inventario_id);

      if (isNaN(productoInvId)) {
        return res.status(400).json({ error: 'ID de producto inventario inválido' });
      }

      // Obtener producto_inventario actual
      const productoInventario = await prisma.productos_inventario.findUnique({
        where: { id: productoInvId }
      });

      if (!productoInventario || productoInventario.tenant_id !== tenantId) {
        return res.status(404).json({ error: 'Producto de inventario no encontrado' });
      }

      const stockAnterior = safeToNumber(productoInventario.stock_actual);
      const stockNuevo = Number(cantidad_actual);
      const costoUnitario = safeToNumber(productoInventario.costo_unitario);

      // Actualizar stock
      const productoActualizado = await prisma.productos_inventario.update({
        where: { id: productoInvId },
        data: { 
          stock_actual: stockNuevo,
          stock_anterior: stockAnterior,
          ultimo_conteo: new Date()
        }
      });

      // Registrar en Kardex
      const tipoMovimiento = stockNuevo > stockAnterior ? 'Entrada' : 'Salida';
      const cantidad = Math.abs(stockNuevo - stockAnterior);

      await prisma.kardex.create({
        data: {
          tenant_id: tenantId,
          producto_inventario_id: productoInvId,
          tipo_movimiento: tipoMovimiento,
          motivo: 'Ajuste Manual',
          cantidad,
          costo_unitario: costoUnitario,
          valor_total: costoUnitario * cantidad,
          saldo_cantidad: stockNuevo,
          saldo_valor: costoUnitario * stockNuevo,
          documento_tipo: 'AjusteManual',
          observaciones: observaciones || 'Actualización manual de stock',
          usuario_id: empleadoId
        }
      });

      // Verificar alertas
      if (stockNuevo <= 0) {
        await inventoryAlertsService.verificarProductoAgotado(
          tenantId,
          productoInvId,
          productoInventario.nombre,
          stockNuevo
        );
      } else {
        await inventoryAlertsService.verificarStockBajo(tenantId);
      }

      res.json({
        success: true,
        message: 'Stock actualizado correctamente',
        producto: productoActualizado,
        stock_anterior: stockAnterior,
        stock_nuevo: stockNuevo
      });
    } catch (error) {
      console.error('Error en actualizarStock:', error);
      res.status(500).json({
        success: false,
        error: 'Error al actualizar stock'
      });
    }
  }
};