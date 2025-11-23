import React from 'react';
import { useKardex } from '../../../hooks/useKardex';
import { 
  ClipboardListIcon, 
  FilterIcon,
  RotateCcwIcon // ✅ Importamos el icono para limpiar
} from '../../../components/icons';

const KardexPage = () => {
  const { movimientos, productosFilter, isLoading, filters, setFilters } = useKardex();

  // ✅ Función para resetear los filtros a su estado original
  const handleClearFilters = () => {
    setFilters({
      producto_id: '',
      fechaInicio: '',
      fechaFin: '',
      tipo_movimiento: ''
    });
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardListIcon className="w-8 h-8 text-blue-600" />
          Kardex Valorizado
        </h1>
        <p className="text-gray-500">Historial detallado de movimientos (Entradas y Salidas) del inventario.</p>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-end">
        
        {/* Filtro Producto */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Filtrar por Producto</label>
          <div className="relative">
            <select 
                className="w-full p-2 pl-8 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                value={filters.producto_id}
                onChange={e => setFilters({...filters, producto_id: e.target.value})}
            >
                <option value="">-- Todos los Productos --</option>
                {productosFilter.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
            </select>
            <div className="absolute left-2 top-2.5 pointer-events-none text-gray-400">
                <FilterIcon className="w-4 h-4" />
            </div>
          </div>
        </div>
        
        {/* Filtro Tipo */}
        <div className="w-40">
           <label className="block text-xs font-medium text-gray-500 mb-1">Tipo Movimiento</label>
           <select 
              className="w-full p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              value={filters.tipo_movimiento}
              onChange={e => setFilters({...filters, tipo_movimiento: e.target.value})}
           >
             <option value="">Todos</option>
             <option value="ENTRADA">Entradas (Compras)</option>
             <option value="SALIDA">Salidas (Ventas)</option>
           </select>
        </div>

        {/* Filtro Fechas */}
        <div className="flex gap-2">
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
                <input type="date" className="p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={filters.fechaInicio} onChange={e => setFilters({...filters, fechaInicio: e.target.value})} />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
                <input type="date" className="p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={filters.fechaFin} onChange={e => setFilters({...filters, fechaFin: e.target.value})} />
            </div>
        </div>

        {/* ✅ Botón Limpiar Filtros */}
        <button 
            onClick={handleClearFilters}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 hover:text-gray-800 transition-colors flex items-center gap-2 h-[38px]"
            title="Limpiar todos los filtros"
        >
            <RotateCcwIcon className="w-4 h-4" />
            Limpiar
        </button>

      </div>

      {/* Tabla de Resultados */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
           <div className="p-12 text-center flex flex-col items-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
             <span className="text-gray-500">Cargando movimientos...</span>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                <tr>
                  <th className="px-4 py-3">Fecha / Hora</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Movimiento</th>
                  <th className="px-4 py-3 text-right">Cantidad</th>
                  <th className="px-4 py-3 text-right">Costo Unit.</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center bg-gray-50 border-l">Saldo Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movimientos.length === 0 ? (
                   <tr><td colSpan={7} className="p-8 text-center text-gray-400">No se encontraron movimientos</td></tr>
                ) : (
                  movimientos.map((mov) => (
                    <tr key={mov.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        <div className="font-medium text-gray-700">{new Date(mov.fecha).toLocaleDateString()}</div>
                        <div className="text-xs">{new Date(mov.fecha).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                      </td>
                      
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{mov.productos_inventario.nombre}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{mov.observaciones}</div>
                        <div className="text-xs text-blue-500 mt-0.5">Ref: {mov.empleados?.nombre || 'Sistema'}</div>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          mov.tipo_movimiento === 'ENTRADA' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {mov.tipo_movimiento === 'ENTRADA' ? '⬇ Entrada' : '⬆ Salida'}
                        </span>
                        <div className="text-xs text-gray-400 mt-1 ml-1">{mov.motivo}</div>
                      </td>

                      <td className={`px-4 py-3 text-right font-bold ${mov.tipo_movimiento === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}`}>
                        {mov.tipo_movimiento === 'ENTRADA' ? '+' : '-'}{Number(mov.cantidad).toFixed(2)}
                        <span className="text-xs text-gray-400 ml-1 font-normal">
                            {mov.productos_inventario.unidades_medida?.abreviatura || 'und'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right text-gray-500">
                        S/ {Number(mov.costo_unitario).toFixed(2)}
                      </td>
                      
                      <td className="px-4 py-3 text-right font-medium text-gray-700">
                        S/ {Number(mov.valor_total).toFixed(2)}
                      </td>
                      
                      <td className="px-4 py-3 text-center font-bold bg-gray-50 text-blue-600 border-l border-gray-100">
                         {Number(mov.saldo_cantidad).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default KardexPage;