"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reservations_controller_1 = require("../controllers/reservations.controller");
const auth_middleware_1 = require("@shared/middleware/auth.middleware");
const tenant_middleware_1 = require("@shared/middleware/tenant.middleware");
const router = (0, express_1.Router)();
// Rutas Públicas (Requieren identificación del tenant por subdominio/header)
router.post('/', tenant_middleware_1.tenantMiddleware, reservations_controller_1.reservationsController.createReservation);
router.get('/mesas/disponibles', tenant_middleware_1.tenantMiddleware, reservations_controller_1.reservationsController.getAvailableMesas);
// Rutas Privadas (Dashboard)
router.get('/', auth_middleware_1.validateToken, reservations_controller_1.reservationsController.getReservations);
router.patch('/:id/status', auth_middleware_1.validateToken, reservations_controller_1.reservationsController.updateReservationStatus);
exports.default = router;
