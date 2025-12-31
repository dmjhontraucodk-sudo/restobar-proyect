// src/shared/config/env.ts
// Configuración centralizada de variables de entorno

/**
 * Variables de entorno de la aplicación
 * En desarrollo: lee de .env
 * En producción Docker: se inyectan como ARG durante el build
 */
export const config = {
    /**
     * URL base de la API
     * - Desarrollo: http://localhost:3000
     * - Producción: https://api-restobar.techinnovats.com
     */
    API_URL: import.meta.env.VITE_API_URL || '',
} as const;

/**
 * Helper para construir URLs de API
 * Si VITE_API_URL está vacío, usa rutas relativas (para proxy)
 */
export const getApiUrl = (path: string): string => {
    const baseUrl = config.API_URL;
    // Si hay URL base, concatenar. Si no, usar path relativo
    return baseUrl ? `${baseUrl}${path}` : path;
};
