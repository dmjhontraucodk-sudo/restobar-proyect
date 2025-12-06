"use strict";
// backend_core/src/modules/reviews/services/reviews.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewsService = void 0;
// Asegúrate de usar el path alias correcto para shared/database
const prisma_service_1 = require("@shared/database/prisma.service");
// Asegúrate de usar el path alias correcto para shared/constants
const app_constants_1 = require("@shared/constants/app.constants");
// Función de moderación simple
const containsInappropriateContent = (comment) => {
    if (!comment)
        return false;
    const lowerCaseComment = comment.toLowerCase();
    return app_constants_1.BAD_WORDS_LIST.some(word => lowerCaseComment.includes(word));
};
exports.reviewsService = {
    // --- Lógica de Creación (Ruta Pública) ---
    async createReview(tenantId, dto) {
        if (dto.orden_id) {
            const existingReview = await prisma_service_1.prisma.reseñas.findUnique({
                where: {
                    tenant_id_orden_id: {
                        tenant_id: tenantId,
                        orden_id: dto.orden_id,
                    },
                },
            });
            if (existingReview) {
                throw new Error('Ya existe una reseña para esta orden.');
            }
        }
        // Moderación: Si hay comentario y contiene palabras inapropiadas, se marca como NO APROBADA
        const needsManualApproval = dto.comentario && containsInappropriateContent(dto.comentario);
        const isApproved = !needsManualApproval;
        // Crear la reseña principal
        const review = await prisma_service_1.prisma.reseñas.create({
            data: {
                tenant_id: tenantId,
                cliente_id: dto.cliente_id,
                orden_id: dto.orden_id,
                empleado_id: dto.empleado_id,
                calificacion_general: dto.calificacion_general,
                comentario: dto.comentario,
                aprobada: isApproved,
            },
        });
        // Crear detalles de calificaciones (si existen)
        if (dto.calificaciones_detalle && dto.calificaciones_detalle.length > 0) {
            const detailData = dto.calificaciones_detalle.map(detail => ({
                ...detail,
                tenant_id: tenantId,
                reseña_id: review.id,
            }));
            await prisma_service_1.prisma.reseñas_calificaciones.createMany({
                data: detailData,
            });
        }
        return {
            review,
            needsApproval: !isApproved,
            message: isApproved
                ? 'Reseña enviada correctamente.'
                : 'Reseña enviada. Su comentario está bajo revisión y se publicará en breve.'
        };
    },
    // --- Lógica de Lectura (Ruta Pública - Para la Home Page) ---
    async getPublicReviews(tenantId, limit = 5) {
        // Filtrar SOLO las reseñas que han sido aprobadas
        return await prisma_service_1.prisma.reseñas.findMany({
            where: {
                tenant_id: tenantId,
                aprobada: true, // SOLO APROBADAS
                calificacion_general: {
                    gte: 4 // Mostrar solo reseñas de 4 o 5 estrellas
                }
            },
            include: {
                clientes: {
                    select: { nombre: true } // Incluir solo el nombre del cliente
                }
            },
            orderBy: { fecha_reseña: 'desc' },
            take: limit,
        });
    },
    // --- Dashboard/Moderación (Lógica Pendiente) ---
    async approveReview(_tenantId, _reviewId) {
        // Implementación pendiente para el dashboard
        console.log('approveReview function is pending implementation.');
    },
    async getAverageRating(_tenantId) {
        // Implementación pendiente para la Home Page
        console.log('getAverageRating function is pending implementation.');
    }
};
