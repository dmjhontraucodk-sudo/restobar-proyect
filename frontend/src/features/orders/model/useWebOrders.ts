// frontend/src/features/orders/model/useWebOrders.ts
import { useState, useEffect, useCallback } from 'react';
import { useDashboardApi } from '@shared/api/useDashboardApi';
import type { ApiWebPedido, webpedidos_estado } from '@shared/types';
import toast from 'react-hot-toast';

interface UseWebOrdersReturn {
    orders: ApiWebPedido[];
    isLoading: boolean;
    error: string | null;
    reloadOrders: () => void;
    updateOrderStatus: (id: number, status: webpedidos_estado) => Promise<void>;
    assignMotorized: (orderId: number, motorizedId: number) => Promise<void>;
    employees: any[]; // Simplificado para la lista de empleados
}

export const useWebOrders = (): UseWebOrdersReturn => {
    const { makeRequest } = useDashboardApi();
    const [orders, setOrders] = useState<ApiWebPedido[]>([]);
    const [employees, setEmployees] = useState<any[]>([]); // Lista para el select
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Cargar pedidos
            const ordersData = await makeRequest<{ orders: ApiWebPedido[] }>('/web-orders/list');
            setOrders(ordersData.orders || []);

            // Cargar empleados para el selector (solo activos)
            const empData = await makeRequest<{ empleados: any[] }>('/employees');
            if (empData && empData.empleados) {
                setEmployees(empData.empleados.filter((e: any) => e.is_active));
            }

        } catch (err: any) {
            console.error('Error loading web orders:', err);
            setError(err.message || 'Error al cargar pedidos');
        } finally {
            setIsLoading(false);
        }
    }, [makeRequest]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const updateOrderStatus = async (orderId: number, status: webpedidos_estado) => {
        try {
            await makeRequest(`/web-orders/${orderId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ nuevo_estado: status })
            });
            
            // Actualización optimista o recarga
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, estado: status } : o));
            toast.success('Estado actualizado');
            loadData(); // Recargar para asegurar consistencia (ej. timestamps)
        } catch (err: any) {
            toast.error(err.message || 'Error al actualizar estado');
            throw err;
        }
    };

    const assignMotorized = async (orderId: number, motorizedId: number) => {
        try {
            await makeRequest(`/web-orders/${orderId}/assign-motorized`, {
                method: 'POST',
                body: JSON.stringify({ motorizado_id: motorizedId })
            });
            
            toast.success('Motorizado asignado');
            loadData();
        } catch (err: any) {
            toast.error(err.message || 'Error al asignar motorizado');
            throw err;
        }
    };

    return {
        orders,
        isLoading,
        error,
        reloadOrders: loadData,
        updateOrderStatus,
        assignMotorized,
        employees
    };
};
