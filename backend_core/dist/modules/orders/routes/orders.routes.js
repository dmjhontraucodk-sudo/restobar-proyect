"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pos_orders_controller_1 = require("../controllers/pos-orders.controller");
const web_ready_orders_controller_1 = require("../controllers/web-ready-orders.controller");
const auth_middleware_1 = require("@shared/middleware/auth.middleware");
const tenant_middleware_1 = require("@shared/middleware/tenant.middleware");
const verifyTenantAccess_1 = require("@shared/middleware/verifyTenantAccess");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.validateToken, tenant_middleware_1.tenantMiddleware, verifyTenantAccess_1.verifyTenantAccess);
// POS Orders
router.get('/', pos_orders_controller_1.posOrdersController.getOrdenes);
router.post('/', pos_orders_controller_1.posOrdersController.createOrden);
router.patch('/:id/estado', pos_orders_controller_1.posOrdersController.updateOrdenEstado);
router.post('/:id/items', pos_orders_controller_1.posOrdersController.addItemsToOrden);
router.get('/mesas', pos_orders_controller_1.posOrdersController.getMesasConOrdenes);
// Web Ready Orders (Para la pantalla de despacho/repartidor)
router.get('/web-ready', web_ready_orders_controller_1.webReadyOrdersController.getReadyOrders);
router.patch('/web-ready/:id/status', web_ready_orders_controller_1.webReadyOrdersController.updateStatus);
exports.default = router;
