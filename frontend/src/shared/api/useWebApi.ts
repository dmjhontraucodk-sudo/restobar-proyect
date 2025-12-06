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
  const getCatalog = (): Promise<CatalogResponse> => 
    makeRequest<CatalogResponse>('/catalog');
  
  const searchProducts = (query: string): Promise<{results: Producto[]}> => 
    makeRequest<{results: Producto[]}>(`/products/search?q=${encodeURIComponent(query)}`);
  
  const getProduct = (id: number): Promise<Producto> => 
    makeRequest<Producto>(`/products/${id}`);
  
  const checkAvailability = (items: Array<{id: number, cantidad: number}>): Promise<{available: boolean}> => 
    makeRequest<{available: boolean}>('/check-availability', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });

  // Pedidos
  const createOrder = (orderData: PedidoData): Promise<OrderResponse> =>
    makeRequest<OrderResponse>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });

  // Reservas - CORREGIDO
  // Reservas
  const createReservation = (reservationData: CreateReservationData): Promise<{ message: string, reservationId: number }> =>
    makeRequest<{ message: string, reservationId: number }>('/reservations', {
      method: 'POST',
      body: JSON.stringify(reservationData),
    });

  // ✅ NUEVO: Obtener mesas disponibles (estado "Libre")
  const getAvailableMesas = (): Promise<ApiMesa[]> => 
    makeRequest<ApiMesa[]>(`/mesas/disponibles`);

  // Reviews
  const createReview = (data: CreateReviewData): Promise<ApiResponse<{ needsApproval: boolean }>> =>
    makeRequest<ApiResponse<{ needsApproval: boolean }>>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });

  const fetchPublicReviews = (): Promise<PublicReview[]> =>
    makeRequest<{ data: PublicReview[] }>('/reviews/public').then(res => res.data);

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
    createReview,
    fetchPublicReviews,
  };
};
