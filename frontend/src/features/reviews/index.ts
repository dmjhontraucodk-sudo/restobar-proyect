// frontend/src/features/reviews/index.ts (MODIFICACIÓN FINAL)

// Exportamos todos los tipos consolidados desde su nueva ubicación
export * from '../../shared/types/reviews.types'; 

// Exportamos la API desde su nueva ubicación en shared/api
export { usePublicReviews } from './model/usePublicReviews';

// ✅ Exportación de los nuevos componentes UI
export { ReviewForm } from './ui/ReviewForm';
export { ReviewsList } from './ui/ReviewsList';