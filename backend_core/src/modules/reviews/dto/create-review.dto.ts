// backend_core/src/modules/reviews/dto/create-review.dto.ts

import { z } from 'zod';

// Esquema para el detalle de calificaciones (aspectos/productos)
export const reviewDetailSchema = z.object({
  producto_id: z.number().int().positive().optional(),
  aspecto: z.string().max(100, "El aspecto no debe exceder 100 caracteres"),
  calificacion: z.number().int().min(1, "La calificación debe ser al menos 1").max(5, "La calificación máxima es 5"),
});

// Esquema principal para crear una reseña (Ruta Pública)
export const createReviewSchema = z.object({
  cliente_id: z.number().int().positive({ message: "ID de cliente inválido" }),
  orden_id: z.number().int().positive({ message: "ID de orden inválido" }).optional(),
  
  calificacion_general: z.number().int().min(1, "La calificación general debe ser al menos 1").max(5, "La calificación máxima es 5"),
  comentario: z.string().max(1000, "El comentario no debe exceder 1000 caracteres").optional().nullable(),
  
  calificaciones_detalle: z.array(reviewDetailSchema).optional(),
  
  empleado_id: z.number().int().positive({ message: "ID de empleado inválido" }).optional(),
});

export type CreateReviewDto = z.infer<typeof createReviewSchema>;