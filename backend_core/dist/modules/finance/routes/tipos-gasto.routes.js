"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tipos_gasto_controller_1 = require("../controllers/tipos-gasto.controller");
const auth_middleware_1 = require("@shared/middleware/auth.middleware");
const tenant_middleware_1 = require("@shared/middleware/tenant.middleware");
const verifyTenantAccess_1 = require("@shared/middleware/verifyTenantAccess");
const router = (0, express_1.Router)();
// Todas las rutas de tipos de gasto requieren autenticación y verificación de tenant
router.use(auth_middleware_1.validateToken, tenant_middleware_1.tenantMiddleware, verifyTenantAccess_1.verifyTenantAccess);
router.get('/', tipos_gasto_controller_1.tiposGastoController.getAll);
router.get('/:id', tipos_gasto_controller_1.tiposGastoController.getById);
router.post('/', tipos_gasto_controller_1.tiposGastoController.create);
router.put('/:id', tipos_gasto_controller_1.tiposGastoController.update);
router.delete('/:id', tipos_gasto_controller_1.tiposGastoController.delete);
exports.default = router;
