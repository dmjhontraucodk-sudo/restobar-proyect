import { Router } from 'express';
import { adminCatalogController } from '../controllers/admin-catalog.controller';
import { validateToken } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';
import { verifyTenantAccess } from '@shared/middleware/verifyTenantAccess';

const router = Router();

// Middleware de seguridad para todas las rutas administrativas
router.use(validateToken, tenantMiddleware, verifyTenantAccess);

// Categorías
router.get('/categories', adminCatalogController.getCategories);
router.post('/categories', adminCatalogController.createCategory);
router.put('/categories/:id', adminCatalogController.updateCategory); // Algunos frontends usan PUT
router.patch('/categories/:id', adminCatalogController.updateCategory); // Otros PATCH
router.delete('/categories/:id', adminCatalogController.deleteCategory);

// Productos
router.get('/products', adminCatalogController.getProducts);
router.get('/products/:id', adminCatalogController.getProductById);
router.post('/products', adminCatalogController.createProduct);
router.put('/products/:id', adminCatalogController.updateProduct);
router.patch('/products/:id', adminCatalogController.updateProduct);
router.delete('/products/:id', adminCatalogController.deleteProduct);

export default router;
