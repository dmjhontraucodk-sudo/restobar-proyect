import { useCallback } from 'react';
import { useDashboardApi } from '@shared/api/useDashboardApi';
import { 
    type ApiOrden, 
    type CreateOrdenData, 
    type ApiMesa, 
    type ApiOrdenDetalle,
    type CreateOrdenItem,
    type UpdateOrderPosData, // ✅ IMPORTADO
    type Client // ✅ IMPORTADO
} from '@shared/types';

export interface OrdenDetalleConProducto extends ApiOrdenDetalle {
    productos: {
        nombre: string;
    }
}

export interface ApiOrdenPos extends ApiOrden {
    ordendetalles: OrdenDetalleConProducto[];
}

export interface AddItemsToOrderData {
    items: CreateOrdenItem[];
}

export const useOrdersApi = () => {
    const { makeRequest } = useDashboardApi();

    const findClientByDocument = useCallback(async (documento_identidad: string): Promise<{ success: boolean; client: Client }> => {
        return makeRequest<{ success: boolean; client: Client }>(`/clients/by-document/${documento_identidad}`);
    }, [makeRequest]);

    const findClientByPhone = useCallback(async (telefono: string): Promise<{ success: boolean; client: Client }> => {
        return makeRequest<{ success: boolean; client: Client }>(`/clients/phone/${telefono}`);
    }, [makeRequest]);
    
    // 1. OBTENER MESAS DISPONIBLES (FUNCIÓN ESTABLE)
    // ✅ makeRequest es una función estable de useDashboardApi, garantizando que esta función no cambie.
    const getMesasDisponibles = useCallback(async (): Promise<ApiMesa[]> => {
        try {
            const mesas = await makeRequest<ApiMesa[]>('/mesas');
            // Filtramos las mesas disponibles (estado: Libre)
            return mesas.filter(m => m.estado === 'Libre'); 
        } catch (error: any) { 
            console.error('Error al obtener mesas disponibles:', error);
            // Propagamos el error para que el modal lo muestre
            throw new Error(error.message || 'Error desconocido al obtener mesas disponibles.'); 
        }
    }, [makeRequest]); 

    // 2. CREAR NUEVA ORDEN POS (Comanda inicial)
    const createOrderPos = useCallback(
        (ordenData: CreateOrdenData): Promise<ApiOrden> => {
            return makeRequest<ApiOrden>('/orders', {
                method: 'POST',
                body: JSON.stringify(ordenData),
            });
        },
        [makeRequest]
    );

    // 3. ACTUALIZAR ESTADO/CERRAR CUENTA (Pago, Descuento y Cierre)
    const closeOrderPos = useCallback(
        async (ordenId: number, data: UpdateOrderPosData): Promise<ApiOrden> => {
            const response = await makeRequest<{ orden: ApiOrden }>(`/orders/${ordenId}/cierre`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            });
            return response.orden;
        },
        [makeRequest]
    );
    
    // 4. FUNCIÓN PARA AÑADIR ÍTEMS A ORDEN EXISTENTE
    const addItemsToOrder = useCallback(
        (ordenId: number, data: AddItemsToOrderData): Promise<ApiOrden> => {
            return makeRequest<ApiOrden>(`/orders/${ordenId}/items`, {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
        [makeRequest]
    );

    
    // 5. Obtener detalles de una orden específica
    const getOrderPosDetails = useCallback(
        (ordenId: number): Promise<ApiOrdenPos> => {
            return makeRequest<ApiOrdenPos>(`/orders/${ordenId}`);
        },
        [makeRequest]
    );

    
    const generateInvoice = useCallback(
        async (orderId: number, type: 'boleta' | 'factura', tenant: string): Promise<Blob> => {
            const token = localStorage.getItem("authToken");
            if (!token) {
                throw new Error("Authentication error");
            }
            const response = await fetch(`/api/dashboard/billing/generate-invoice/${orderId}?type=${type}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Tenant-Subdomain': tenant,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to generate invoice' }));
                throw new Error(errorData.message);
            }

            return response.blob();
        },
        []
    );

    return {
        getMesasDisponibles, 
        createOrderPos,
        closeOrderPos,
        getOrderPosDetails,
        addItemsToOrder,
        findClientByDocument,
        findClientByPhone,
        generateInvoice,
    };
};