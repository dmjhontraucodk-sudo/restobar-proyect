// src/shared/types/report-types.ts

/**
 * Representa un rol simple para listas de selección.
 */
export interface Role {
  id: number;
  nombre: string;
}

/**
 * Representa un empleado simple para listas de selección.
 */
export interface EmployeeSimple {
  id: number;
  nombre: string;
}

/**
 * Estructura de los datos de desempeño para un motorizado.
 */
export interface MotorizadoPerformanceMetrics {
  totalPedidosEntregados: number;
  totalVentasEntregadas: number;
  tiempoPromedioEntregaMin: number;
}

/**
 * Estructura genérica para otros reportes de rol que aún no están implementados.
 */
export interface PlaceholderPerformanceMetrics {
    message: string;
}

/**
 * La respuesta completa del API para el reporte de desempeño de un empleado.
 */
export interface EmployeePerformanceReport {
  employee: {
    id: number;
    nombre: string;
    rol: string;
  };
  performance: MotorizadoPerformanceMetrics | PlaceholderPerformanceMetrics;
}