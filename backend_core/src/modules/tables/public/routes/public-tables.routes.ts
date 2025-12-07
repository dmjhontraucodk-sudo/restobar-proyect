import { Router } from 'express';
import { publicTablesController } from '../controllers/public-tables.controller';

const router = Router();

// Rutas públicas - NO requieren autenticación
router.get('/disponibles', publicTablesController.getAvailableTables);
router.get('/:id', publicTablesController.getTableDetails);
router.post('/:id/call', publicTablesController.callWaiter);

export default router;