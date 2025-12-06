import { useCallback } from 'react';
import { useDashboardApi } from '@shared/api/useDashboardApi'; // Asumo que este hook existe y tiene 'makeRequest'
import { 
    type SalesReport, 
    type InventoryReport, 
    type FinanceReport
} from '@shared/types';

interface DateFilter {
    fechaInicio?: string; // YYYY-MM-DD
    fechaFin?: string;   // YYYY-MM-DD
}

export const useReportsApi = () => {
    // makeRequest es la función genérica para hacer peticiones HTTP
    const { makeRequest } = useDashboardApi();

    /**
     * Obtiene el resumen de Ventas para el rango de fechas.
     */
    const getSalesSummary = useCallback(async (filters: DateFilter = {}): Promise<SalesReport> => {
        // Construye la cadena de consulta con los filtros de fecha
        const query = new URLSearchParams(filters as Record<string, string>).toString();
        
        try {
            const data = await makeRequest<SalesReport>(`/reports/sales/summary?${query}`);
            return data;
        } catch (error: any) {
            console.error("Error fetching sales summary:", error);
            throw new Error(error.message || 'Fallo al cargar el resumen de ventas.');
        }
    }, [makeRequest]);

    /**
     * Obtiene el resumen de Inventario para el rango de fechas.
     */
    const getInventorySummary = useCallback(async (filters: DateFilter = {}): Promise<InventoryReport> => {
        const query = new URLSearchParams(filters as Record<string, string>).toString();
        
        try {
            const data = await makeRequest<InventoryReport>(`/reports/inventory/summary?${query}`);
            return data;
        } catch (error: any) {
            console.error("Error fetching inventory summary:", error);
            throw new Error(error.message || 'Fallo al cargar el resumen de inventario.');
        }
    }, [makeRequest]);

    /**
     * Obtiene el resumen de Finanzas para el rango de fechas.
     */
    const getFinanceSummary = useCallback(async (filters: DateFilter = {}): Promise<FinanceReport> => {
        const query = new URLSearchParams(filters as Record<string, string>).toString();
        
        try {
            const data = await makeRequest<FinanceReport>(`/reports/finance/summary?${query}`);
            return data;
        } catch (error: any) {
            console.error("Error fetching finance summary:", error);
            throw new Error(error.message || 'Fallo al cargar el resumen financiero.');
        }
    }, [makeRequest]);

    return {
        getSalesSummary,
        getInventorySummary,
        getFinanceSummary,
    };
};