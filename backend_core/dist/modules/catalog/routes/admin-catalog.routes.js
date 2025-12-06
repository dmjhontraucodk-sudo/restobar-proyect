"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_catalog_controller_1 = require("../controllers/admin-catalog.controller");
const auth_middleware_1 = require("@shared/middleware/auth.middleware");
const tenant_middleware_1 = require("@shared/middleware/tenant.middleware");
const verifyTenantAccess_1 = require("@shared/middleware/verifyTenantAccess");
const router = (0, express_1.Router)();
// Middleware de seguridad para todas las rutas administrativas
router.use(auth_middleware_1.validateToken, tenant_middleware_1.tenantMiddleware, verifyTenantAccess_1.verifyTenantAccess);
// Categorías
router.get('/categories', admin_catalog_controller_1.adminCatalogController.getCategories);
router.post('/categories', admin_catalog_controller_1.adminCatalogController.createCategory);
router.put('/categories/:id', admin_catalog_controller_1.adminCatalogController.updateCategory); // Algunos frontends usan PUT
router.patch('/categories/:id', admin_catalog_controller_1.adminCatalogController.updateCategory); // Otros PATCH
router.delete('/categories/:id', admin_catalog_controller_1.adminCatalogController.deleteCategory);
// Productos
router.get('/products', admin_catalog_controller_1.adminCatalogController.getProducts);
router.get('/products/:id', admin_catalog_controller_1.adminCatalogController.getProductById);
router.post('/products', admin_catalog_controller_1.adminCatalogController.createProduct);
router.put('/products/:id', admin_catalog_controller_1.adminCatalogController.updateProduct);
router.patch('/products/:id', admin_catalog_controller_1.adminCatalogController.updateProduct);
router.delete('/products/:id', admin_catalog_controller_1.adminCatalogController.deleteProduct);
exports.default = router;
