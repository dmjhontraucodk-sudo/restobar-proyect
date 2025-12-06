"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pedidos_web_flow_controller_1 = require("../controllers/pedidos-web-flow.controller");
const tenant_middleware_1 = require("@shared/middleware/tenant.middleware");
const router = (0, express_1.Router)();
// Public flow (requires tenant identification but no user auth)
router.use(tenant_middleware_1.tenantMiddleware);
router.get('/config', pedidos_web_flow_controller_1.pedidosWebFlowController.getPublicConfig);
router.post('/', pedidos_web_flow_controller_1.pedidosWebFlowController.createWebOrder);
exports.default = router;
