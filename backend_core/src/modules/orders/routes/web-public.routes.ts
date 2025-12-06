import { Router } from 'express';
import { pedidosWebFlowController } from '../controllers/pedidos-web-flow.controller';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';

const router = Router();

// Public flow (requires tenant identification but no user auth)
router.use(tenantMiddleware);

router.get('/config', pedidosWebFlowController.getPublicConfig);
router.post('/', pedidosWebFlowController.createWebOrder);

export default router;
