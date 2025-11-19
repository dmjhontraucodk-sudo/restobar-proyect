// frontend/src/components/team/NominaTab.tsx
import React from 'react';
import { type NominaResponse } from '../../types';
import { 
    DollarSignIcon, 
    UsersIcon, 
    CalendarIcon,
    XCircleIcon 
} from '../icons';

interface NominaTabProps {
    nomina: NominaResponse | null;
    puedeVerSalarios: boolean;
    isLoading: boolean;
}

const StatsCard: React.FC<{
    title: string;
    value: string;
    subtitle?: string;
    color: string;
    icon: React.ReactNode;
}> = ({ title, value, subtitle, color, icon }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className={`p-2 rounded-lg ${color}`}>
                {icon}
            </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
);

export const NominaTab: React.FC<NominaTabProps> = ({
    nomina,
    puedeVerSalarios,
    isLoading
}) => {
    if (!puedeVerSalarios) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircleIcon className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceso Restringido</h3>
                <p className="text-gray-600">
                    Solo el Administrador y Gerentes pueden ver la información de nómina.
                </p>
            </div>
        );
    }

    if (isLoading || !nomina) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN'
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Nómina del Personal</h2>
                <p className="text-gray-600 mt-1">
                    Vista general de salarios y estadísticas del equipo
                </p>
            </div>

            {/* Estadísticas Generales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Nómina Mensual"
                    value={formatCurrency(nomina.estadisticas.total_nomina_mensual)}
                    color="bg-blue-100 text-blue-600"
                    icon={<DollarSignIcon className="w-5 h-5" />}
                />
                <StatsCard
                    title="Empleados con Salario"
                    value={nomina.estadisticas.total_empleados_con_salario.toString()}
                    color="bg-purple-100 text-purple-600"
                    icon={<UsersIcon className="w-5 h-5" />}
                />
                <StatsCard
                    title="Salario Promedio"
                    value={formatCurrency(nomina.estadisticas.salario_promedio)}
                    subtitle={`Max: ${formatCurrency(nomina.estadisticas.salario_maximo)}`}
                    color="bg-green-100 text-green-600"
                    icon={<DollarSignIcon className="w-5 h-5" />}
                />
                <StatsCard
                    title="Salario Mínimo"
                    value={formatCurrency(nomina.estadisticas.salario_minimo)}
                    color="bg-amber-100 text-amber-600"
                    icon={<DollarSignIcon className="w-5 h-5" />}
                />
            </div>

            {/* Tabla de Salarios por Rol */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Distribución por Rol</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Rol</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Empleados</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Total</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Promedio</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {nomina.estadisticas.por_rol.map((rolData, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {rolData.rol}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {rolData.cantidad}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                                        {formatCurrency(rolData.total_salarios)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                                        {formatCurrency(rolData.promedio)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Tabla de Empleados con Salario */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Detalle de Empleados</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Empleado</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Rol</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Fecha Ingreso</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Salario</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {nomina.nomina.map((empleado) => (
                                <tr key={empleado.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xs mr-3">
                                                {empleado.nombre?.charAt(0) || empleado.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {empleado.nombre || 'Sin nombre'}
                                                </div>
                                                <div className="text-xs text-gray-500">{empleado.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                            {empleado.rol}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        <div className="flex items-center">
                                            <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                                            {empleado.fecha_ingreso 
                                                ? new Date(empleado.fecha_ingreso).toLocaleDateString('es-PE')
                                                : 'No registrada'
                                            }
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                                        {formatCurrency(empleado.salario)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {nomina.nomina.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No hay empleados con salario registrado</p>
                    </div>
                )}
            </div>
        </div>
    );
};