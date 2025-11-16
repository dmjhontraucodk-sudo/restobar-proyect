// src/hooks/useDashboardApi.ts - ACTUALIZADO CON INVENTARIO DINÁMICO

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
  type ApiMesa,
  // ✨ NUEVOS IMPORTS
  type CategoriaInventario,
  type CreateCategoriaInventarioData,
  type UpdateCategoriaInventarioData,
  type TipoGasto,
  type CreateTipoGastoData,
  type UnidadMedida,
  type CreateUnidadMedidaData,
  type ProductoInventario,
  type CreateProductoInventarioData,
  type UpdateProductoInventarioData,
  type Compra,
  type CreateCompraData,
  type GetComprasFilters,
} from '../types';

const API_BASE = '/api/dashboard';

// --- Tipos de Insumos (DEPRECADOS - Mantener por compatibilidad) ---
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

// --- Tipos de Producto ---
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
  receta?: RecipeItem[];
}

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
    tipo: TipoCategoria;
  };
}

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
  tipo?: TipoCategoria;
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
    
    if (!(options.body instanceof FormData)) {
      headers.append('Content-Type', 'application/json');
    }
    
    headers.append('Authorization', `Bearer ${token}`);
    
    if (currentTenant) {
      headers.append('X-Tenant-Subdomain', currentTenant);
    }
    
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: headers,
      });
      
      if (response.status === 401) {
        toast.error('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
        logout();
        throw new Error('No autorizado.');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error(`❌ Error ${response.status}:`, data);
        throw new Error(data.error || 'Error en la petición');
      }
      
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

  // ========== FUNCIONES EXISTENTES (SIN CAMBIOS) ==========

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

  const getProductById = useCallback((productId: number | string): Promise<ApiProductWithRecipe> => {
    return makeRequest<ApiProductWithRecipe>(`/products/${productId}`);
  }, [makeRequest]);

  const updateProductWithRecipe = useCallback((productId: number | string, data: UpdateProductWithRecipeData): Promise<ApiProduct> => {
    return makeRequest<ApiProduct>(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }, [makeRequest]);

  const uploadImage = useCallback(async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      console.log('📤 Subiendo imagen a Cloudinary...', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      const response = await makeRequest<{ 
        url: string; 
        public_id?: string;
        secure_url?: string;
      }>('/upload-image', {
        method: 'POST',
        body: formData,
      });

      let finalUrl = response.url;

      if (response.secure_url) {
        finalUrl = response.secure_url;
      }

      if (!finalUrl || !finalUrl.includes('cloudinary.com')) {
        console.error('❌ URL de Cloudinary inválida:', finalUrl);
        throw new Error('La URL de la imagen no es válida');
      }

      if (finalUrl.startsWith('http://')) {
        finalUrl = finalUrl.replace('http://', 'https://');
      }

      console.log('✅ Imagen subida exitosamente:', {
        url: finalUrl,
        public_id: response.public_id
      });

      return { url: finalUrl };

    } catch (err: any) {
      console.error('❌ Error en uploadImage:', err);
      
      let errorMessage = err.message;
      
      if (err.message.includes('network') || err.message.includes('Network')) {
        errorMessage = 'Error de conexión al subir la imagen';
      } else if (err.message.includes('cloudinary')) {
        errorMessage = 'Error del servicio de imágenes';
      } else if (err.message.includes('URL')) {
        errorMessage = 'La imagen subida no es válida';
      }
      
      toast.error(`Error al subir imagen: ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }, [makeRequest]);

  // DEPRECADO: Usar getProductosInventario
  const getInsumos = useCallback((): Promise<Insumo[]> => {
    return makeRequest<Insumo[]>('/insumos');
  }, [makeRequest]);

  // DEPRECADO: Usar createProductoInventario
  const createInsumo = useCallback((insumoData: CreateInsumoData): Promise<Insumo> => {
    return makeRequest<Insumo>('/insumos', {
      method: 'POST',
      body: JSON.stringify(insumoData),
    });
  }, [makeRequest]);

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
  }, [makeRequest]);

  const updateReservationStatus = useCallback((id: number, nuevo_estado: reservas_estado, mesa_id?: number): Promise<{ message: string, reservation: ApiReservation }> => {
    return makeRequest<{ message: string, reservation: ApiReservation }>(`/reservations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ nuevo_estado, mesa_id })
    });
  }, [makeRequest]);

  const getMesas = useCallback((): Promise<ApiMesa[]> => { 
    return makeRequest<ApiMesa[]>('/mesas'); 
  }, [makeRequest]);

  const createMesa = useCallback((data: any): Promise<ApiMesa> => { 
    return makeRequest<ApiMesa>('/mesas', { 
        method: 'POST', 
        body: JSON.stringify(data) 
    });
  }, [makeRequest]);

  const updateMesa = useCallback((mesaId: number, data: any): Promise<ApiMesa> => { 
      return makeRequest<ApiMesa>(`/mesas/${mesaId}`, { 
          method: 'PATCH', 
          body: JSON.stringify(data) 
      });
  }, [makeRequest]);

    const deleteMesa = useCallback((mesaId: number): Promise<{ message: string }> => { 
      return makeRequest<{ message: string }>(`/mesas/${mesaId}`, { 
          method: 'DELETE',
      });
  // ========== ✨ NUEVAS FUNCIONES - INVENTARIO DINÁMICO ✨ ==========

  // --- CATEGORÍAS DE INVENTARIO ---
  const getCategoriasInventario = useCallback((): Promise<CategoriaInventario[]> => {
    return makeRequest<CategoriaInventario[]>('/categorias-inventario');
  }, [makeRequest]);

  const createCategoriaInventario = useCallback((data: CreateCategoriaInventarioData): Promise<CategoriaInventario> => {
    return makeRequest<CategoriaInventario>('/categorias-inventario', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }, [makeRequest]);

  const updateCategoriaInventario = useCallback((id: number, data: UpdateCategoriaInventarioData): Promise<CategoriaInventario> => {
    return makeRequest<CategoriaInventario>(`/categorias-inventario/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }, [makeRequest]);

  // --- TIPOS DE GASTO ---
  const getTiposGasto = useCallback((): Promise<TipoGasto[]> => {
    return makeRequest<TipoGasto[]>('/tipos-gasto');
  }, [makeRequest]);

  const createTipoGasto = useCallback((data: CreateTipoGastoData): Promise<TipoGasto> => {
    return makeRequest<TipoGasto>('/tipos-gasto', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }, [makeRequest]);

  // --- UNIDADES DE MEDIDA ---
  const getUnidadesMedida = useCallback((): Promise<UnidadMedida[]> => {
    return makeRequest<UnidadMedida[]>('/unidades-medida');
  }, [makeRequest]);

  const createUnidadMedida = useCallback((data: CreateUnidadMedidaData): Promise<UnidadMedida> => {
    return makeRequest<UnidadMedida>('/unidades-medida', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }, [makeRequest]);

  // --- PRODUCTOS DE INVENTARIO ---
  const getProductosInventario = useCallback((categoria_id?: number): Promise<ProductoInventario[]> => {
    const query = categoria_id ? `?categoria_id=${categoria_id}` : '';
    return makeRequest<ProductoInventario[]>(`/productos-inventario${query}`);
  }, [makeRequest]);

  const createProductoInventario = useCallback((data: CreateProductoInventarioData): Promise<ProductoInventario> => {
    return makeRequest<ProductoInventario>('/productos-inventario', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }, [makeRequest]);

  const updateProductoInventario = useCallback((id: number, data: UpdateProductoInventarioData): Promise<ProductoInventario> => {
    return makeRequest<ProductoInventario>(`/productos-inventario/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }, [makeRequest]);

  // --- COMPRAS/GASTOS ---
  const getGastos = useCallback((filters: GetComprasFilters = {}): Promise<Compra[]> => {
    const params = new URLSearchParams();
    if (filters.tipo_gasto_id) {
      params.append('tipo_gasto_id', filters.tipo_gasto_id.toString());
    }
    if (filters.fechaInicio) {
      params.append('fechaInicio', filters.fechaInicio);
    }
    if (filters.fechaFin) {
      params.append('fechaFin', filters.fechaFin);
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/gastos?${queryString}` : '/gastos';
    
    return makeRequest<Compra[]>(endpoint);
  }, [makeRequest]);

  const getGastoById = useCallback((id: number): Promise<Compra> => {
    return makeRequest<Compra>(`/gastos/${id}`);
  }, [makeRequest]);

  const createGasto = useCallback((data: CreateCompraData): Promise<Compra> => {
    return makeRequest<Compra>('/gastos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }, [makeRequest]);

  const receiveCompra = useCallback((id: number): Promise<{ message: string }> => {
    return makeRequest<{ message: string }>(`/gastos/${id}/recibir`, {
      method: 'POST',
    });
  }, [makeRequest]);

  return {
    isLoading,
    error,
    
    // Funciones existentes
    getOverviewData,
    getProducts,
    createProductWithRecipe,
    updateProduct,
    getProductById,
    updateProductWithRecipe,
    uploadImage,
    getInsumos, // DEPRECADO
    createInsumo, // DEPRECADO
    createCategory,
    getCategories,
    getOrdenes,
    createOrden,
    updateOrdenEstado,
    getMesasConOrdenes,
    getReservations,
    updateReservationStatus,
    getMesas,
    createMesa,
    updateMesa,
    deleteMesa
    
    // ✨ Nuevas funciones de inventario
    getCategoriasInventario,
    createCategoriaInventario,
    updateCategoriaInventario,
    getTiposGasto,
    createTipoGasto,
    getUnidadesMedida,
    createUnidadMedida,
    getProductosInventario,
    createProductoInventario,
    updateProductoInventario,
    getGastos,
    getGastoById,
    createGasto,
    receiveCompra,
  };
};