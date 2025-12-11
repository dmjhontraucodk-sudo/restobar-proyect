import React, { useState } from 'react';
import { ReportsSales, ReportsInventory, ReportsFinance } from '@features/reports';
import { RolePerformanceReport as ReportsByRole } from '@features/reports/ui/RolePerformanceReport';
import { RefreshIcon } from '@shared/ui/Icons';
import { DollarSignIcon, PackageIcon, PiggyBankIcon, UsersIcon, ChevronRightIcon } from 'lucide-react';

// Definición de las pestañas con tipos más específicos
interface Tab {
    id: string;
    label: string;
    icon: React.ComponentType<any>;
    component: React.ComponentType<any>;
    color: 'blue' | 'green' | 'purple' | 'red';
}

const tabs: Tab[] = [
    { id: 'sales', label: 'Ventas y Órdenes', icon: DollarSignIcon, component: ReportsSales, color: 'blue' },
    { id: 'inventory', label: 'Inventario y Costos', icon: PackageIcon, component: ReportsInventory, color: 'green' },
    { id: 'finance', label: 'Finanzas, Gastos y Caja', icon: PiggyBankIcon, component: ReportsFinance, color: 'purple' },
    { id: 'role', label: 'Desempeño por Rol', icon: UsersIcon, component: ReportsByRole, color: 'red' },
];

const ReportsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState(tabs[0].id);
    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;
    const activeTabData = tabs.find(tab => tab.id === activeTab);

    // Función para manejar la recarga de datos
    const handleRefresh = () => {
        // Esta función podría comunicarse con los componentes hijos para recargar datos
        console.log('Recargando datos...');
    };

    // Función para obtener clases de color de manera segura
    const getColorClasses = (tab: Tab, isActive: boolean) => {
        const colorMap = {
            blue: {
                active: 'bg-blue-600 text-white shadow-md shadow-blue-200',
                inactive: 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
            },
            green: {
                active: 'bg-green-600 text-white shadow-md shadow-green-200',
                inactive: 'text-gray-700 hover:bg-green-50 hover:text-green-700'
            },
            purple: {
                active: 'bg-purple-600 text-white shadow-md shadow-purple-200',
                inactive: 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
            },
            red: {
                active: 'bg-red-600 text-white shadow-md shadow-red-200',
                inactive: 'text-gray-700 hover:bg-red-50 hover:text-red-700'
            }
        };

        const colorConfig = colorMap[tab.color] || colorMap.blue;
        return isActive ? colorConfig.active : colorConfig.inactive;
    };

    // Función para obtener clases de color del icono
    const getIconColorClass = (color: string) => {
        const colorMap: Record<string, string> = {
            blue: 'text-blue-600',
            green: 'text-green-600',
            purple: 'text-purple-600',
            red: 'text-red-600'
        };
        return colorMap[color] || 'text-blue-600';
    };

    // Función para obtener clases de fondo del icono
    const getIconBgClass = (color: string) => {
        const colorMap: Record<string, string> = {
            blue: 'bg-blue-100',
            green: 'bg-green-100',
            purple: 'bg-purple-100',
            red: 'bg-red-100'
        };
        return colorMap[color] || 'bg-blue-100';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header mejorado */}
                <div className="mb-8">
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                        <span>Dashboard</span>
                        <ChevronRightIcon className="w-4 h-4 mx-1" />
                        <span className="text-blue-600 font-medium">Reportes</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Módulo de Reportes</h1>
                            <p className="text-gray-600 mt-2 max-w-2xl">
                                Análisis detallado de Ventas, Inventario y Finanzas de tu restaurante.
                                Monitorea el rendimiento y toma decisiones basadas en datos.
                            </p>
                        </div>
                        <button
                            onClick={handleRefresh}
                            className="mt-4 md:mt-0 flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            <RefreshIcon className="w-5 h-5" />
                            <span>Actualizar datos</span>
                        </button>
                    </div>
                </div>

                {/* Contenedor de Pestañas mejorado */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    {/* Barra de Navegación de Pestañas mejorada */}
                    <div className="p-4 border-b border-gray-100 flex flex-wrap gap-2 md:gap-1">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                                        ${getColorClasses(tab, isActive)}
                                        ${isActive ? 'scale-105' : ''}
                                    `}
                                >
                                    <tab.icon className="w-5 h-5" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Indicador visual de pestaña activa */}
                    <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-green-500 to-purple-500 opacity-20"></div>

                    {/* Encabezado del contenido de la pestaña */}
                    {activeTabData && (
                        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${getIconBgClass(activeTabData.color)}`}>
                                    <activeTabData.icon className={`w-6 h-6 ${getIconColorClass(activeTabData.color)}`} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{activeTabData.label}</h2>
                                    <p className="text-gray-500 text-sm">
                                        {activeTab === 'sales' && 'Resumen de ventas, órdenes y tendencias de consumo'}
                                        {activeTab === 'inventory' && 'Estado del inventario, costos y niveles de stock'}
                                        {activeTab === 'finance' && 'Balance financiero, gastos y estado de caja'}
                                        {activeTab === 'role' && 'Desempeño de empleados agrupado por su rol en el sistema'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-sm text-gray-500">
                                Actualizado: {new Date().toLocaleDateString('es-ES')}
                            </div>
                        </div>
                    )}

                    {/* Contenido de la Pestaña Activa */}
                    <div className="p-6 bg-gray-50/50">
                        {ActiveComponent ? <ActiveComponent /> : (
                            <div className="text-center py-12 text-gray-500">
                                No hay datos disponibles para esta pestaña
                            </div>
                        )}
                    </div>
                </div>

                {/* Pie de página informativo */}
                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>Los datos se actualizan automáticamente cada 24 horas. Para información en tiempo real, utiliza el botón "Actualizar datos".</p>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;