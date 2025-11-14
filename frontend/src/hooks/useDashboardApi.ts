import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {  
  type TipoCategoria,
  type ApiOrden, 
  type CreateOrdenData, 
  type OrdenEstado,
  type GetOrdenesFilters, 
  type ApiReservation, 
  type reservas_estado,
  type ApiMesa
} from '../types';

const API_BASE = '/api/dashboard';

// --- Tipos de Insumos ---
export interface Insumo {
  id: number;
  tenant_id: number;
  nombre: string;
  unidad_medida: string;
  stock_actual: number | null;
  costo_unitario: number | null;
}
export interface CreateInsumoData {
  nombre: string;
  unidad_medida: string;
  stock_actual?: number;
  costo_unitario?: number;
}

// --- Tipos de Producto con Receta ---
export interface RecipeItem {
  insumoId: number;
  cantidad: number;
}
export interface CreateProductData {
  nombre: string;
  precio: number;
  categoriaNombre: string;
  tipo: TipoCategoria;
  descripcion?: string | null;
  foto_url?: string | null;
  disponible?: boolean;
  visible_en_web?: boolean;
  receta: RecipeItem[];
}

// --- TIPO ApiProduct MEJORADO ---
export interface ApiProductWithRecipe {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  foto_url: string | null;
  disponible: boolean | null;
  visible_en_web: boolean | null;
  categoriasmenu: {
    id: number;
    nombre: string;
  };
  recetas: {
    cantidad_usada: number;
    insumos: {
      id: number;
      nombre: string;
      unidad_medida: string;
    }
  }[];
}

// Este tipo es para la LISTA de productos (más ligero)
export interface ApiProduct {
  id: number;
  tenant_id: number;
  categoria_id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  foto_url: string | null;
  disponible: boolean | null;
  visible_en_web: boolean | null;
  categoriasmenu: {
    nombre: string;
  };
}

// --- Tipos de Categoría ---
export interface ApiCategory {
  id: number;
  tenant_id: number;
  nombre: string;
  slug: string | null;
  orden: number | null;
  visible_en_web: boolean | null;
  tipo: TipoCategoria;
}
export interface CreateCategoryData {
  nombre: string;
  tipo: TipoCategoria;
}

// --- Tipos de Actualización de Producto ---
export interface UpdateProductData {
  nombre?: string;
  precio?: number;
  descripcion?: string | null;
  foto_url?: string | null;
  disponible?: boolean;
  visible_en_web?: boolean;
}

export interface UpdateProductWithRecipeData {
  nombre?: string;
  precio?: number;
  categoriaNombre?: string;
  descripcion?: string | null;
  foto_url?: string | null;
  disponible?: boolean;
  visible_en_web?: boolean;
  receta?: RecipeItem[];
}

export const useDashboardApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logout, currentTenant } = useAuth();

  const makeRequest = useCallback(async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error('Error de autenticación. Sesión no encontrada.');
      logout(); 
      throw new Error('No autorizado. No se encontró token.');
    }
    
    const headers = new Headers(options.headers || {});
    
    // ✨ CORRECCIÓN: Solo añadir Content-Type si NO es FormData
    if (!(options.body instanceof FormData)) {
      headers.append('Content-Type', 'application/json');
    }
    
    headers.append('Authorization', `Bearer ${token}`);
    
    // ✨✨✨ AGREGAR ESTE HEADER CRUCIAL ✨✨✨
    if (currentTenant) {
      headers.append('X-Tenant-Subdomain', currentTenant);
      console.log('🔍 [API DEBUG] Enviando header X-Tenant-Subdomain:', currentTenant);
    } else {
      console.log('🔍 [API DEBUG] No hay currentTenant, usando lógica por defecto');
    }
    
    try {
      console.log(`🔍 [API DEBUG] Iniciando request: ${options.method || 'GET'} ${endpoint}`);

      console.log('🔍 [API DEBUG] Headers que se enviarán:', {
        'Authorization': `Bearer ${token?.substring(0, 20)}...`,
        'X-Tenant-Subdomain': currentTenant,
        'Content-Type': headers.get('Content-Type'),
        'Todos los headers': Object.fromEntries(headers.entries())
      });
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: headers,
      });
      
      if (response.status === 401) {
        toast.error('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
        logout();
        throw new Error('No autorizado.');
      }
      
      console.log(`🔍 [API DEBUG] ${options.method || 'GET'} ${endpoint} - Status:`, response.status);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error(`❌ [API DEBUG] Error ${response.status}:`, data);
        throw new Error(data.error || 'Error en la petición');
      }
      
      console.log(`✅ [API DEBUG] Request exitosa:`, data);
      return data as T;
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error(`❌ Error en API Dashboard (${endpoint}):`, message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [logout, currentTenant]);

  const getOverviewData = useCallback((): Promise<{ totalOrders: number; totalSales: number; }> => {
    return makeRequest<{ totalOrders: number; totalSales: number; }>('/overview');
  }, [makeRequest]);

  // --- Funciones de Productos ---
  const getProducts = useCallback((tipo: TipoCategoria): Promise<ApiProduct[]> => {
    return makeRequest<ApiProduct[]>(`/products?tipo=${tipo}`);
  }, [makeRequest]);

  const createProductWithRecipe = useCallback((productData: CreateProductData): Promise<ApiProduct> => {
    return makeRequest<ApiProduct>('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }, [makeRequest]);

  const updateProduct = useCallback((productId: number | string, data: UpdateProductData): Promise<ApiProduct> => {
    return makeRequest<ApiProduct>(`/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }, [makeRequest]);

  // --- FUNCIONES DE EDITAR ---
  const getProductById = useCallback((productId: number | string): Promise<ApiProductWithRecipe> => {
    return makeRequest<ApiProductWithRecipe>(`/products/${productId}`);
  }, [makeRequest]);

  const updateProductWithRecipe = useCallback((productId: number | string, data: UpdateProductWithRecipeData): Promise<ApiProduct> => {
    return makeRequest<ApiProduct>(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }, [makeRequest]);

  // --- ✨ FUNCIÓN UPLOAD IMAGE CORREGIDA ---
  const uploadImage = useCallback((file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('image', file);

    return makeRequest<{ url: string }>('/upload-image', {
      method: 'POST',
      body: formData,
    });
  }, [makeRequest]);

  // --- Funciones de Insumos ---
  const getInsumos = useCallback((): Promise<Insumo[]> => {
    return makeRequest<Insumo[]>('/insumos');
  }, [makeRequest]);

  const createInsumo = useCallback((insumoData: CreateInsumoData): Promise<Insumo> => {
    return makeRequest<Insumo>('/insumos', {
      method: 'POST',
      body: JSON.stringify(insumoData),
    });
  }, [makeRequest]);

  // --- Funciones de Categoría ---
  const createCategory = useCallback((categoryData: CreateCategoryData): Promise<ApiCategory> => {
    return makeRequest<ApiCategory>('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }, [makeRequest]);
  
  const getCategories = useCallback((tipo: TipoCategoria): Promise<ApiCategory[]> => {
    return makeRequest<ApiCategory[]>(`/categories?tipo=${tipo}`);
  }, [makeRequest]);

  const getOrdenes = useCallback((filters: GetOrdenesFilters = {}): Promise<ApiOrden[]> => {
    const params = new URLSearchParams();
    if (filters.estado) {
      params.append('estado', filters.estado);
    }
    if (filters.fechaInicio) {
      params.append('fechaInicio', filters.fechaInicio);
    }
    if (filters.fechaFin) {
      params.append('fechaFin', filters.fechaFin);
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/ordenes?${queryString}` : '/ordenes';
    
    return makeRequest<ApiOrden[]>(endpoint);
  }, [makeRequest]);

  const createOrden = useCallback((ordenData: CreateOrdenData): Promise<ApiOrden> => {
    return makeRequest<ApiOrden>('/ordenes', {
      method: 'POST',
      body: JSON.stringify(ordenData),
    });
  }, [makeRequest]);

  const updateOrdenEstado = useCallback((ordenId: number, estado: OrdenEstado): Promise<{ message: string }> => {
    return makeRequest<{ message: string }>(`/ordenes/${ordenId}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    });
  }, [makeRequest]);

  const getMesasConOrdenes = useCallback((): Promise<ApiMesa[]> => {
    return makeRequest<ApiMesa[]>('/mesas-con-ordenes');
  }, [makeRequest]);

  const getReservations = useCallback((estado?: reservas_estado | 'all'): Promise<ApiReservation[]> => {
    const query = estado && estado !== 'all' ? `?estado=${estado}` : '';
    return makeRequest<ApiReservation[]>(`/reservations${query}`);
  }, [makeRequest]); // ← CORREGIDO: Esta llave estaba mal ubicada

  const updateReservationStatus = useCallback((id: number, nuevo_estado: reservas_estado, mesa_id?: number): Promise<{ message: string, reservation: ApiReservation }> => {
    return makeRequest<{ message: string, reservation: ApiReservation }>(`/reservations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ nuevo_estado, mesa_id })
    });
  }, [makeRequest]);

  return {
    isLoading,
    error,
    getOverviewData,
    getProducts,
    createProductWithRecipe,
    updateProduct,
    getProductById,
    updateProductWithRecipe,
    uploadImage,
    getInsumos,
    createInsumo,
    createCategory,
    getCategories,
    getOrdenes,
    createOrden,
    updateOrdenEstado,
    getMesasConOrdenes,
    getReservations,
    updateReservationStatus
  };
};