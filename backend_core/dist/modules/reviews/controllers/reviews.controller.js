"use strict";
// backend_core/src/modules/reviews/controllers/reviews.controller.ts (CORRECCIÓN)
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewsController = void 0;
const create_review_dto_1 = require("../dto/create-review.dto");
const reviews_service_1 = require("../services/reviews.service");
exports.reviewsController = {
    async createReview(req, res) {
        try {
            const tenantId = req.tenant?.id;
            if (!tenantId) {
                return res.status(403).json({ error: 'Tenant no identificado.' });
            }
            const validation = create_review_dto_1.createReviewSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Datos de reseña inválidos',
                    details: validation.error.issues
                });
            }
            const dto = validation.data;
            const result = await reviews_service_1.reviewsService.createReview(tenantId, dto);
            return res.status(201).json({ success: true, ...result }); // ✅ Asegurar el return en la ruta de éxito
        }
        catch (error) {
            console.error('Error en createReview:', error);
            if (error.message.includes('Ya existe una reseña')) {
                return res.status(409).json({ error: error.message }); // ✅ Asegurar el return
            }
            // ✅ Asegurar el return en el caso de error general
            return res.status(500).json({ error: error.message || 'Error interno del servidor al crear la reseña.' });
        }
    },
    async getPublicReviews(req, res) {
        try {
            const tenantId = req.tenant?.id;
            if (!tenantId) {
                return res.status(403).json({ error: 'Tenant no identificado.' });
            }
            // Obtiene las últimas 5 reseñas aprobadas (límite por defecto)
            const reviews = await reviews_service_1.reviewsService.getPublicReviews(tenantId);
            return res.json({ success: true, data: reviews }); // ✅ Asegurar el return en la ruta de éxito
        }
        catch (error) {
            console.error('Error en getPublicReviews:', error);
            // ✅ Asegurar el return en el catch
            return res.status(500).json({ error: 'Error al obtener reseñas públicas.' });
        }
    }
};
