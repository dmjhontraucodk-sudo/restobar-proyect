// frontend/src/features/reviews/model/usePublicReviews.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWebApi } from '@shared/api/useWebApi';
import type { PublicReview, LoadingState } from '../../../shared/types/reviews.types';

export const usePublicReviews = () => {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  
  const { fetchPublicReviews, isLoading: apiLoading, error: apiError } = useWebApi();

  const fetchReviews = useCallback(async (forceRefresh: boolean = false) => {
    // Si ya está cargando y no es un refresh forzado, no hacer nada
    if (isFetching && !forceRefresh) return;
    
    setIsFetching(true);
    setLocalError(null);
    
    try {
      const data = await fetchPublicReviews();
      setReviews(data);
    } catch (err: any) {
      setLocalError(err.message || 'Error al cargar las reseñas');
      // Mantener las reseñas existentes en caso de error (no limpiar)
    } finally {
      setIsFetching(false);
    }
  }, [fetchPublicReviews, isFetching]);

  // Cargar reseñas al montar el componente
  useEffect(() => {
    fetchReviews();
  }, []);

  // Calcular el rating promedio de las reseñas cargadas
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0.0;
    const total = reviews.reduce((sum, review) => sum + review.calificacion_general, 0);
    return parseFloat((total / reviews.length).toFixed(1));
  }, [reviews]);
  
  const totalReviews = reviews.length;

  // Determinar el estado de carga
  const loadingState = useMemo((): LoadingState => {
    if (isFetching || apiLoading) return 'loading';
    if (localError || apiError) return 'error';
    if (reviews.length === 0) return 'idle';
    return 'success';
  }, [isFetching, apiLoading, localError, apiError, reviews.length]);

  // Resetear errores
  const clearError = useCallback(() => {
    setLocalError(null);
  }, []);

  return {
    // Datos
    reviews,
    totalReviews,
    averageRating,
    
    // Estado
    loading: loadingState,
    error: localError || apiError,
    isFetching: isFetching || apiLoading,
    
    // Acciones
    fetchReviews,
    clearError,
    refetchReviews: () => fetchReviews(true),
  };
};