// backend_core/src/modules/reviews/routes/reviews.routes.ts

import { Router } from 'express';
import { reviewsController } from '../controllers/reviews.controller';
// El middleware de tenant es vital para estas rutas públicas y privadas
import { tenantMiddleware } from '@shared/middleware/tenant.middleware'; 

const router = Router();

// 1. Ruta pública de creación (POST /api/reviews)
router.post('/', [tenantMiddleware], reviewsController.createReview); 

// 2. Ruta pública de lectura (GET /api/reviews) - Para la Home Page
router.get('/public', [tenantMiddleware], reviewsController.getPublicReviews); 

export default router;