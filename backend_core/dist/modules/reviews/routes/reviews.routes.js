"use strict";
// backend_core/src/modules/reviews/routes/reviews.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reviews_controller_1 = require("../controllers/reviews.controller");
// El middleware de tenant es vital para estas rutas públicas y privadas
const tenant_middleware_1 = require("@shared/middleware/tenant.middleware");
const router = (0, express_1.Router)();
// 1. Ruta pública de creación (POST /api/reviews)
router.post('/', [tenant_middleware_1.tenantMiddleware], reviews_controller_1.reviewsController.createReview);
// 2. Ruta pública de lectura (GET /api/reviews) - Para la Home Page
router.get('/public', [tenant_middleware_1.tenantMiddleware], reviews_controller_1.reviewsController.getPublicReviews);
exports.default = router;
