import { useState, useEffect, useCallback, useRef } from 'react';
import { useDashboardApi } from './useDashboardApi';
import { type ApiOrden, type OrdenEstado, type GetOrdenesFilters } from '../types'; 
import toast from 'react-hot-toast';

// --- ✨ 1. DEFINIR LOS RANGOS DE FECHA ---
export type DateRangePreset = 'hoy' | 'ayer' | 'semana' | 'mes';

export const getDateRange = (preset: DateRangePreset): { fechaInicio?: string, fechaFin?: string } => {
    const ahora = new Date();
    // Establecer la hora de inicio y fin del día actual en UTC para ISOString
    const hoyInicio = new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0));
    const hoyFin = new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999));

    // Función auxiliar para restar días
    const subtractDays = (date: Date, days: number) => {
        const result = new Date(date);
        result.setDate(result.getDate() - days);
        return result;
    };

    switch (preset) {
        case 'hoy':
            return { 
                fechaInicio: hoyInicio.toISOString(), 
                fechaFin: hoyFin.toISOString() 
            };
        case 'ayer':
            const ayerInicio = subtractDays(hoyInicio, 1);
            const ayerFin = subtractDays(hoyFin, 1);
            return { 
                fechaInicio: ayerInicio.toISOString(), 
                fechaFin: ayerFin.toISOString() 
            };
        case 'semana':
            const semanaInicio = subtractDays(hoyInicio, 7);
            return { 
                fechaInicio: semanaInicio.toISOString(), 
                fechaFin: hoyFin.toISOString() 
            };
        case 'mes':
            const mesInicio = subtractDays(hoyInicio, 30); 
            return { 
                fechaInicio: mesInicio.toISOString(), 
                fechaFin: hoyFin.toISOString() 
            };
        default:
            return { 
                fechaInicio: hoyInicio.toISOString(), 
                fechaFin: hoyFin.toISOString() 
            };
    }
};

export const useOrdersManagement = () => {
    // --- A. ESTADOS ---
    const [orders, setOrders] = useState<ApiOrden[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filtroEstado, setFiltroEstado] = useState<OrdenEstado | undefined>('Abierta');
    const [filtroFecha, setFiltroFecha] = useState<DateRangePreset>('hoy'); 
    const [isPolling, setIsPolling] = useState(true); 
    
    // Ref para evitar múltiples cargas simultáneas
    const isLoadingRef = useRef(false);
    
    // Hacemos una copia del estado de órdenes para usarla en useCallback sin recrear la función
    const ordersRef = useRef(orders);
    useEffect(() => {
        ordersRef.current = orders;
    }, [orders]);


    // --- B. API ---
    const { getOrdenes, updateOrdenEstado } = useDashboardApi();

    // --- C. LÓGICA DE CARGA DE DATOS ---
    const loadOrders = useCallback(async () => {
        // Evitar recargar si ya está cargando
        if (isLoadingRef.current) return;
        isLoadingRef.current = true;

        // Mostrar el spinner si es la primera carga o si no hay datos visibles.
        const shouldShowLoading = ordersRef.current.length === 0;
        if (shouldShowLoading) { 
            setIsLoading(true); 
        }

        setError(null);

        // Preparar filtros
        const { fechaInicio, fechaFin } = getDateRange(filtroFecha);
        const filters: GetOrdenesFilters = {
            estado: filtroEstado,
            fechaInicio: fechaInicio,
            fechaFin: fechaFin,
        };

        try {
            const fetchedOrders = await getOrdenes(filters);
            setOrders(fetchedOrders);
        } catch (err: any) {
            console.error("Error al cargar órdenes:", err);
            setError(err.message || 'No se pudieron cargar las órdenes.');
        } finally {
            setIsLoading(false);
            isLoadingRef.current = false;
        }
    }, [getOrdenes, filtroEstado, filtroFecha]); 

    // --- D. USEEFFECT PARA CARGA INICIAL Y FILTROS ---
    useEffect(() => {
        console.log(`⏱️ Cargando pedidos: Estado=${filtroEstado || 'Todas'}, Fecha=${filtroFecha}`);
        loadOrders();
    }, [filtroEstado, filtroFecha, loadOrders]); 

    // --- E. USEFFECT PARA POLLING (ACTUALIZACIÓN AUTOMÁTICA) ---
    useEffect(() => {
        if (!isPolling) {
            console.log("⏸️ Polling de pedidos detenido.");
            return; 
        }

        const intervalId = setInterval(() => {
            console.log("🔄 Recargando pedidos (polling)...");
            loadOrders(); 
        }, 10000); 

        return () => {
            console.log("❌ Limpiando intervalo de polling.");
            clearInterval(intervalId);
        }
    }, [isPolling, loadOrders]); 
    
    // --- F. LÓGICA DE ACCIONES ---
    const handleChangeStatus = useCallback(async (orderId: number, newState: OrdenEstado) => {
        const originalOrders = [...orders];
        setOrders(prevOrders => 
            prevOrders.map(order => 
                order.id === orderId ? { ...order, estado: newState } : order
            )
        );

        try {
            await updateOrdenEstado(orderId, newState);
            toast.success(`Orden #${orderId} actualizada a "${newState}"`);
            await loadOrders();
        } catch (err: any) {
            setOrders(originalOrders);
            toast.error(`Error al actualizar estado: ${err.message}`);
        }
    }, [orders, updateOrdenEstado, loadOrders]); 

    // --- G. RETORNO ---
    return {
        orders,
        isLoading,
        error,
        reloadOrders: loadOrders,
        handleChangeStatus,
        filtroEstado,
        setFiltroEstado,
        filtroFecha,
        setFiltroFecha,
        isPolling,
        setIsPolling,
    };
};