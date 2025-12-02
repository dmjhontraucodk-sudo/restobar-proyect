"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/web.routes.ts
const express_1 = require("express");
const web_catalog_controller_1 = require("../controller/web-catalog.controller");
const web_orders_controller_1 = require("../controller/web-orders.controller");
const reservations_controller_1 = require("../controller/auth/reservations.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const pedidos_web_flow_controller_1 = require("../controller/pedidos-web-flow.controller");
const ticket_controller_1 = require("../controller/ticket.controller");
const router = (0, express_1.Router)();
// ==================== RUTAS PÚBLICAS (Sin autenticación) ====================
// Estas rutas son accesibles por cualquier cliente en el subdominio del tenant
// 🆕 Configuración pública del tenant (horarios, monto mínimo, etc.)
router.get('/config', web_orders_controller_1.webOrdersController.getPublicConfig);
// Catálogo y productos
router.get('/catalog', web_catalog_controller_1.webCatalogController.getCatalog);
router.get('/products/search', web_catalog_controller_1.webCatalogController.searchProducts);
router.get('/products/:id', web_catalog_controller_1.webCatalogController.getProduct);
router.post('/check-availability', web_catalog_controller_1.webCatalogController.checkAvailability);
// Pedidos web (creación desde la web pública)
router.post('/orders', pedidos_web_flow_controller_1.pedidosWebFlowController.createWebOrder);
router.post('/reservations', reservations_controller_1.reservationsController.createReservation);
// Generar ticket PDF (PÚBLICO)
router.get('/orders/:numero_pedido/ticket', ticket_controller_1.generateTicket);
// ==================== RUTAS PRIVADAS (Requieren autenticación) ====================
// Estas rutas son para el panel administrativo del tenant
// Gestión de pedidos web (ADMIN)
router.get('/admin/orders', auth_middleware_1.validateToken, web_orders_controller_1.webOrdersController.getWebOrders);
router.get('/admin/orders/:id', auth_middleware_1.validateToken, web_orders_controller_1.webOrdersController.getWebOrderDetail);
router.patch('/admin/orders/:id/status', auth_middleware_1.validateToken, web_orders_controller_1.webOrdersController.updateOrderStatus);
router.post('/admin/orders/:id/convert-to-pos', auth_middleware_1.validateToken, web_orders_controller_1.webOrdersController.convertToPosOrder);
// Configuración de pedidos (ADMIN)
router.get('/admin/order-config', auth_middleware_1.validateToken, web_orders_controller_1.webOrdersController.getOrderConfig);
router.put('/admin/order-config', auth_middleware_1.validateToken, web_orders_controller_1.webOrdersController.updateOrderConfig);
// Estadísticas de pedidos (ADMIN)
router.get('/admin/orders/stats', auth_middleware_1.validateToken, web_orders_controller_1.webOrdersController.getOrderStats);
// Reservas
router.get('/mesas/disponibles', reservations_controller_1.reservationsController.getAvailableMesas);
exports.default = router;
