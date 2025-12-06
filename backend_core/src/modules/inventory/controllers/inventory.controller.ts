import { Request, Response } from 'express';
import { z } from 'zod';
import { inventoryService } from '../services/inventory.service';
import { inventoryAlertsService } from '../services/inventory-alerts.service';
// Comenta o elimina las importaciones no usadas
// import { AuthRequest } from '@shared/middleware/auth.middleware';
// import { RequestWithTenant } from '@shared/middleware/tenant.middleware';

// // // // type InvRequest = AuthRequest & RequestWithTenant;

// Schemas
const createProductoSchema = z.object({
  nombre: z.string().min(1),
  categoria_inventario_id: z.number().int().positive().optional(),
  unidad_medida_id: z.number().int().positive().optional(),
  codigo_barras: z.string().optional(),
  stock_actual: z.number().min(0).default(0),
  costo_unitario: z.number().min(0).default(0),
  stock_minimo: z.number().min(0).default(0),
  stock_maximo: z.number().min(0).optional(),
});

const updateStockSchema = z.object({
    cantidad_actual: z.number().min(0),
    observaciones: z.string().optional()
});

export const inventoryController = {
    // ==================== PRODUCTOS ====================
    async getProductos(req: Request, res: Response): Promise<any> {
        try {
            const { tenantId } = req as any;
            const { categoria_id } = req.query;
            const catId = categoria_id ? parseInt(categoria_id as string) : undefined;
            
            const productos = await inventoryService.getProductos(tenantId, catId);
            return res.json(productos);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    },

    async createProducto(req: Request, res: Response): Promise<any> {
        try {
            const { tenantId } = req as any;
            const validation = createProductoSchema.safeParse(req.body);
            if (!validation.success) return res.status(400).json({ error: validation.error.issues });

            const producto = await inventoryService.createProducto(tenantId, validation.data);
            return res.status(201).json(producto);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    },

    async updateProducto(req: Request, res: Response): Promise<any> {
        try {
            const { tenantId } = req as any;
            const id = parseInt(req.params.id);
            await inventoryService.updateProducto(tenantId, id, req.body);
            const updated = await inventoryService.getProductoById(tenantId, id);
            return res.json(updated);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    },

    async actualizarStock(req: Request, res: Response): Promise<any> {
        try {
            const { tenantId, userId } = req as any;
            const id = parseInt(req.params.id);
            const validation = updateStockSchema.safeParse(req.body);
            if (!validation.success) return res.status(400).json({ error: validation.error.issues });

            const { cantidad_actual, observaciones } = validation.data;
            
            const producto = await inventoryService.getProductoById(tenantId, id);
            if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

            await inventoryService.actualizarStockManual(tenantId, id, {
                stockNuevo: cantidad_actual,
                stockAnterior: Number(producto.stock_actual),
                costoUnitario: Number(producto.costo_unitario),
                observaciones: observaciones || 'Ajuste manual',
                usuarioId: userId
            });

            // Check alerts
            if (cantidad_actual <= 0) {
                await inventoryAlertsService.verificarProductoAgotado(tenantId, id, producto.nombre, cantidad_actual);
            } else {
                await inventoryAlertsService.verificarStockBajo(tenantId);
            }

            return res.json({ success: true, message: 'Stock actualizado' });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    },

    // ==================== CATEGORIAS ====================
    async getCategorias(req: Request, res: Response): Promise<any> {
        try {
            const categorias = await inventoryService.getCategorias((req as any).tenantId);
            return res.json(categorias);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    },

    async createCategoria(req: Request, res: Response): Promise<any> {
        try {
            const categoria = await inventoryService.createCategoria((req as any).tenantId, req.body);
            return res.status(201).json(categoria);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    },

    async updateCategoria(req: Request, res: Response): Promise<any> {
        try {
            const id = parseInt(req.params.id);
            await inventoryService.updateCategoria((req as any).tenantId, id, req.body);
            return res.json({ success: true });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    },

    // ==================== UNIDADES ====================
    async getUnidades(req: Request, res: Response): Promise<any> {
        try {
            const unidades = await inventoryService.getUnidades((req as any).tenantId);
            return res.json(unidades);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    },

    async createUnidad(req: Request, res: Response): Promise<any> {
        try {
            const unidad = await inventoryService.createUnidad((req as any).tenantId, req.body);
            return res.status(201).json(unidad);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    },

    // ==================== ALERTAS & KARDEX ====================
    async getStockBajo(req: Request, res: Response): Promise<any> {
        try {
            const productos = await inventoryAlertsService.verificarStockBajo((req as any).tenantId);
            return res.json({ success: true, productos });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    },

    async getKardex(req: Request, res: Response): Promise<any> {
        try {
            const { tenantId } = req as any;
            const { producto_id, fechaInicio, fechaFin, tipo_movimiento } = req.query;
            
            const filters: any = {
                producto_id: producto_id ? parseInt(producto_id as string) : undefined,
                tipo_movimiento,
                fechaInicio: fechaInicio ? new Date(fechaInicio as string) : undefined,
                fechaFin: fechaFin ? new Date(fechaFin as string) : undefined
            };

            const kardex = await inventoryService.getKardexReport(tenantId, filters);
            return res.json(kardex);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
};