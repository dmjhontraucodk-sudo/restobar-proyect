// src/hooks/useOrdersManagement.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useDashboardApi } from './useDashboardApi';
import { type ApiOrden, type OrdenEstado, type GetOrdenesFilters } from '../types'; // ← Ahora importado desde types
import toast from 'react-hot-toast';

// --- ✨ 1. DEFINIR LOS RANGOS DE FECHA ---
export type DateRangePreset = 'hoy' | 'ayer' | 'semana' | 'mes';

export const getDateRange = (preset: DateRangePreset): { fechaInicio?: string, fechaFin?: string } => {
  const ahora = new Date();
  const hoyInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0);
  const hoyFin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59);

  switch (preset) {
    case 'hoy':
      return { 
        fechaInicio: hoyInicio.toISOString(), 
        fechaFin: hoyFin.toISOString() 
      };
    case 'ayer':
      const ayerInicio = new Date(hoyInicio);
      ayerInicio.setDate(ayerInicio.getDate() - 1);
      const ayerFin = new Date(hoyFin);
      ayerFin.setDate(ayerFin.getDate() - 1);
      return { 
        fechaInicio: ayerInicio.toISOString(), 
        fechaFin: ayerFin.toISOString() 
      };
    case 'semana':
      const semanaInicio = new Date(hoyInicio);
      semanaInicio.setDate(semanaInicio.getDate() - 7);
      return { 
        fechaInicio: semanaInicio.toISOString(), 
        fechaFin: hoyFin.toISOString() 
      };
    case 'mes':
      const mesInicio = new Date(hoyInicio);
      mesInicio.setMonth(mesInicio.getMonth() - 1);
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
  const [filtroFecha, setFiltroFecha] = useState<DateRangePreset>('hoy'); // <-- ✨ 2. ESTADO DE FILTRO DE FECHA
  const [isPolling, setIsPolling] = useState(true); // Para detener el polling si abrimos un modal, etc.
  
  // Ref para evitar múltiples cargas simultáneas
  const isLoadingRef = useRef(false);

  // --- B. API ---
  const { getOrdenes, updateOrdenEstado } = useDashboardApi();

  // --- C. LÓGICA DE CARGA DE DATOS ---
  const loadOrders = useCallback(async () => {
    // Evitar recargar si ya está cargando
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    setIsLoading(true); // Usamos el loader principal solo en la carga inicial (manejado en la página)
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
      // No mostramos toast en el polling para no molestar al usuario
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [getOrdenes, filtroEstado, filtroFecha]); // <-- ✨ Dependencias actualizadas

  // --- D. USEEFFECT PARA CARGA INICIAL Y FILTROS ---
  useEffect(() => {
    loadOrders();
  }, [loadOrders]); // Se ejecuta 1 vez al inicio y c/ vez que 'loadOrders' (y sus dependencias) cambien

  // --- ✨ 3. USEEFFECT PARA POLLING (ACTUALIZACIÓN AUTOMÁTICA) ---
  useEffect(() => {
    // Si no estamos en polling (ej. abrimos un modal), no hacer nada
    if (!isPolling) return; 

    // Establecer un intervalo para recargar cada 10 segundos
    const intervalId = setInterval(() => {
      console.log("🔄 Recargando pedidos (polling)...");
      loadOrders(); // Recargar sin el spinner grande
    }, 10000); // 10 segundos

    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(intervalId);
  }, [isPolling, loadOrders]); // Se reactiva si 'isPolling' o 'loadOrders' cambien
  
  // --- E. LÓGICA DE ACCIONES (sin cambios) ---
  const handleChangeStatus = async (orderId: number, newState: OrdenEstado) => {
    const originalOrders = [...orders];
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, estado: newState } : order
      )
    );

    try {
      await updateOrdenEstado(orderId, newState);
      toast.success(`Orden #${orderId} actualizada a "${newState}"`);
      // Forzar recarga inmediata después de cambiar estado
      await loadOrders();
    } catch (err: any) {
      setOrders(originalOrders);
      toast.error(`Error al actualizar estado: ${err.message}`);
    }
  };

  // --- F. RETORNO ---
  return {
    orders,
    isLoading,
    error,
    reloadOrders: loadOrders,
    handleChangeStatus,
    // Filtros
    filtroEstado,
    setFiltroEstado,
    filtroFecha,
    setFiltroFecha,
    // Control de Polling
    isPolling,
    setIsPolling,
  };
}; 