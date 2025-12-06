import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

// ✅ CORRECCIÓN 1: Usar 'import type' para evitar el error 1484 de TypeScript
import type { 
    ApiWebPedido, 
    webpedidos_estado 
} from '@shared/types'; 

// ✅ CORRECCIÓN 2: Importar el contexto para saber si el usuario está logueado
import { useAuth } from '@app/providers/AuthProvider';

interface UseWebOrdersResult {
    orders: ApiWebPedido[];
    isLoading: boolean;
    error: string | null;
    reloadOrders: () => void;
    updateOrderStatus: (
        orderId: number, 
        newStatus: webpedidos_estado, 
        reason?: string
    ) => Promise<ApiWebPedido>;
}

export const useWebReadyOrders = (): UseWebOrdersResult => {
    const { user } = useAuth(); // Usamos el user para saber cuándo recargar
    const [orders, setOrders] = useState<ApiWebPedido[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const API_BASE_URL = '/api/dashboard/orders/web-ready'; 

    // ✅ CORRECCIÓN 3: Tipado explícito para resolver error 2322
    const getAuthHeaders = useCallback((): Record<string, string> => {
        const token = localStorage.getItem('authToken');
        
        // Definimos el objeto base con el tipo correcto
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // Si hay token, lo agregamos al objeto existente
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }, []);

    /**
     * Obtiene todos los pedidos web listos
     */
    const reloadOrders = useCallback(async () => {
        // Si no hay usuario/token, no intentamos hacer fetch para evitar el 401
        const token = localStorage.getItem('authToken');
        if (!token) {
            // Opcional: Si quieres que falle silenciosamente o muestre error
            // setError("No hay sesión activa.");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(API_BASE_URL, {
                headers: getAuthHeaders() // ✅ Ahora TypeScript aceptará este objeto
            });
            
            if (response.status === 401) {
                throw new Error('Sesión expirada. Por favor recarga la página.');
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Fallo al cargar pedidos web listos.');
            }
            
            const data = await response.json();
            setOrders(data.orders || []); 
            
            // Mensaje de éxito opcional
            // toast.success(`Pedidos actualizados (${data.count || 0}).`, { id: 'load-web-orders', duration: 2000 });

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error al cargar pedidos web');
            toast.error(err.message || 'Error de conexión.', { id: 'load-web-orders' });
        } finally {
            setIsLoading(false);
        }
    }, [getAuthHeaders]);
    
    /**
     * Actualiza el estado del pedido en el Backend.
     */
    const updateOrderStatus = useCallback(async (
        orderId: number, 
        newStatus: webpedidos_estado, 
        reason?: string
    ): Promise<ApiWebPedido> => {
        
        const response = await fetch(`${API_BASE_URL}/${orderId}/status`, {
            method: 'PATCH',
            headers: getAuthHeaders(), // ✅ Headers corregidos
            body: JSON.stringify({ nuevo_estado: newStatus, razon_cancelacion: reason }),
        });

        if (response.status === 401) {
            throw new Error('No autorizado. Tu sesión ha expirado.');
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || `Fallo al actualizar el estado del pedido #${orderId}.`);
        }
        
        return data.order as ApiWebPedido; 
        
    }, [getAuthHeaders]);

    // Recargar cuando el componente monta o cuando cambia el usuario
    useEffect(() => {
        if (user) {
            reloadOrders();
        }
    }, [reloadOrders, user]);

    return { orders, isLoading, error, reloadOrders, updateOrderStatus };
};