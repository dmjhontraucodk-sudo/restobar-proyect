// backend_core/src/modules/reviews/services/reviews.service.ts

// Asegúrate de usar el path alias correcto para shared/database
import { prisma } from '@shared/database/prisma.service'; 
import { CreateReviewDto } from '../dto/create-review.dto';

export const reviewsService = {
  
  // --- Lógica de Creación (Ruta Pública) ---
  async createReview(tenantId: number, dto: CreateReviewDto) {
    
    if (dto.orden_id) {
      const existingReview = await prisma.reseñas.findUnique({
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
    
    // Moderación: Todas las reseñas nuevas requieren aprobación manual.
    const isApproved = false;
    
    // Crear la reseña principal
    const review = await prisma.reseñas.create({
      data: {
        tenant_id: tenantId,
        cliente_id: dto.cliente_id,
        orden_id: dto.orden_id,
        empleado_id: dto.empleado_id,
        calificacion_general: dto.calificacion_general,
        comentario: dto.comentario,
        aprobada: isApproved, // Siempre será 'false' en la creación
      },
    });
    
    // Crear detalles de calificaciones (si existen)
    if (dto.calificaciones_detalle && dto.calificaciones_detalle.length > 0) {
      const detailData = dto.calificaciones_detalle.map(detail => ({
        ...detail,
        tenant_id: tenantId,
        reseña_id: review.id,
      }));
      
      await prisma.reseñas_calificaciones.createMany({
        data: detailData,
      });
    }
    
    return { 
      review, 
      needsApproval: true, // Siempre es true ahora que no hay aprobación automática
      message: 'Reseña enviada. Su comentario está bajo revisión y se publicará en breve.'
    };
  },
  
  // --- Lógica de Lectura (Ruta Pública - Para la Home Page) ---
  async getPublicReviews(tenantId: number, limit: number = 5) {
      // Filtrar SOLO las reseñas que han sido aprobadas
      return await prisma.reseñas.findMany({
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
  async getPendingReviews(tenantId: number) {
    return prisma.reseñas.findMany({
      where: {
        tenant_id: tenantId,
        aprobada: false,
      },
      include: {
        clientes: {
          select: { nombre: true },
        },
      },
      orderBy: {
        fecha_reseña: 'asc',
      },
    });
  },

  async approveReview(tenantId: number, reviewId: number) {
    const result = await prisma.reseñas.updateMany({
      where: {
        id: reviewId,
        tenant_id: tenantId,
      },
      data: {
        aprobada: true,
      },
    });

    if (result.count === 0) {
      throw new Error('Reseña no encontrada o no pertenece al tenant.');
    }

    return prisma.reseñas.findUnique({ where: { id: reviewId } });
  },

  async rejectReview(tenantId: number, reviewId: number) {
    const result = await prisma.reseñas.deleteMany({
      where: {
        id: reviewId,
        tenant_id: tenantId,
      },
    });

    if (result.count === 0) {
      throw new Error('Reseña no encontrada o no pertenece al tenant.');
    }

    return result;
  },
  
  async getAverageRating(_tenantId: number) {
      // Implementación pendiente para la Home Page
      console.log('getAverageRating function is pending implementation.');
  }
};