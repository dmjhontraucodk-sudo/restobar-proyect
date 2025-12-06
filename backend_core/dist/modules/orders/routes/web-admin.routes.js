"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const web_orders_controller_1 = require("../controllers/web-orders.controller");
const auth_middleware_1 = require("@shared/middleware/auth.middleware");
const tenant_middleware_1 = require("@shared/middleware/tenant.middleware");
const verifyTenantAccess_1 = require("@shared/middleware/verifyTenantAccess");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.validateToken, tenant_middleware_1.tenantMiddleware, verifyTenantAccess_1.verifyTenantAccess);
// Gestión de pedidos web (ADMIN)
router.get('/list', web_orders_controller_1.webOrdersController.getWebOrders);
router.get('/:id', web_orders_controller_1.webOrdersController.getWebOrderDetail);
router.patch('/:id/status', web_orders_controller_1.webOrdersController.updateOrderStatus);
router.post('/:id/convert-to-pos', web_orders_controller_1.webOrdersController.convertToPosOrder);
// Configuración de pedidos (ADMIN)
router.get('/config', web_orders_controller_1.webOrdersController.getOrderConfig);
router.put('/config', web_orders_controller_1.webOrdersController.updateOrderConfig);
// Estadísticas de pedidos (ADMIN)
router.get('/stats', web_orders_controller_1.webOrdersController.getOrderStats);
exports.default = router;
