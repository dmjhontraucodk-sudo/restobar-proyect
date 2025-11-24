// frontend/src/hooks/useCaja.ts - MEJORADO CON ESTADÍSTICAS

import { useState, useEffect, useCallback } from 'react';
import { useDashboardApi } from './useDashboardApi';
import { type EstadoCajaResponse, type CajaHistorialItem } from '../types';
import toast from 'react-hot-toast';

// ✨ NUEVA INTERFAZ PARA ESTADÍSTICAS POR MÉTODO DE PAGO ✨
export interface EstadisticasPorMetodo {
  metodo: string;
  total: number;
  cantidad: number;
  porcentaje: number;
}

export interface ResumenCajaExtendido {
  inicial: number;
  ingresos: number;
  egresos: number;
  saldo_teorico: number;
  
  // ✨ NUEVOS CAMPOS
  por_metodo: EstadisticasPorMetodo[];
  total_transacciones: number;
  ticket_promedio: number;
}

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

  const handleRegistrarMovimiento = async (
    tipo: 'INGRESO' | 'EGRESO', 
    concepto: string, 
    monto: number, 
    metodo: any, 
    notas?: string
  ) => {
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
      setCajaData(null);
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Error al cerrar caja');
      return false;
    }
  };

  // ✨ NUEVA FUNCIÓN: Calcular estadísticas por método de pago ✨
  const calcularEstadisticasPorMetodo = useCallback((): ResumenCajaExtendido | null => {
    if (!cajaData) return null;

    const movimientos = cajaData.caja.movimientos;
    
    // Filtrar solo INGRESOS (ventas)
    const ingresos = movimientos.filter(m => m.tipo === 'INGRESO');
    
    // Agrupar por método de pago
    const porMetodo: { [key: string]: { total: number; cantidad: number } } = {};
    
    ingresos.forEach(mov => {
      const metodo = mov.metodo_pago || 'No especificado';
      if (!porMetodo[metodo]) {
        porMetodo[metodo] = { total: 0, cantidad: 0 };
      }
      porMetodo[metodo].total += Number(mov.monto);
      porMetodo[metodo].cantidad += 1;
    });

    // Calcular totales
    const totalIngresos = cajaData.resumen.ingresos;
    
    // Convertir a array y calcular porcentajes
    const estadisticas: EstadisticasPorMetodo[] = Object.entries(porMetodo).map(([metodo, data]) => ({
      metodo,
      total: data.total,
      cantidad: data.cantidad,
      porcentaje: totalIngresos > 0 ? (data.total / totalIngresos) * 100 : 0
    }));

    // Ordenar por total descendente
    estadisticas.sort((a, b) => b.total - a.total);

    // Calcular ticket promedio
    const totalTransacciones = ingresos.length;
    const ticketPromedio = totalTransacciones > 0 ? totalIngresos / totalTransacciones : 0;

    return {
      ...cajaData.resumen,
      por_metodo: estadisticas,
      total_transacciones: totalTransacciones,
      ticket_promedio: ticketPromedio
    };
  }, [cajaData]);

  return {
    cajaData,
    isLoading,
    error,
    refreshCaja: loadCaja,
    estadisticasExtendidas: calcularEstadisticasPorMetodo(),
    actions: {
      abrirCaja: handleAbrirCaja,
      registrarMovimiento: handleRegistrarMovimiento,
      cerrarCaja: handleCerrarCaja
    }
  };
};