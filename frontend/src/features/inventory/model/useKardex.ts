import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDashboardApi } from '@shared/api/useDashboardApi';
import { type ProductoInventario } from '@shared/types';

export interface KardexItem {
  id: number;
  fecha: string;
  tipo_movimiento: 'ENTRADA' | 'SALIDA';
  motivo: string;
  cantidad: number;
  costo_unitario: number;
  valor_total: number;
  saldo_cantidad: number;
  saldo_valor: number;
  observaciones: string;
  productos_inventario: {
    nombre: string;
    unidades_medida?: { abreviatura: string };
  };
  empleados?: { nombre: string };
}

export const useKardex = () => {
  const { makeRequest, getProductosInventario } = useDashboardApi();
  
  const [rawMovimientos, setRawMovimientos] = useState<KardexItem[]>([]);
  const [productosFilter, setProductosFilter] = useState<ProductoInventario[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filtros Principales (Van al Backend)
  const [filters, setFilters] = useState({
    producto_id: '',
    fechaInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // Inicio de mes
    fechaFin: new Date().toISOString().split('T')[0],
    tipo_movimiento: ''
  });

  // Filtros Locales (Refinamiento en cliente)
  const [localFilterMotivo, setLocalFilterMotivo] = useState('');
  const [localSearch, setLocalSearch] = useState('');

  // 1. Cargar lista de productos
  useEffect(() => {
    getProductosInventario().then(data => {
        if(Array.isArray(data)) {
            setProductosFilter(data.filter((p: any) => p.activo));
        }
    }).catch(console.error);
  }, [getProductosInventario]);

  // 2. Cargar Kardex desde Backend
  const loadKardex = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.producto_id) params.append('producto_id', filters.producto_id);
      if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
      if (filters.tipo_movimiento) params.append('tipo_movimiento', filters.tipo_movimiento);

      const data = await makeRequest<KardexItem[]>(`/inventory/kardex?${params.toString()}`);
      setRawMovimientos(data);
    } catch (error) {
      console.error('Error cargando Kardex:', error);
    } finally {
      setIsLoading(false);
    }
  }, [makeRequest, filters]);

  useEffect(() => {
    loadKardex();
  }, [loadKardex]);

  // 3. Procesar Datos (Filtrado Local + Totales)
  const { movimientosFiltrados, resumen } = useMemo(() => {
    // A. Filtrar
    const filtered = rawMovimientos.filter(mov => {
      const matchMotivo = localFilterMotivo ? mov.motivo === localFilterMotivo : true;
      const matchSearch = localSearch 
        ? mov.observaciones?.toLowerCase().includes(localSearch.toLowerCase()) || 
          mov.productos_inventario.nombre.toLowerCase().includes(localSearch.toLowerCase())
        : true;
      return matchMotivo && matchSearch;
    });

    // B. Calcular Totales
    const stats = filtered.reduce((acc, curr) => {
      const valor = Number(curr.valor_total);
      if (curr.tipo_movimiento === 'ENTRADA') {
        acc.totalEntradas += valor;
        acc.cantidadEntradas += 1;
      } else {
        acc.totalSalidas += valor;
        acc.cantidadSalidas += 1;
      }
      return acc;
    }, { totalEntradas: 0, totalSalidas: 0, cantidadEntradas: 0, cantidadSalidas: 0 });

    return { movimientosFiltrados: filtered, resumen: stats };
  }, [rawMovimientos, localFilterMotivo, localSearch]);

  return {
    movimientos: movimientosFiltrados,
    resumen,
    productosFilter,
    isLoading,
    filters,
    setFilters,
    localFilterMotivo,
    setLocalFilterMotivo,
    localSearch,
    setLocalSearch,
    refresh: loadKardex
  };
};