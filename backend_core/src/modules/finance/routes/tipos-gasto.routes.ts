import { Router } from 'express';
import { tiposGastoController } from '../controllers/tipos-gasto.controller';
import { validateToken } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';
import { verifyTenantAccess } from '@shared/middleware/verifyTenantAccess';

const router = Router();

// Todas las rutas de tipos de gasto requieren autenticación y verificación de tenant
router.use(validateToken, tenantMiddleware, verifyTenantAccess);

router.get('/', tiposGastoController.getAll);
router.get('/:id', tiposGastoController.getById);
router.post('/', tiposGastoController.create);
router.put('/:id', tiposGastoController.update);
router.delete('/:id', tiposGastoController.delete);

export default router;
