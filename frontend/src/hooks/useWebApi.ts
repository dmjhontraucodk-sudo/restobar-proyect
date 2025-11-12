// src/hooks/useWebApi.ts
import { useState } from 'react';
import type { CatalogResponse, PedidoData, OrderResponse, Producto } from '../types';

const API_BASE = '/api/web';

export const useWebApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const makeRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en la petición');
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Catálogo
  const getCatalog = (): Promise<CatalogResponse> => makeRequest<CatalogResponse>('/catalog');
  
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

  return {
    isLoading,
    error,
    getCatalog,
    searchProducts,
    getProduct,
    checkAvailability,
    createOrder,
  };
};