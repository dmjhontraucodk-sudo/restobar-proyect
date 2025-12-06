"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mesas_controller_1 = require("../controllers/mesas.controller");
const auth_middleware_1 = require("@shared/middleware/auth.middleware");
const tenant_middleware_1 = require("@shared/middleware/tenant.middleware");
const verifyTenantAccess_1 = require("@shared/middleware/verifyTenantAccess");
const router = (0, express_1.Router)();
// Todas las rutas de mesas requieren autenticación y verificación de tenant
router.use(auth_middleware_1.validateToken, tenant_middleware_1.tenantMiddleware, verifyTenantAccess_1.verifyTenantAccess);
router.get('/', mesas_controller_1.mesasController.getAllMesas);
router.post('/', mesas_controller_1.mesasController.createMesa);
router.patch('/:id', mesas_controller_1.mesasController.updateMesa);
router.delete('/:id', mesas_controller_1.mesasController.deleteMesa);
exports.default = router;
