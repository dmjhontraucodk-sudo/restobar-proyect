import { Router } from 'express';
import { reservationsController } from '../controllers/reservations.controller';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';

const router = Router();

// Rutas Públicas
router.use(tenantMiddleware);
router.post('/', reservationsController.createReservation);
router.get('/mesas/disponibles', reservationsController.getAvailableMesas);

export default router;
