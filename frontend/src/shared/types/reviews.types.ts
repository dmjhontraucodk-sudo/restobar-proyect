// frontend/src/shared/types/reviews.types.ts (VERSIÓN CONSOLIDADA Y COMPLETA)

// === TIPOS GENÉRICOS (MOVIDOS AQUÍ PARA COMPILACIÓN) ===

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
// ========================================================

// Tipos para el Detalle de Calificación
export interface ReviewDetail {
  producto_id?: number;
  aspecto: string; 
  calificacion: number; 
}

// Tipo para la Reseña Completa (Salida del Backend GET /public)
export interface PublicReview {
  id: number;
  calificacion_general: number;
  comentario: string | null;
  fecha_reseña: string;
  clientes: { nombre: string }; 
}

// Tipo para los datos de entrada (DTO)
export interface CreateReviewData {
  cliente_id: number;
  orden_id?: number;
  calificacion_general: number;
  comentario?: string | null;
  calificaciones_detalle?: ReviewDetail[];
  empleado_id?: number;
}