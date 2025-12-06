import { Router } from 'express';
import { posOrdersController } from '../controllers/pos-orders.controller';
import { webReadyOrdersController } from '../controllers/web-ready-orders.controller';
import { cierrePosController } from '../controllers/cierre-pos.controller';
import { validateToken } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';
import { verifyTenantAccess } from '@shared/middleware/verifyTenantAccess';

const router = Router();

router.use(validateToken, tenantMiddleware, verifyTenantAccess);

// POS Orders
router.get('/', posOrdersController.getOrdenes);
router.post('/', posOrdersController.createOrden);
router.patch('/:id/estado', posOrdersController.updateOrdenEstado);
router.post('/:id/items', posOrdersController.addItemsToOrden);
router.patch('/:id/cierre', cierrePosController.closeOrder);
router.get('/mesas', posOrdersController.getMesasConOrdenes);

// Web Ready Orders (Para la pantalla de despacho/repartidor)
router.get('/web-ready', webReadyOrdersController.getReadyOrders);
router.patch('/web-ready/:id/status', webReadyOrdersController.updateStatus);

export default router;
