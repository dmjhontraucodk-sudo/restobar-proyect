// frontend/src/hooks/useKitchenManagement.ts - FINAL CON CORRECCIONES DE TIPOS Y TOAST

import { useState, useEffect, useCallback } from 'react';
import { useDashboardApi } from './useDashboardApi'; 
import { 
    type webpedidos_estado, 
    type ApiWebPedido,
    type ApiWebPedidoDetalle, 
} from '../types'; 

import toast from 'react-hot-toast';


// Definición de KitchenOrder (sin cambios, ya fue corregida)
export interface KitchenOrder extends Omit<ApiWebPedido, 'webpedidos_detalles'> {
    webpedidos_detalles: Array<ApiWebPedidoDetalle & {
        productos: { 
            nombre: string;
        };
    }>;
}

export const useKitchenManagement = () => {
    const [orders, setOrders] = useState<KitchenOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(true); 
    
    // Obtenemos makeRequest (asumiendo que ya lo exportaste en useDashboardApi.ts)
    const { makeRequest } = useDashboardApi(); 

    const loadKitchenOrders = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const fetchedOrders = await makeRequest<KitchenOrder[]>('/cocina/pedidos');
            setOrders(fetchedOrders);
            
        } catch (err: any) {
            console.error("Error al cargar pedidos de cocina:", err);
            const errorMessage = err.message || 'No se pudieron cargar los pedidos de la cocina.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [makeRequest]);

    // La función updateOrderStatus usa toast, por lo que la advertencia se irá al usarlo.
    const updateOrderStatus = useCallback(async (orderId: number, newState: webpedidos_estado): Promise<void> => {
        
        const originalOrders = [...orders];
        setOrders(prevOrders => prevOrders.map(order => 
            order.id === orderId ? { ...order, estado: newState } : order
        ));

        try {
            await makeRequest<KitchenOrder>(`/cocina/pedidos/${orderId}/estado`, {
                method: 'PATCH',
                body: JSON.stringify({ estado: newState }),
            });
            
            await loadKitchenOrders(); 

        } catch (err: any) {
            setOrders(originalOrders);
            // Aquí se usa toast, resolviendo la advertencia en tiempo de ejecución.
            // Si quieres mover el toast al componente, elimina esta línea y la importación de 'toast' arriba.
            toast.error(err.message || 'Error al actualizar el estado del pedido'); 
            
            throw new Error(err.message || 'Error al actualizar el estado del pedido');
        }
    }, [makeRequest, orders, loadKitchenOrders]);


    useEffect(() => {
        loadKitchenOrders();

        let intervalId: number | undefined; 
        
        if (isPolling) {
            intervalId = setInterval(() => {
                console.log("🔄 Recargando pedidos de cocina (polling)...");
                loadKitchenOrders();
            }, 10000); 
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isPolling, loadKitchenOrders]); 

    
    return {
        orders,
        isLoading,
        error,
        reloadOrders: loadKitchenOrders,
        updateOrderStatus,
        isPolling,
        setIsPolling,
    };
};