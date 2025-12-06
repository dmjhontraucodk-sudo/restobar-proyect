"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inventory_controller_1 = require("../controllers/inventory.controller");
const cierre_inventario_controller_1 = require("../controllers/cierre-inventario.controller");
const auth_middleware_1 = require("@shared/middleware/auth.middleware");
const tenant_middleware_1 = require("@shared/middleware/tenant.middleware");
const verifyTenantAccess_1 = require("@shared/middleware/verifyTenantAccess");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.validateToken, tenant_middleware_1.tenantMiddleware, verifyTenantAccess_1.verifyTenantAccess);
// Productos
router.get('/productos', inventory_controller_1.inventoryController.getProductos);
router.post('/productos', inventory_controller_1.inventoryController.createProducto);
router.put('/productos/:id', inventory_controller_1.inventoryController.updateProducto);
router.patch('/productos/:id/stock', inventory_controller_1.inventoryController.actualizarStock);
// Categorías
router.get('/categorias', inventory_controller_1.inventoryController.getCategorias);
router.post('/categorias', inventory_controller_1.inventoryController.createCategoria);
router.put('/categorias/:id', inventory_controller_1.inventoryController.updateCategoria);
// Unidades
router.get('/unidades', inventory_controller_1.inventoryController.getUnidades);
router.post('/unidades', inventory_controller_1.inventoryController.createUnidad);
// Alertas & Kardex
router.get('/stock-bajo', inventory_controller_1.inventoryController.getStockBajo);
router.get('/kardex', inventory_controller_1.inventoryController.getKardex);
// Cierres
router.get('/cierres', cierre_inventario_controller_1.cierreInventarioController.getAll);
router.get('/cierres/:id', cierre_inventario_controller_1.cierreInventarioController.getById);
router.post('/cierres', cierre_inventario_controller_1.cierreInventarioController.create);
router.put('/cierres/:id', cierre_inventario_controller_1.cierreInventarioController.update);
router.post('/cierres/:id/finalizar', cierre_inventario_controller_1.cierreInventarioController.finalizar);
router.get('/cierres/:id/estadisticas', cierre_inventario_controller_1.cierreInventarioController.getEstadisticas);
exports.default = router;
