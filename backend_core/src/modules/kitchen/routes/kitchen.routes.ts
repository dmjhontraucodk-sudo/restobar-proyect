import { Router } from 'express';
import { kitchenController } from '../controllers/kitchen.controller';
import { validateToken } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';
import { verifyTenantAccess } from '@shared/middleware/verifyTenantAccess';

const router = Router();

// Middleware global (Autenticación + Tenant + Acceso)
router.use(validateToken, tenantMiddleware, verifyTenantAccess);

router.get('/pedidos', kitchenController.getPedidosCocina);
router.patch('/pedidos/:id/estado', kitchenController.updateEstadoPedido);

export default router;
