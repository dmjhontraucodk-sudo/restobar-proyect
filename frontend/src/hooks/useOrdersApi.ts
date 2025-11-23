import { useCallback } from 'react';
import { useDashboardApi } from './useDashboardApi';
import { 
    type ApiOrden, 
    type CreateOrdenData, 
    type ApiMesa, 
    type ApiOrdenDetalle,
    type CreateOrdenItem, 
} from '../types';

// Tipos específicos para la actualización de POS (Cierre y Descuento)
export interface UpdateOrderPosData {
    estado: 'Pagada' | 'Cerrada'; // El estado final de la Orden
    monto_pago: number; // Monto que se recibe
    metodo_pago: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Otro';
    
    descuento_monto?: number;
    descuento_porcentaje?: number;
    
    cliente_nombre?: string;
    cliente_telefono?: string;
}

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
    const createOrderPos = useCallback(async (data: CreateOrdenData): Promise<ApiOrden> => {
        return makeRequest<ApiOrden>('/ordenes', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }, [makeRequest]);

    // 3. ACTUALIZAR ESTADO/CERRAR CUENTA (Pago, Descuento y Cierre)
    const closeOrderPos = useCallback(async (ordenId: number, data: UpdateOrderPosData): Promise<ApiOrden> => {
        const finalData = {
            estado: data.estado,
            monto_pago: data.monto_pago,
            metodo_pago: data.metodo_pago,
            descuento_monto: data.descuento_monto || 0,
            descuento_porcentaje: data.descuento_porcentaje || 0,
            cliente_nombre: data.cliente_nombre,
            cliente_telefono: data.cliente_telefono,
        };

        return makeRequest<ApiOrden>(`/ordenes/${ordenId}/cierre`, {
            method: 'PATCH',
            body: JSON.stringify(finalData),
        });
    }, [makeRequest]);
    
    // 4. FUNCIÓN PARA AÑADIR ÍTEMS A ORDEN EXISTENTE
    const addItemsToOrder = useCallback(async (ordenId: number, data: AddItemsToOrderData): Promise<ApiOrden> => {
        
        return makeRequest<ApiOrden>(`/ordenes/${ordenId}/items`, {
            method: 'POST', 
            body: JSON.stringify(data),
        });
        
    }, [makeRequest]);

    
    // 5. Obtener detalles de una orden específica
    const getOrderPosDetails = useCallback(async (ordenId: number): Promise<ApiOrdenPos> => {
        return makeRequest<ApiOrdenPos>(`/ordenes/${ordenId}`);
    }, [makeRequest]);

    
    return {
        getMesasDisponibles, 
        createOrderPos,
        closeOrderPos,
        getOrderPosDetails,
        addItemsToOrder, 
    };
};