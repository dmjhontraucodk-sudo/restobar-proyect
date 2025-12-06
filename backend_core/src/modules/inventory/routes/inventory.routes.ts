import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller';
import { cierreInventarioController } from '../controllers/cierre-inventario.controller';
import { validateToken } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';
import { verifyTenantAccess } from '@shared/middleware/verifyTenantAccess';

const router = Router();

router.use(validateToken, tenantMiddleware, verifyTenantAccess);

// Productos
router.get('/productos', inventoryController.getProductos);
router.post('/productos', inventoryController.createProducto);
router.put('/productos/:id', inventoryController.updateProducto);
router.patch('/productos/:id/stock', inventoryController.actualizarStock);

// Categorías
router.get('/categorias', inventoryController.getCategorias);
router.post('/categorias', inventoryController.createCategoria);
router.put('/categorias/:id', inventoryController.updateCategoria);

// Unidades
router.get('/unidades', inventoryController.getUnidades);
router.post('/unidades', inventoryController.createUnidad);

// Alertas & Kardex
router.get('/stock-bajo', inventoryController.getStockBajo);
router.get('/kardex', inventoryController.getKardex);

// Cierres
router.get('/cierres', cierreInventarioController.getAll);
router.get('/cierres/:id', cierreInventarioController.getById);
router.post('/cierres', cierreInventarioController.create);
router.put('/cierres/:id', cierreInventarioController.update);
router.post('/cierres/:id/finalizar', cierreInventarioController.finalizar);
router.get('/cierres/:id/estadisticas', cierreInventarioController.getEstadisticas);

export default router;
