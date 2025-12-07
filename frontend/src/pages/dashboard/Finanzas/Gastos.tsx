import React, { useState, useEffect } from "react";
import { useDashboardApi } from '@shared/api/useDashboardApi';
import toast from "react-hot-toast";
import Modal from "@shared/ui/Modal/Modal";
import { useGlobalConfig } from '@shared/hooks/useGlobalConfig'; // ✅ IMPORTAR
import { type GastoOperativo, type TipoGasto } from '@shared/types';
import { 
  TrendingDownIcon, 
  PlusIcon, 
  TrashIcon, 
  CalendarIcon, 
  SearchIcon, 
  FilterIcon, 
  CurrencyDollarIcon 
} from "@shared/ui/Icons";

const Gastos: React.FC = () => {
  const { getGastosOperativos, createGastoOperativo, deleteGastoOperativo, getTiposGasto, isLoading } = useDashboardApi();
  const { formatCurrency, moneda } = useGlobalConfig(); // ✅ USAR HOOK

  const [gastos, setGastos] = useState<GastoOperativo[]>([]);
  const [tiposGasto, setTiposGasto] = useState<TipoGasto[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<"all" | number>("all");
  
  // Filtros de fecha
  const [fechas, setFechas] = useState({
    inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fin: new Date().toISOString().split('T')[0]
  });

  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    tipo_gasto_id: 0,
    fecha: new Date().toISOString().slice(0, 16),
    monto: '',
    numero_documento: "",
    descripcion: "",
    metodo_pago: "Efectivo",
  });

  useEffect(() => {
    loadData();
  }, [fechas]);

  const loadData = async () => {
    try {
      const [gastosData, tiposData] = await Promise.all([
        getGastosOperativos({ fechaInicio: fechas.inicio, fechaFin: fechas.fin }),
        getTiposGasto(),
      ]);

      const tiposNoInventario = tiposData.filter(
        (tipo) => tipo.afecta_inventario === false && tipo.activo
      );

      setGastos(gastosData);
      setTiposGasto(tiposNoInventario);
    } catch (error: any) {
      console.error("Error cargando datos:", error);
      toast.error(`Error: ${error.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.tipo_gasto_id === 0) return toast.error("Selecciona un tipo de gasto");
    if (Number(formData.monto) <= 0) return toast.error("El monto debe ser mayor a 0");

    try {
      await createGastoOperativo({
        tipo_gasto_id: formData.tipo_gasto_id,
        fecha: formData.fecha,
        monto: Number(formData.monto), 
        descripcion: formData.descripcion || undefined,
        numero_documento: formData.numero_documento || undefined,
        metodo_pago: formData.metodo_pago, 
      });

      toast.success("Gasto registrado exitosamente");
      setShowModal(false);
      setFormData({
        tipo_gasto_id: 0,
        fecha: new Date().toISOString().slice(0, 16),
        monto: '',
        numero_documento: "",
        descripcion: "",
        metodo_pago: "Efectivo",
      });
      loadData();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const handleDelete = async (id: number) => {
      if(!window.confirm("¿Estás seguro de eliminar este gasto? Esta acción no se puede deshacer.")) return;
      try {
          await deleteGastoOperativo(id);
          toast.success("Gasto eliminado");
          loadData();
      } catch (error: any) {
          toast.error(error.message);
      }
  }

  // Lógica de Filtrado
  const gastosFiltrados = gastos.filter((g) => {
      const matchTipo = filtroTipo === "all" || g.tipo_gasto_id === filtroTipo;
      const matchSearch = searchTerm === "" || 
          g.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) || 
          g.tipos_gasto.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      return matchTipo && matchSearch;
  });

  const totalGastos = gastosFiltrados.reduce((sum, g) => sum + Number(g.monto), 0);

  return (
    <div className="p-6 min-h-screen bg-slate-50/50 font-sans text-slate-800">
      
      {/* --- HEADER PRINCIPAL --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
             <div className="p-2 bg-rose-100 rounded-xl text-rose-600">
               <TrendingDownIcon className="w-8 h-8" />
             </div>
             Gastos Operativos
           </h1>
           <p className="text-slate-500 mt-2 ml-1">Gestiona los egresos y pagos de servicios de tu negocio.</p>
        </div>

        <div className="flex gap-3">
           {/* Selector de Fechas Compacto */}
           <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm p-1">
              <div className="px-3 border-r border-slate-100">
                <CalendarIcon className="w-5 h-5 text-slate-400" />
              </div>
              <input type="date" value={fechas.inicio} onChange={e => setFechas({...fechas, inicio: e.target.value})} className="border-none text-sm text-slate-600 bg-transparent focus:ring-0 cursor-pointer" />
              <span className="text-slate-300">→</span>
              <input type="date" value={fechas.fin} onChange={e => setFechas({...fechas, fin: e.target.value})} className="border-none text-sm text-slate-600 bg-transparent focus:ring-0 cursor-pointer" />
           </div>

           <button
             onClick={() => setShowModal(true)}
             className="bg-rose-600 text-white px-6 py-2.5 rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all font-medium flex items-center gap-2"
           >
             <PlusIcon className="w-5 h-5" /> Registrar Gasto
           </button>
        </div>
      </div>

      {/* --- TARJETAS KPI --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         {/* Total Gastado */}
         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Egresos</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-1">{formatCurrency(totalGastos)}</h3>
               </div>
               <div className="p-2 bg-rose-50 rounded-lg text-rose-500">
                  <CurrencyDollarIcon className="w-6 h-6" />
               </div>
            </div>
            <div className="mt-4 w-full bg-rose-50 rounded-full h-1.5">
               <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: '70%' }}></div>
            </div>
         </div>

         {/* Cantidad de Movimientos */}
         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Movimientos</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-1">{gastosFiltrados.length}</h3>
               </div>
               <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
                  <FilterIcon className="w-6 h-6" />
               </div>
            </div>
            <p className="text-xs text-slate-400 mt-4">Registros encontrados con los filtros actuales.</p>
         </div>

         {/* Promedio */}
         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gasto Promedio</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-1">
                     {gastosFiltrados.length > 0 ? formatCurrency(totalGastos / gastosFiltrados.length) : formatCurrency(0)}
                  </h3>
               </div>
               <div className="p-2 bg-purple-50 rounded-lg text-purple-500">
                  <TrendingDownIcon className="w-6 h-6" />
               </div>
            </div>
            <p className="text-xs text-slate-400 mt-4">Media por transacción registrada.</p>
         </div>
      </div>

      {/* --- BARRA DE FILTROS Y BÚSQUEDA --- */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
         {/* Chips de Categoría */}
         <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
            <button
               onClick={() => setFiltroTipo("all")}
               className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                  filtroTipo === "all" 
                  ? "bg-slate-800 text-white border-slate-800" 
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
               }`}
            >
               Todos
            </button>
            {tiposGasto.map((tipo) => (
               <button
                  key={tipo.id}
                  onClick={() => setFiltroTipo(tipo.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border flex items-center gap-2 ${
                     filtroTipo === tipo.id
                     ? "bg-slate-800 text-white border-slate-800"
                     : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
               >
                  <span>{tipo.icono}</span> {tipo.nombre}
               </button>
            ))}
         </div>

         {/* Buscador */}
         <div className="relative w-full md:w-64">
            <input 
               type="text" 
               placeholder="Buscar por descripción..." 
               className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
            />
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
         </div>
      </div>

      {/* --- TABLA DE DATOS --- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
         {isLoading ? (
            <div className="p-12 text-center">
               <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600 mx-auto mb-3"></div>
               <p className="text-slate-500">Cargando registros...</p>
            </div>
         ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                     <tr>
                        <th className="px-6 py-4 w-48">Fecha</th>
                        <th className="px-6 py-4">Descripción / Tipo</th>
                        <th className="px-6 py-4">Referencia</th>
                        <th className="px-6 py-4">Método</th>
                        <th className="px-6 py-4 text-right">Monto</th>
                        <th className="px-6 py-4 text-center w-20">Acción</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {gastosFiltrados.length === 0 ? (
                        <tr>
                           <td colSpan={6} className="p-12 text-center text-slate-400">
                              <div className="mb-2 text-4xl">📭</div>
                              No se encontraron gastos con los filtros actuales.
                           </td>
                        </tr>
                     ) : (
                        gastosFiltrados.map((gasto) => (
                           <tr key={gasto.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="px-6 py-4">
                                 <div className="font-medium text-slate-900">
                                    {new Date(gasto.fecha).toLocaleDateString("es-PE", { day: '2-digit', month: 'short', year: 'numeric' })}
                                 </div>
                                 <div className="text-xs text-slate-400">
                                    {new Date(gasto.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-lg">
                                       {gasto.tipos_gasto.icono || "🧾"}
                                    </div>
                                    <div>
                                       <div className="font-medium text-slate-900">{gasto.tipos_gasto.nombre}</div>
                                       {gasto.descripcion && <div className="text-xs text-slate-500 mt-0.5">{gasto.descripcion}</div>}
                                    </div>
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                 {gasto.numero_documento || <span className="text-slate-300">-</span>}
                              </td>
                              <td className="px-6 py-4">
                                 <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                    {gasto.metodo_pago || 'Efectivo'}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <span className="font-bold text-rose-600 text-base">
                                    - {formatCurrency(Number(gasto.monto))}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                 <button 
                                    onClick={() => handleDelete(gasto.id)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    title="Eliminar Registro"
                                 >
                                    <TrashIcon className="w-4 h-4" />
                                 </button>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         )}
      </div>

      {/* --- MODAL --- */}
      {showModal && (
        <Modal onClose={() => setShowModal(false)} title="Registrar Nuevo Gasto">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Selector Tipo */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Categoría de Gasto</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                 {tiposGasto.map((tipo) => (
                    <label 
                       key={tipo.id} 
                       className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          formData.tipo_gasto_id === tipo.id 
                          ? 'border-rose-500 bg-rose-50 text-rose-700' 
                          : 'border-slate-200 hover:border-slate-300'
                       }`}
                    >
                       <input 
                          type="radio" 
                          name="tipoGasto" 
                          value={tipo.id}
                          checked={formData.tipo_gasto_id === tipo.id}
                          onChange={() => setFormData({...formData, tipo_gasto_id: tipo.id})}
                          className="hidden"
                       />
                       <span className="text-xl">{tipo.icono}</span>
                       <span className="text-sm font-medium">{tipo.nombre}</span>
                    </label>
                 ))}
              </div>
            </div>

            {/* Grid Fecha/Monto */}
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha</label>
                  <input 
                    type="datetime-local" 
                    required 
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                    value={formData.fecha}
                    onChange={e => setFormData({...formData, fecha: e.target.value})}
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Monto ({moneda.simbolo})</label>
                  <div className="relative">
                     <input 
                       type="number" 
                       step="0.01" 
                       required 
                       placeholder="0.00"
                       className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                       value={formData.monto}
                       onChange={e => setFormData({...formData, monto: e.target.value})}
                     />
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{moneda.simbolo}</span>
                  </div>
               </div>
            </div>

            {/* Descripción y Documento */}
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Descripción</label>
               <input 
                 type="text" 
                 placeholder="Ej. Recibo de Luz del Sur - Agosto"
                 className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                 value={formData.descripcion}
                 onChange={e => setFormData({...formData, descripcion: e.target.value})}
               />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Método Pago</label>
                  <select 
                     className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none bg-white"
                     value={formData.metodo_pago}
                     onChange={e => setFormData({...formData, metodo_pago: e.target.value})}
                  >
                     <option>Efectivo</option>
                     <option>Tarjeta</option>
                     <option>Transferencia</option>
                     <option>Yape/Plin</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">N° Documento</label>
                  <input 
                    type="text" 
                    placeholder="Opcional"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                    value={formData.numero_documento}
                    onChange={e => setFormData({...formData, numero_documento: e.target.value})}
                  />
               </div>
            </div>

            {/* Footer Modal */}
            <div className="flex gap-3 pt-4 border-t border-slate-100">
               <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition-colors">
                  Cancelar
               </button>
               <button type="submit" className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-medium shadow-lg shadow-rose-200 transition-all">
                  Guardar Gasto
               </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Gastos;