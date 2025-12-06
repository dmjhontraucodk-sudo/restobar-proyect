"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryController = void 0;
const zod_1 = require("zod");
const inventory_service_1 = require("../services/inventory.service");
const inventory_alerts_service_1 = require("../services/inventory-alerts.service");
// Comenta o elimina las importaciones no usadas
// import { AuthRequest } from '@shared/middleware/auth.middleware';
// import { RequestWithTenant } from '@shared/middleware/tenant.middleware';
// // // // type InvRequest = AuthRequest & RequestWithTenant;
// Schemas
const createProductoSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1),
    categoria_inventario_id: zod_1.z.number().int().positive().optional(),
    unidad_medida_id: zod_1.z.number().int().positive().optional(),
    codigo_barras: zod_1.z.string().optional(),
    stock_actual: zod_1.z.number().min(0).default(0),
    costo_unitario: zod_1.z.number().min(0).default(0),
    stock_minimo: zod_1.z.number().min(0).default(0),
    stock_maximo: zod_1.z.number().min(0).optional(),
});
const updateStockSchema = zod_1.z.object({
    cantidad_actual: zod_1.z.number().min(0),
    observaciones: zod_1.z.string().optional()
});
exports.inventoryController = {
    // ==================== PRODUCTOS ====================
    async getProductos(req, res) {
        try {
            const { tenantId } = req;
            const { categoria_id } = req.query;
            const catId = categoria_id ? parseInt(categoria_id) : undefined;
            const productos = await inventory_service_1.inventoryService.getProductos(tenantId, catId);
            return res.json(productos);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    },
    async createProducto(req, res) {
        try {
            const { tenantId } = req;
            const validation = createProductoSchema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).json({ error: validation.error.issues });
            const producto = await inventory_service_1.inventoryService.createProducto(tenantId, validation.data);
            return res.status(201).json(producto);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    },
    async updateProducto(req, res) {
        try {
            const { tenantId } = req;
            const id = parseInt(req.params.id);
            await inventory_service_1.inventoryService.updateProducto(tenantId, id, req.body);
            const updated = await inventory_service_1.inventoryService.getProductoById(tenantId, id);
            return res.json(updated);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    },
    async actualizarStock(req, res) {
        try {
            const { tenantId, userId } = req;
            const id = parseInt(req.params.id);
            const validation = updateStockSchema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).json({ error: validation.error.issues });
            const { cantidad_actual, observaciones } = validation.data;
            const producto = await inventory_service_1.inventoryService.getProductoById(tenantId, id);
            if (!producto)
                return res.status(404).json({ error: 'Producto no encontrado' });
            await inventory_service_1.inventoryService.actualizarStockManual(tenantId, id, {
                stockNuevo: cantidad_actual,
                stockAnterior: Number(producto.stock_actual),
                costoUnitario: Number(producto.costo_unitario),
                observaciones: observaciones || 'Ajuste manual',
                usuarioId: userId
            });
            // Check alerts
            if (cantidad_actual <= 0) {
                await inventory_alerts_service_1.inventoryAlertsService.verificarProductoAgotado(tenantId, id, producto.nombre, cantidad_actual);
            }
            else {
                await inventory_alerts_service_1.inventoryAlertsService.verificarStockBajo(tenantId);
            }
            return res.json({ success: true, message: 'Stock actualizado' });
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    },
    // ==================== CATEGORIAS ====================
    async getCategorias(req, res) {
        try {
            const categorias = await inventory_service_1.inventoryService.getCategorias(req.tenantId);
            return res.json(categorias);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    },
    async createCategoria(req, res) {
        try {
            const categoria = await inventory_service_1.inventoryService.createCategoria(req.tenantId, req.body);
            return res.status(201).json(categoria);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    },
    async updateCategoria(req, res) {
        try {
            const id = parseInt(req.params.id);
            await inventory_service_1.inventoryService.updateCategoria(req.tenantId, id, req.body);
            return res.json({ success: true });
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    },
    // ==================== UNIDADES ====================
    async getUnidades(req, res) {
        try {
            const unidades = await inventory_service_1.inventoryService.getUnidades(req.tenantId);
            return res.json(unidades);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    },
    async createUnidad(req, res) {
        try {
            const unidad = await inventory_service_1.inventoryService.createUnidad(req.tenantId, req.body);
            return res.status(201).json(unidad);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    },
    // ==================== ALERTAS & KARDEX ====================
    async getStockBajo(req, res) {
        try {
            const productos = await inventory_alerts_service_1.inventoryAlertsService.verificarStockBajo(req.tenantId);
            return res.json({ success: true, productos });
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    },
    async getKardex(req, res) {
        try {
            const { tenantId } = req;
            const { producto_id, fechaInicio, fechaFin, tipo_movimiento } = req.query;
            const filters = {
                producto_id: producto_id ? parseInt(producto_id) : undefined,
                tipo_movimiento,
                fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
                fechaFin: fechaFin ? new Date(fechaFin) : undefined
            };
            const kardex = await inventory_service_1.inventoryService.getKardexReport(tenantId, filters);
            return res.json(kardex);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
};
