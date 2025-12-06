// frontend/src/features/team/nomina/ui/NominaTab.tsx
import React, { useState, useMemo } from 'react';
import { type NominaResponse, type EmpleadoNomina } from '@shared/types';
import PagarNominaModal from './PagarNominaModal';
import { 
    DollarSignIcon, 
    UsersIcon, 
    XCircleIcon,
    SearchIcon, 
    FilterIcon,
    ChartBarIcon
} from '@shared/ui/Icons';
import { useTeamManagement } from '../../model/useTeamManagement'; // Importar useTeamManagement

interface NominaTabProps {
    nomina: NominaResponse | null;
    puedeVerSalarios: boolean;
    isLoading: boolean;
}

export const NominaTab: React.FC<NominaTabProps> = ({
    nomina,
    puedeVerSalarios,
    isLoading
}) => {
    const { reloadNomina } = useTeamManagement(); // Obtener reloadNomina del hook
    const [pagarEmpleadoId, setPagarEmpleadoId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Filtrado de empleados en tiempo real
    const filteredEmployees = useMemo(() => {
        if (!nomina?.empleados) return [];
        return nomina.empleados.filter((emp: EmpleadoNomina) => 
            (emp.nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (emp.rol?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
    }, [nomina, searchTerm]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN'
        }).format(amount);
    };

    // --- ESTADOS DE CARGA Y ERROR ---
    if (!puedeVerSalarios) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-slate-200">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <XCircleIcon className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Acceso Restringido</h3>
                <p className="text-slate-500 max-w-md text-center">
                    La información salarial es confidencial. Solo usuarios con rol de Administrador o Gerente pueden acceder a este módulo.
                </p>
            </div>
        );
    }

    if (isLoading || !nomina) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium">Cargando datos de nómina...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 font-sans text-slate-800">
            
            {/* --- SECCIÓN 1: KPIs (TARJETAS DE RESUMEN) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Total Mensual */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <DollarSignIcon className="w-24 h-24 text-blue-600 transform translate-x-4 -translate-y-4" />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Nómina</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(nomina.estadisticas.total_nomina_mensual)}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                            <DollarSignIcon className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1 mt-3">
                        <div className="bg-blue-500 h-1 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                </div>

                {/* Empleados */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">En Planilla</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">{nomina.estadisticas.total_empleados_con_salario}</h3>
                        </div>
                        <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                            <UsersIcon className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Colaboradores activos.</p>
                </div>

                {/* Promedio */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Salario Prom.</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(nomina.estadisticas.salario_promedio)}</h3>
                        </div>
                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                            <ChartBarIcon className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Max: {formatCurrency(nomina.estadisticas.salario_maximo)}</p>
                </div>

                {/* Mínimo */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Salario Mín.</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(nomina.estadisticas.salario_minimo)}</h3>
                        </div>
                        <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                            <DollarSignIcon className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Base más baja.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* --- SECCIÓN 2: LISTA DE EMPLEADOS (Columna ancha) --- */}
                <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                    
                    {/* Toolbar */}
                    <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <h3 className="font-bold text-slate-800">Detalle de Pagos</h3>
                        <div className="relative w-full sm:w-64">
                            <input 
                                type="text" 
                                placeholder="Buscar empleado..." 
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                    </div>

                    {/* Tabla */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3">Colaborador</th>
                                    <th className="px-6 py-3">Rol</th>
                                    <th className="px-6 py-3 text-right">Salario Base</th>
                                    <th className="px-6 py-3 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredEmployees.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-slate-400">No se encontraron resultados.</td></tr>
                                ) : (
                                    filteredEmployees.map((empleado: EmpleadoNomina) => (
                                        <tr key={empleado.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                                        {empleado.nombre?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-900">{empleado.nombre}</div>
                                                        <div className="text-xs text-slate-500">{empleado.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                    {empleado.rol}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-medium text-slate-700">
                                                {formatCurrency(empleado.salario)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={() => setPagarEmpleadoId(empleado.id)}
                                                    className="inline-flex items-center px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wide rounded-lg hover:bg-emerald-50 hover:border-emerald-300 transition-all"
                                                >
                                                    <DollarSignIcon className="w-3 h-3 mr-1.5" /> Pagar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- SECCIÓN 3: ANÁLISIS POR ROL (Lateral) --- */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 h-fit">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-800">Inversión por Rol</h3>
                        <FilterIcon className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="space-y-3">
                        {nomina.estadisticas.por_rol.map((rolData: any, index: number) => (
                            <div key={index} className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all">
                                <div className="flex justify-between mb-1">
                                    <span className="font-semibold text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{rolData.rol}</span>
                                    <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                                        {rolData.cantidad} emp.
                                    </span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Total</p>
                                        <p className="text-lg font-bold text-slate-900">{formatCurrency(rolData.total_salarios)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Promedio</p>
                                        <p className="text-sm font-medium text-slate-600">{formatCurrency(rolData.promedio)}</p>
                                    </div>
                                </div>
                                {/* Barra visual de proporción */}
                                <div className="w-full bg-slate-100 rounded-full h-1 mt-2 overflow-hidden">
                                    <div 
                                        className="bg-indigo-500 h-1 rounded-full" 
                                        style={{ width: `${(rolData.total_salarios / nomina.estadisticas.total_nomina_mensual) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MODAL DE PAGO */}
            <PagarNominaModal 
                isOpen={!!pagarEmpleadoId} 
                onClose={() => setPagarEmpleadoId(null)} 
                empleadoId={pagarEmpleadoId}
                onPaymentSuccess={() => {
                    setPagarEmpleadoId(null);
                    reloadNomina(); // Recargar la nómina después de un pago exitoso
                }}
            />
        </div>
    );
};
