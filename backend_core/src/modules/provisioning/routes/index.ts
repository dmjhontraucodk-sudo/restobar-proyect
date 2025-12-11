import { Router } from 'express';
import { provisioningController } from '../controllers/provisioning.controller';
import { provisioningMiddleware } from '../middleware/provisioning.middleware';

const router = Router();

router.post(
  '/tenants',
  provisioningMiddleware,
  provisioningController.createTenant
);

export { router as provisioningRoutes };
