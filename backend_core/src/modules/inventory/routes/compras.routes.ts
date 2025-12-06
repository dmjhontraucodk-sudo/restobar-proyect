import { Router } from 'express';
import { comprasController } from '../controllers/compras.controller';
import { validateToken } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';
import { verifyTenantAccess } from '@shared/middleware/verifyTenantAccess';

const router = Router();

router.use(validateToken, tenantMiddleware, verifyTenantAccess);

router.get('/', comprasController.getAll);
router.get('/:id', comprasController.getById);
router.post('/', comprasController.create);
router.put('/:id', comprasController.update);
router.delete('/:id', comprasController.delete);
router.post('/:id/receive', comprasController.receiveCompra);

export default router;
