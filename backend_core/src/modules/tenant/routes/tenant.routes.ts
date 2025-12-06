import { Router } from 'express';
import { tenantConfigController } from '../controllers/tenant-config.controller';
import { validateToken } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';
import { verifyTenantAccess } from '@shared/middleware/verifyTenantAccess';

const router = Router();

router.use(validateToken, tenantMiddleware, verifyTenantAccess);

router.get('/config', tenantConfigController.getConfig);
router.put('/config', tenantConfigController.updateConfig);
router.put('/config/:section', tenantConfigController.updateSection);
router.post('/config/reset', tenantConfigController.resetConfig);

export default router;
