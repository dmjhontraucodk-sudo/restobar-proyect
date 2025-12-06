import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDashboardApi } from '@shared/api/useDashboardApi';
import { type CajaHistorialItem } from '@shared/types';
import { 
  CalendarIcon, 
  SearchIcon,
  ClipboardListIcon
} from '@shared/ui/Icons';

// Icono de Flecha para regresar (Definido localmente para evitar errores de importación)
const ArrowLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const HistorialCajasPage = () => {
  const { makeRequest } = useDashboardApi();
  const [historial, setHistorial] = useState<CajaHistorialItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filtros de fecha (Default: últimos 7 días)
  const today = new Date();
  const lastWeek = new Date();
  lastWeek.setDate(today.getDate() - 7);

  const [fechas, setFechas] = useState({
    inicio: lastWeek.toISOString().split('T')[0],
    fin: today.toISOString().split('T')[0]
  });

  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('fechaInicio', fechas.inicio);
      params.append('fechaFin', fechas.fin);
      
      const data = await makeRequest<CajaHistorialItem[]>(`/caja/historial?${params.toString()}`);
      setHistorial(data);
    } catch (error) {
      console.error("Error cargando historial:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []); 

  return (
    <div className="p-6 min-h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* --- ENCABEZADO CON NAVEGACIÓN --- */}
      <div className="mb-8">
        <Link 
          to="/dashboard/caja" 
          className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 mb-4 transition-colors group"
        >
          <div className="p-1 rounded-full bg-white border border-gray-200 group-hover:border-blue-200 mr-2 shadow-sm">
             <ArrowLeftIcon className="w-4 h-4" />
          </div>
          Volver a Gestión de Caja Actual
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <ClipboardListIcon className="w-6 h-6" />
              </div>
              Historial de Cierres
            </h1>
            <p className="text-sm text-gray-500 mt-1 ml-12">
              Auditoría de turnos, responsables y cuadres de efectivo.
            </p>
          </div>
        </div>
      </div>

      {/* --- BARRA DE FILTROS --- */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Desde</label>
                    <div className="relative group">
                      <input 
                        type="date" 
                        className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                        value={fechas.inicio} 
                        onChange={e => setFechas({...fechas, inicio: e.target.value})} 
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <CalendarIcon className="w-5 h-5" />
                      </div>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Hasta</label>
                    <div className="relative group">
                      <input 
                        type="date" 
                        className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                        value={fechas.fin} 
                        onChange={e => setFechas({...fechas, fin: e.target.value})} 
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <CalendarIcon className="w-5 h-5" />
                      </div>
                    </div>
                </div>
            </div>
            
            <button 
                onClick={cargarHistorial}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-sm hover:shadow flex items-center justify-center gap-2 transition-all"
            >
                <SearchIcon className="w-4 h-4" /> 
                Buscar Cierres
            </button>
        </div>
      </div>

      {/* --- TABLA DE HISTORIAL --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
           <div className="p-20 text-center flex flex-col items-center justify-center">
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
             <span className="text-gray-500 font-medium">Cargando historial...</span>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Responsable</th>
                  <th className="px-6 py-4">Apertura / Cierre</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right">Fondo Inicial</th>
                  <th className="px-6 py-4 text-right">Esperado</th>
                  <th className="px-6 py-4 text-right">Real (Conteo)</th>
                  <th className="px-6 py-4 text-center">Diferencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historial.length === 0 ? (
                   <tr>
                     <td colSpan={7} className="p-12 text-center text-gray-400 italic">
                       No se encontraron registros de caja en este rango de fechas.
                     </td>
                   </tr>
                ) : (
                  historial.map((caja) => {
                    const diff = Number(caja.diferencia);
                    // Lógica de colores para la diferencia
                    const isPerfect = diff === 0;
                    const isPositive = diff > 0;

                    return (
                      <tr key={caja.id} className="hover:bg-gray-50 transition-colors group">
                        
                        {/* Responsable */}
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{caja.empleados?.nombre || 'Usuario Desconocido'}</div>
                          <div className="text-xs text-gray-400">ID Caja: #{caja.id}</div>
                        </td>

                        {/* Fechas */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <div className="text-xs text-gray-500">
                              <span className="font-semibold text-green-700">IN:</span> {new Date(caja.fecha_apertura).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </div>
                            <div className="text-xs text-gray-500">
                              <span className="font-semibold text-red-700">OUT:</span> {caja.fecha_cierre ? new Date(caja.fecha_cierre).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '---'}
                            </div>
                          </div>
                        </td>

                        {/* Estado */}
                        <td className="px-6 py-4 text-center">
                          {caja.fecha_cierre ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Cerrada
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 animate-pulse">
                              Abierta
                            </span>
                          )}
                        </td>

                        {/* Montos */}
                        <td className="px-6 py-4 text-right text-gray-500">
                          S/ {Number(caja.monto_inicial).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-700">
                          S/ {Number(caja.monto_esperado).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-blue-600 bg-blue-50/30">
                          S/ {caja.monto_real ? Number(caja.monto_real).toFixed(2) : '-'}
                        </td>

                        {/* Diferencia (Semáforo) */}
                        <td className="px-6 py-4 text-center">
                           {caja.fecha_cierre ? (
                             <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border ${
                               isPerfect ? 'bg-gray-50 text-gray-600 border-gray-200' : 
                               isPositive ? 'bg-green-50 text-green-700 border-green-200' : 
                               'bg-red-50 text-red-700 border-red-200'
                             }`}>
                               {isPositive && '+'}{diff.toFixed(2)}
                             </span>
                           ) : (
                             <span className="text-xs text-gray-400 italic">Pendiente</span>
                           )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="text-center text-xs text-gray-400 mt-6">
        Mostrando cierres del periodo seleccionado. Los montos están en Soles (S/).
      </div>
    </div>
  );
};

export default HistorialCajasPage;