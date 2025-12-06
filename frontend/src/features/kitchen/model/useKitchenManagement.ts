// frontend/src/hooks/useKitchenManagement.ts (MODIFICADO)

import { useState, useEffect, useCallback } from 'react';
import { useDashboardApi } from '@shared/api/useDashboardApi'; 
import { 
    type webpedidos_estado, 
    // ✅ CAMBIO 1: Importamos la nueva interfaz unificada
    type KitchenOrderUnificada, 
} from '@shared/types'; 

import toast from 'react-hot-toast';
export type KitchenOrder = KitchenOrderUnificada; 


export const useKitchenManagement = () => {
    // ✅ CAMBIO 3: Usamos KitchenOrder (que ahora es KitchenOrderUnificada)
    const [orders, setOrders] = useState<KitchenOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(true); 
    
    const { makeRequest } = useDashboardApi(); 

    const loadKitchenOrders = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // ✅ El Back-end ahora devuelve KitchenOrderUnificada[]
            const fetchedOrders = await makeRequest<KitchenOrder[]>('/kitchen/pedidos');
            setOrders(fetchedOrders);
            
        } catch (err: any) {
            // ... (Manejo de error) ...
            console.error("Error al cargar pedidos de cocina:", err);
            const errorMessage = err.message || 'No se pudieron cargar los pedidos de la cocina.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [makeRequest]);

    // ✅ CAMBIO 4: La función ahora acepta el ID como string (ID Unificado)
    const updateOrderStatus = useCallback(async (orderId: string, newState: webpedidos_estado): Promise<void> => {
        
        const originalOrders = [...orders];
        // Actualización optimista de la interfaz de usuario
        setOrders(prevOrders => prevOrders.map(order => 
            // ✅ La comparación del ID es ahora con un string
            order.id === orderId ? { ...order, estado: newState } : order
        ));

        try {
            // ✅ CAMBIO CRUCIAL: Enviamos el ID Unificado (W-123 o P-456)
            // El Back-end ya sabe cómo dividirlo y qué tabla actualizar.
            await makeRequest<KitchenOrder>(`/kitchen/pedidos/${orderId}/estado`, {
                method: 'PATCH',
                body: JSON.stringify({ estado: newState }),
            });
            
            // Forzar una recarga para obtener la data fresca y unificada.
            await loadKitchenOrders(); 

        } catch (err: any) {
            setOrders(originalOrders);
            toast.error(err.message || 'Error al actualizar el estado del pedido'); 
            
            throw new Error(err.message || 'Error al actualizar el estado del pedido');
        }
    }, [makeRequest, orders, loadKitchenOrders]);


    useEffect(() => {
        // ... (Lógica de polling sin cambios) ...
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