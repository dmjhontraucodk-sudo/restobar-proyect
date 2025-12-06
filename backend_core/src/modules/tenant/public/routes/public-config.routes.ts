import { Router } from 'express';
import { publicConfigController } from '../controllers/public-config.controller';

const router = Router();

// Ruta pública - NO requiere autenticación
router.get('/', publicConfigController.getPublicConfig);

export default router; // ✅ DEBE TENER ESTA LÍNEA