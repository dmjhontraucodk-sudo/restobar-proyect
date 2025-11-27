// frontend/src/hooks/useTenantConfig.ts

import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import type { TenantConfig, UpdateTenantConfigData } from '../types/tenant-config.types';

const API_BASE = '/api/dashboard';

interface UseTenantConfigReturn {
  config: TenantConfig | null;
  isLoading: boolean;
  error: string | null;
  updateConfig: (data: UpdateTenantConfigData) => Promise<void>;
  updateSection: (section: string, data: UpdateTenantConfigData) => Promise<void>;
  resetConfig: () => Promise<void>;
  reloadConfig: () => Promise<void>;
}

export const useTenantConfig = (): UseTenantConfigReturn => {
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logout, currentTenant } = useAuth();

  // Función helper para hacer requests (igual que useDashboardApi)
  const makeRequest = useCallback(
    async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
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
        console.error(`❌ Error en API Config (${endpoint}):`, message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [logout, currentTenant]
  );

  // Cargar configuración
  const loadConfig = useCallback(async () => {
    try {
      const response = await makeRequest<{ success: boolean; config: TenantConfig }>('/config');
      
      if (response.success) {
        setConfig(response.config);
      } else {
        toast.error('Error al cargar la configuración');
      }
    } catch (err: any) {
      console.error('Error al cargar configuración:', err);
      toast.error(err.message || 'Error al cargar la configuración');
    }
  }, [makeRequest]);

  // Actualizar configuración completa
  const updateConfig = useCallback(
    async (data: UpdateTenantConfigData) => {
      try {
        const response = await makeRequest<{ 
          success: boolean; 
          message: string; 
          config: TenantConfig;
          errors?: string[];
        }>('/config', {
          method: 'PUT',
          body: JSON.stringify(data),
        });

        if (response.success) {
          setConfig(response.config);
          toast.success(response.message || 'Configuración actualizada');
        } else {
          const errorMsg = response.errors?.join(', ') || 'Error al actualizar';
          toast.error(errorMsg);
          throw new Error(errorMsg);
        }
      } catch (err: any) {
        console.error('Error al actualizar configuración:', err);
        throw err;
      }
    },
    [makeRequest]
  );

  // Actualizar sección específica
  const updateSection = useCallback(
    async (section: string, data: UpdateTenantConfigData) => {
      try {
        const response = await makeRequest<{ 
          success: boolean; 
          message: string; 
          config: TenantConfig;
          errors?: string[];
        }>(`/config/${section}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });

        if (response.success) {
          setConfig(response.config);
          toast.success(response.message || `Sección "${section}" actualizada`);
        } else {
          const errorMsg = response.errors?.join(', ') || 'Error al actualizar';
          toast.error(errorMsg);
          throw new Error(errorMsg);
        }
      } catch (err: any) {
        console.error('Error al actualizar sección:', err);
        throw err;
      }
    },
    [makeRequest]
  );

  // Resetear a valores por defecto
  const resetConfig = useCallback(async () => {
    try {
      const response = await makeRequest<{ 
        success: boolean; 
        message: string; 
        config: TenantConfig 
      }>('/config/reset', {
        method: 'POST',
      });

      if (response.success) {
        setConfig(response.config);
        toast.success(response.message || 'Configuración restablecida');
      } else {
        toast.error('Error al resetear configuración');
        throw new Error('Error al resetear');
      }
    } catch (err: any) {
      console.error('Error al resetear configuración:', err);
      throw err;
    }
  }, [makeRequest]);

  // Recargar configuración manualmente
  const reloadConfig = useCallback(async () => {
    await loadConfig();
  }, [loadConfig]);

  return {
    config,
    isLoading,
    error,
    updateConfig,
    updateSection,
    resetConfig,
    reloadConfig
  };
};