import { Router } from 'express';
import { reservationsController } from '../controllers/reservations.controller';
import { validateToken } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';

const router = Router();

// Rutas Públicas (Requieren identificación del tenant por subdominio/header)
router.post('/', tenantMiddleware, reservationsController.createReservation);
router.get('/mesas/disponibles', tenantMiddleware, reservationsController.getAvailableMesas);

// Rutas Privadas (Dashboard)
router.get('/', validateToken, reservationsController.getReservations);
router.patch('/:id/status', validateToken, reservationsController.updateReservationStatus);

export default router;
