import { Router } from 'express';
import { reservationsController } from '../controllers/reservations.controller';
import { validateToken } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';
import { verifyTenantAccess } from '@shared/middleware/verifyTenantAccess';

const router = Router();

// Rutas Privadas (Dashboard)
router.use(validateToken, tenantMiddleware, verifyTenantAccess);
router.get('/', reservationsController.getReservations);
router.patch('/:id/status', reservationsController.updateReservationStatus);

export default router;
