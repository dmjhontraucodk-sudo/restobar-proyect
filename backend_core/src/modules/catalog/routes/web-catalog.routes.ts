import { Router } from 'express';
import { webCatalogController } from '../controllers/web-catalog.controller';

const router = Router();

// Ruta pública - NO requiere autenticación
// Solo requiere tenantMiddleware (ya aplicado en app.ts)
router.get('/', webCatalogController.getCatalog);
router.get('/products/search', webCatalogController.searchProducts);
router.get('/products/:id', webCatalogController.getProductById);
router.post('/check-availability', webCatalogController.checkAvailability);

export default router;