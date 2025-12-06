import { Router } from 'express';
import { mesasController } from '../controllers/mesas.controller';
import { validateToken } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';
import { verifyTenantAccess } from '@shared/middleware/verifyTenantAccess';

const router = Router();

// Todas las rutas de mesas requieren autenticación y verificación de tenant
router.use(validateToken, tenantMiddleware, verifyTenantAccess);

router.get('/', mesasController.getAllMesas);
router.post('/', mesasController.createMesa);
router.patch('/:id', mesasController.updateMesa);
router.delete('/:id', mesasController.deleteMesa);

export default router;
