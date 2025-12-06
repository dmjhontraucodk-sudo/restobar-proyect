// backend_core/src/modules/reviews/controllers/reviews.controller.ts (CORRECCIÓN)

import { Request, Response } from 'express';
import { createReviewSchema, CreateReviewDto } from '../dto/create-review.dto';
import { reviewsService } from '../services/reviews.service';

interface AuthRequest extends Request {
  tenant?: { id: number; }; // Asegura que el middleware de tenant agregue este campo
}

export const reviewsController = {
  
  async createReview(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        return res.status(403).json({ error: 'Tenant no identificado.' });
      }

      const validation = createReviewSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Datos de reseña inválidos', 
          details: validation.error.issues 
        });
      }
      
      const dto: CreateReviewDto = validation.data;
      
      const result = await reviewsService.createReview(tenantId, dto);
      
      return res.status(201).json({ success: true, ...result }); // ✅ Asegurar el return en la ruta de éxito
      
    } catch (error: any) {
      console.error('Error en createReview:', error);
      if (error.message.includes('Ya existe una reseña')) {
         return res.status(409).json({ error: error.message }); // ✅ Asegurar el return
      }
      // ✅ Asegurar el return en el caso de error general
      return res.status(500).json({ error: error.message || 'Error interno del servidor al crear la reseña.' }); 
    }
  },
  
  async getPublicReviews(req: AuthRequest, res: Response) {
      try {
          const tenantId = req.tenant?.id;
          if (!tenantId) {
              return res.status(403).json({ error: 'Tenant no identificado.' });
          }

          // Obtiene las últimas 5 reseñas aprobadas (límite por defecto)
          const reviews = await reviewsService.getPublicReviews(tenantId);

          return res.json({ success: true, data: reviews }); // ✅ Asegurar el return en la ruta de éxito
      } catch (error: any) {
          console.error('Error en getPublicReviews:', error);
          // ✅ Asegurar el return en el catch
          return res.status(500).json({ error: 'Error al obtener reseñas públicas.' });
      }
  }
};