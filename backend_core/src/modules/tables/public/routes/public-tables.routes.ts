import { Router } from 'express';
import { publicTablesController } from '../controllers/public-tables.controller';

const router = Router();

// Rutas públicas - NO requieren autenticación
router.get('/disponibles', publicTablesController.getAvailableTables);

export default router;