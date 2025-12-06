"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const kitchen_controller_1 = require("../controllers/kitchen.controller");
const auth_middleware_1 = require("@shared/middleware/auth.middleware");
const tenant_middleware_1 = require("@shared/middleware/tenant.middleware");
const verifyTenantAccess_1 = require("@shared/middleware/verifyTenantAccess");
const router = (0, express_1.Router)();
// Middleware global (Autenticación + Tenant + Acceso)
router.use(auth_middleware_1.validateToken, tenant_middleware_1.tenantMiddleware, verifyTenantAccess_1.verifyTenantAccess);
router.get('/pedidos', kitchen_controller_1.kitchenController.getPedidosCocina);
router.patch('/pedidos/:id/estado', kitchen_controller_1.kitchenController.updateEstadoPedido);
exports.default = router;
