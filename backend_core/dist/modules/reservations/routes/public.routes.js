"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reservations_controller_1 = require("../controllers/reservations.controller");
const tenant_middleware_1 = require("@shared/middleware/tenant.middleware");
const router = (0, express_1.Router)();
// Rutas Públicas
router.use(tenant_middleware_1.tenantMiddleware);
router.post('/', reservations_controller_1.reservationsController.createReservation);
router.get('/mesas/disponibles', reservations_controller_1.reservationsController.getAvailableMesas);
exports.default = router;
