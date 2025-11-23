import React, { useState, useEffect } from 'react';
import { useDashboardApi } from '../../../hooks/useDashboardApi';
import { 
  CurrencyDollarIcon, 
  TrendingDownIcon, 
  ChartBarIcon,
  CalendarIcon,
} from '../../../components/dashboard/Sidebar/icons';

const FinancialPage = () => {
  const { getResumenFinanciero } = useDashboardApi();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Estado para fechas (Por defecto: Mes actual)
  const [fechas, setFechas] = useState({
    inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], 
    fin: new Date().toISOString().split('T')[0]
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getResumenFinanciero(fechas.inicio, fechas.fin);
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [fechas]);

  if (loading && !data) return (
    <div className="flex flex-col justify-center items-center h-[80vh] bg-slate-50">
      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-medium text-sm tracking-wide">ANALIZANDO DATOS...</p>
    </div>
  );

  if (!data && !loading) return (
    <div className="p-10 text-center">
      <p className="text-slate-500">No se pudo cargar la información.</p>
      <button onClick={loadData} className="mt-4 text-blue-600 font-medium hover:underline">Reintentar</button>
    </div>
  );

  const { resumen, detalles } = data;
  const isProfitable = resumen.utilidad >= 0;
  
  // Cálculos para barras de porcentaje
  const totalGastos = Math.max(resumen.egresos, 1); // Evitar división por 0
  const pctCompras = (detalles.total_compras_insumos / totalGastos) * 100;
  const pctOperativos = (detalles.total_gastos_operativos / totalGastos) * 100;

  return (
    <div className="p-8 min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Resumen Financiero</h1>
          <p className="text-slate-500 mt-2">Estado de resultados y rentabilidad del negocio.</p>
        </div>
        
        {/* Selector de Fechas "Cápsula" */}
        <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex items-center">
          <div className="px-4 py-2 flex items-center border-r border-slate-100">
            <CalendarIcon className="w-5 h-5 text-slate-400 mr-2" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Periodo</span>
          </div>
          <input 
            type="date" 
            value={fechas.inicio} 
            onChange={e => setFechas({...fechas, inicio: e.target.value})}
            className="border-none text-sm text-slate-700 focus:ring-0 bg-transparent cursor-pointer font-medium"
          />
          <span className="text-slate-300 px-2">→</span>
          <input 
            type="date" 
            value={fechas.fin} 
            onChange={e => setFechas({...fechas, fin: e.target.value})}
            className="border-none text-sm text-slate-700 focus:ring-0 bg-transparent cursor-pointer font-medium"
          />
        </div>
      </div>

      {/* --- KPIs PRINCIPALES --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* 1. INGRESOS */}
        <div className="bg-white p-8 rounded-3xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex justify-between items-start mb-6">
            <div>
               <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Ingresos Totales</p>
               <h3 className="text-4xl font-bold text-slate-900 tracking-tight">S/ {resumen.ingresos.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <CurrencyDollarIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
             <span className="flex items-center text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-lg">
               <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
               {detalles.ventas_cantidad}
             </span>
             <span className="text-slate-400">operaciones de venta</span>
          </div>
        </div>

        {/* 2. EGRESOS */}
        <div className="bg-white p-8 rounded-3xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex justify-between items-start mb-6">
            <div>
               <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Egresos Totales</p>
               <h3 className="text-4xl font-bold text-slate-900 tracking-tight">S/ {resumen.egresos.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-3 bg-rose-50 rounded-2xl text-rose-500">
              <TrendingDownIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
             <div className="bg-rose-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${Math.min((resumen.egresos / (resumen.ingresos || 1)) * 100, 100)}%` }}></div>
          </div>
          <p className="text-xs text-slate-400 text-right">
            Representa el <span className="font-medium text-slate-600">{((resumen.egresos / (resumen.ingresos || 1)) * 100).toFixed(1)}%</span> de tus ingresos
          </p>
        </div>

        {/* 3. UTILIDAD NETA */}
        <div className={`p-8 rounded-3xl shadow-lg border relative overflow-hidden text-white transition-all duration-300
            ${isProfitable 
              ? 'bg-gradient-to-br from-blue-600 to-indigo-600 border-transparent shadow-blue-200' 
              : 'bg-gradient-to-br from-slate-700 to-slate-800 border-transparent shadow-slate-200'}`}
        >
           {/* Patrón de fondo sutil */}
           <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
           
           <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                   <p className="text-sm font-bold text-white/80 uppercase tracking-wider mb-1">Utilidad Neta</p>
                   <h3 className="text-4xl font-bold text-white tracking-tight">S/ {resumen.utilidad.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl text-white">
                  <ChartBarIcon className="w-6 h-6" />
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
                 <div className="flex flex-col">
                    <span className="text-xs text-white/60 uppercase font-semibold">Margen</span>
                    <span className="text-lg font-bold">{resumen.margen}</span>
                 </div>
                 <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide ${isProfitable ? 'bg-emerald-500/20 text-emerald-100' : 'bg-rose-500/20 text-rose-100'}`}>
                    {isProfitable ? 'Rentable' : 'Déficit'}
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* --- SECCIÓN DE DETALLE --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Panel de Gastos (Barras de Progreso) */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
           <h3 className="text-lg font-bold text-slate-800 mb-6">Estructura de Costos</h3>
           
           {/* Compras */}
           <div className="mb-6 group">
              <div className="flex justify-between mb-2">
                 <span className="text-sm font-medium text-slate-600">Compras de Inventario</span>
                 <span className="text-sm font-bold text-slate-800">S/ {detalles.total_compras_insumos.toFixed(2)}</span>
              </div>
              <div className="w-full bg-slate-50 rounded-full h-3 overflow-hidden">
                 <div className="bg-purple-500 h-3 rounded-full transition-all duration-1000 group-hover:bg-purple-600" style={{ width: `${pctCompras}%` }}></div>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">{detalles.compras_cantidad} movimientos de stock ({pctCompras.toFixed(1)}% del total)</p>
           </div>

           {/* Operativos */}
           <div className="group">
              <div className="flex justify-between mb-2">
                 <span className="text-sm font-medium text-slate-600">Gastos Operativos</span>
                 <span className="text-sm font-bold text-slate-800">S/ {detalles.total_gastos_operativos.toFixed(2)}</span>
              </div>
              <div className="w-full bg-slate-50 rounded-full h-3 overflow-hidden">
                 <div className="bg-orange-400 h-3 rounded-full transition-all duration-1000 group-hover:bg-orange-500" style={{ width: `${pctOperativos}%` }}></div>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">{detalles.gastos_cantidad} registros de servicios/varios ({pctOperativos.toFixed(1)}% del total)</p>
           </div>
        </div>

        {/* Insights Card */}
        <div className="flex flex-col justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl text-white shadow-xl shadow-slate-200">
           <div className="mb-4 p-3 bg-white/10 w-fit rounded-2xl">
              <svg className="w-6 h-6 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           </div>
           <h3 className="text-xl font-bold mb-2">Análisis del Periodo</h3>
           <p className="text-slate-300 text-sm leading-relaxed mb-6">
             {isProfitable 
               ? `Tu negocio está generando valor. Por cada S/ 100.00 que vendes, te estás quedando con una ganancia neta de S/ ${((resumen.utilidad / (resumen.ingresos || 1)) * 100).toFixed(2)} después de cubrir todos tus costos.`
               : `Alerta: Tus costos superan tus ingresos. Se recomienda revisar los gastos operativos o ajustar precios de venta para mejorar el margen.`}
           </p>
           <div className="mt-auto pt-6 border-t border-white/10 flex justify-between items-center">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Estado Actual</span>
              <span className={`text-sm font-bold ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isProfitable ? '● Saludable' : '● Requiere Atención'}
              </span>
           </div>
        </div>

      </div>
    </div>
  );
};

export default FinancialPage;