import { useState, useEffect, useCallback } from 'react';
import { useDashboardApi } from './useDashboardApi';
import { type EstadoCajaResponse, type CajaHistorialItem } from '../types';
import toast from 'react-hot-toast';

export const useCaja = () => {
  const { abrirCaja, getEstadoCaja, registrarMovimientoCaja, cerrarCaja } = useDashboardApi();

  const [cajaData, setCajaData] = useState<EstadoCajaResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar estado actual de la caja
  const loadCaja = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getEstadoCaja();
      setCajaData(data);
      setError(null);
    } catch (err: any) {
      // Si es 404 significa que no hay caja abierta, no es un error grave
      if (err.message?.includes('404') || err.message?.includes('No tienes caja abierta')) {
        setCajaData(null);
        setError(null); 
      } else {
        console.error(err);
        setError('Error al cargar la caja');
      }
    } finally {
      setIsLoading(false);
    }
  }, [getEstadoCaja]);

  useEffect(() => {
    loadCaja();
  }, [loadCaja]);

  // --- ACCIONES ---

  const handleAbrirCaja = async (montoInicial: number, observaciones?: string) => {
    try {
      await abrirCaja({ monto_inicial: montoInicial, observaciones });
      toast.success('Caja abierta correctamente');
      await loadCaja();
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Error al abrir caja');
      return false;
    }
  };

  const handleRegistrarMovimiento = async (tipo: 'INGRESO' | 'EGRESO', concepto: string, monto: number, metodo: any, notas?: string) => {
    try {
      await registrarMovimientoCaja({ 
        tipo, 
        concepto, 
        monto, 
        metodo_pago: metodo, 
        notas 
      });
      toast.success('Movimiento registrado');
      await loadCaja();
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar movimiento');
      return false;
    }
  };

  const handleCerrarCaja = async (montoReal: number, observaciones?: string) => {
    try {
      await cerrarCaja({ monto_real: montoReal, observaciones });
      toast.success('Caja cerrada correctamente');
      setCajaData(null); // Limpiamos el estado local
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Error al cerrar caja');
      return false;
    }
  };

  const getHistorial = useCallback(async (filtros?: { fechaInicio?: string, fechaFin?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros?.fechaFin) params.append('fechaFin', filtros.fechaFin);
    
    // Usamos makeRequest que ya existe en useDashboardApi (tienes que importarlo o pasarlo)
    // Si useCaja usa useDashboardApi internamente:
    const { makeRequest } = useDashboardApi(); 
    return makeRequest<CajaHistorialItem[]>(`/caja/historial?${params.toString()}`);
}, []);

  return {
    cajaData,
    isLoading,
    error,
    getHistorial,
    refreshCaja: loadCaja,
    actions: {
      abrirCaja: handleAbrirCaja,
      registrarMovimiento: handleRegistrarMovimiento,
      cerrarCaja: handleCerrarCaja
    }
  };
};