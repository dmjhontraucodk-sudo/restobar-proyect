"use strict";
// backend_core/src/modules/reviews/dto/create-review.dto.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReviewSchema = exports.reviewDetailSchema = void 0;
const zod_1 = require("zod");
// Esquema para el detalle de calificaciones (aspectos/productos)
exports.reviewDetailSchema = zod_1.z.object({
    producto_id: zod_1.z.number().int().positive().optional(),
    aspecto: zod_1.z.string().max(100, "El aspecto no debe exceder 100 caracteres"),
    calificacion: zod_1.z.number().int().min(1, "La calificación debe ser al menos 1").max(5, "La calificación máxima es 5"),
});
// Esquema principal para crear una reseña (Ruta Pública)
exports.createReviewSchema = zod_1.z.object({
    cliente_id: zod_1.z.number().int().positive({ message: "ID de cliente inválido" }),
    orden_id: zod_1.z.number().int().positive({ message: "ID de orden inválido" }).optional(),
    calificacion_general: zod_1.z.number().int().min(1, "La calificación general debe ser al menos 1").max(5, "La calificación máxima es 5"),
    comentario: zod_1.z.string().max(1000, "El comentario no debe exceder 1000 caracteres").optional().nullable(),
    calificaciones_detalle: zod_1.z.array(exports.reviewDetailSchema).optional(),
    empleado_id: zod_1.z.number().int().positive({ message: "ID de empleado inválido" }).optional(),
});
