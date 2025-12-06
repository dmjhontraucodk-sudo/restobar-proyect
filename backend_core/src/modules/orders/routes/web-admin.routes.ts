import { Router } from 'express';
import { webOrdersController } from '../controllers/web-orders.controller';
import { validateToken } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';
import { verifyTenantAccess } from '@shared/middleware/verifyTenantAccess';

const router = Router();

router.use(validateToken, tenantMiddleware, verifyTenantAccess);

// Gestión de pedidos web (ADMIN)
router.get('/list', webOrdersController.getWebOrders);
router.get('/:id', webOrdersController.getWebOrderDetail);
router.patch('/:id/status', webOrdersController.updateOrderStatus);
router.post('/:id/convert-to-pos', webOrdersController.convertToPosOrder);

// Configuración de pedidos (ADMIN)
router.get('/config', webOrdersController.getOrderConfig);
router.put('/config', webOrdersController.updateOrderConfig);

// Estadísticas de pedidos (ADMIN)
router.get('/stats', webOrdersController.getOrderStats);

export default router;
