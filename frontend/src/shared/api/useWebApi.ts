// src/hooks/useWebApi.ts
import { useState, useCallback } from 'react';
import type { CatalogResponse, PedidoData, OrderResponse, Producto, CreateReservationData } from '@shared/types';
import type { CreateReviewData, PublicReview, ApiResponse } from '@shared/types/reviews.types';

const API_BASE = '/api/web';

// ✅ EXPORTAR la interfaz ApiMesa para usarla en otros hooks
export interface ApiMesa {
    id: number;
    tenant_id: number;
    nombre_o_numero: string;
    capacidad: number;
    estado: 'Libre' | 'Ocupada' | 'Reservada'; 
}

export const useWebApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const makeRequest = useCallback(async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    setIsLoading(true);
    setError(null);

    try {
      // Obtener el tenant del subdominio (ej: "rb" de "rb.localhost:5174")
      const getCurrentTenant = () => {
        const hostname = window.location.hostname;
        // Para desarrollo local: rb.localhost → tenant = "rb"
        // Para producción: rb.midominio.com → tenant = "rb"
        const subdomain = hostname.split('.')[0];
        return subdomain !== 'localhost' ? subdomain : 'rb'; // o el tenant por defecto
      };

      const currentTenant = getCurrentTenant();
      
      console.log('🔍 [WEB API DEBUG] Tenant detectado:', currentTenant);
      console.log('🔍 [WEB API DEBUG] URL completa:', `${API_BASE}${endpoint}`);

      const headers = new Headers({
        'Content-Type': 'application/json',
        'X-Tenant-Subdomain': currentTenant,
        ...options.headers,
      });

      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers,
        ...options,
      });

      console.log('🔍 [WEB API DEBUG] Response status:', response.status);

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ [WEB API ERROR] Detalles del error:', {
          status: response.status,
          statusText: response.statusText,
          data: data,
          endpoint: endpoint
        });
        throw new Error(data.error || data.message || `Error ${response.status}: ${response.statusText}`);
      }

      console.log('✅ [WEB API DEBUG] Request exitosa:', data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('❌ [WEB API CATCH ERROR]:', message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Catálogo
  const getCatalog = useCallback((): Promise<CatalogResponse> => 
    makeRequest<CatalogResponse>('/catalog'), [makeRequest]);
  
  const searchProducts = useCallback((query: string): Promise<{results: Producto[]}> => 
    makeRequest<{results: Producto[]}>(`/products/search?q=${encodeURIComponent(query)}`), [makeRequest]);
  
  const getProduct = useCallback((id: number): Promise<Producto> => 
    makeRequest<Producto>(`/products/${id}`), [makeRequest]);
  
  const checkAvailability = useCallback((items: Array<{id: number, cantidad: number}>): Promise<{available: boolean}> => 
    makeRequest<{available: boolean}>('/check-availability', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }), [makeRequest]);

  // Pedidos
  const createOrder = useCallback((orderData: PedidoData): Promise<OrderResponse> =>
    makeRequest<OrderResponse>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }), [makeRequest]);

  // Reservas
  const createReservation = useCallback((reservationData: CreateReservationData): Promise<{ message: string, reservationId: number }> =>
    makeRequest<{ message: string, reservationId: number }>('/reservations', {
      method: 'POST',
      body: JSON.stringify(reservationData),
    }), [makeRequest]);

  // ✅ NUEVO: Obtener mesas disponibles (estado "Libre")
  const getAvailableMesas = useCallback((): Promise<ApiMesa[]> => 
    makeRequest<ApiMesa[]>(`/mesas/disponibles`), [makeRequest]);

  // ✅ NUEVO: Obtener detalles de una mesa específica (para carta virtual)
  const getTableDetails = useCallback((id: number): Promise<ApiMesa> => 
    makeRequest<ApiMesa>(`/mesas/${id}`), [makeRequest]);

  // ✅ NUEVO: Llamar al mozo
  const callWaiter = useCallback((id: number): Promise<{ success: boolean; message: string }> => 
    makeRequest<{ success: boolean; message: string }>(`/mesas/${id}/call`, {
      method: 'POST'
    }), [makeRequest]);

  // Reviews
  const createReview = useCallback((data: CreateReviewData): Promise<ApiResponse<{ needsApproval: boolean }>> =>
    makeRequest<ApiResponse<{ needsApproval: boolean }>>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }), [makeRequest]);

  const fetchPublicReviews = useCallback((): Promise<PublicReview[]> =>
    makeRequest<{ data: PublicReview[] }>('/reviews/public').then(res => res.data), [makeRequest]);

  // ✅ NUEVO: Obtener estadísticas de reseñas (promedio y total)
  const getReviewsStats = useCallback((): Promise<{ success: boolean; data: { averageRating: number; totalReviews: number; } }> =>
    makeRequest<{ success: boolean; data: { averageRating: number; totalReviews: number; } }>('/reviews/stats'), [makeRequest]);

  // ✅ CORREGIDO: Completar la función findClientByPhone
  const findClientByPhone = useCallback((telefono: string): Promise<{ success: boolean; client?: any }> =>
    makeRequest<{ success: boolean; client?: any }>(`/clients/by-phone/${telefono}`), [makeRequest]);

  const findClientByDocument = useCallback((documento_identidad: string): Promise<{ success: boolean; client?: any }> =>
    makeRequest<{ success: boolean; client?: any }>(`/clients/by-document/${documento_identidad}`), [makeRequest]);

  const findClientForReview = useCallback((documento_identidad: string): Promise<{ success: boolean; client?: any, error?: string }> =>
    makeRequest<{ success: boolean; client?: any, error?: string }>(`/clients/for-review/${documento_identidad}`), [makeRequest]);

  return {
    isLoading,
    error,
    getCatalog,
    searchProducts,
    getProduct,
    checkAvailability,
    createOrder,
    createReservation,
    getAvailableMesas,
    getTableDetails,
    callWaiter,
    createReview,
    fetchPublicReviews,
    getReviewsStats,
    findClientByPhone,
    findClientByDocument,
    findClientForReview,
  };
}; // ← Solo UN cierre aquí (eliminar el } extra)