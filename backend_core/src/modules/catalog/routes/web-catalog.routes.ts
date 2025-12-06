import { Router } from 'express';
import { webCatalogController } from '../controllers/web-catalog.controller';

const router = Router();

// Ruta pública - NO requiere autenticación
// Solo requiere tenantMiddleware (ya aplicado en app.ts)
router.get('/', webCatalogController.getCatalog);

export default router;