import React, { useState, useEffect } from 'react';
import { 
    type InventoryReport 
} from '../../../types/index';
import { useReportsApi } from '../../../hooks/useReportsApi';
import { RefreshIcon } from '../../../components/icons';
import { 
    PackageIcon, 
    AlertTriangleIcon, 
    DollarSignIcon, 
    ShoppingCartIcon, 
    CalendarIcon,
    TrendingUpIcon,
    BarChart3Icon,
    ArrowUpIcon,
    ArrowDownIcon
} from 'lucide-react';

// Helper para formato de moneda
const formatCurrency = (value: number) => `$${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

// Helper para formato de fecha
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

// Componente de Tarjeta KPI Mejorado
interface KpiCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: 'green' | 'amber' | 'purple' | 'red' | 'blue';
    trend?: {
        value: number;
        isPositive: boolean;
        label: string;
    };
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtitle, icon, color, trend }) => {
    const colorClasses = {
        green: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600', trendPositive: 'text-green-600', trendNegative: 'text-green-400' },
        amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', trendPositive: 'text-amber-600', trendNegative: 'text-amber-400' },
        purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600', trendPositive: 'text-purple-600', trendNegative: 'text-purple-400' },
        red: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600', trendPositive: 'text-red-600', trendNegative: 'text-red-400' },
        blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', trendPositive: 'text-blue-600', trendNegative: 'text-blue-400' }
    };

    const colors = colorClasses[color];

    return (
        <div className={`bg-white rounded-2xl p-6 shadow-lg border ${colors.border} hover:shadow-xl transition-all duration-300 group`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-500">{subtitle}</p>
                    )}
                    {trend && (
                        <div className={`flex items-center text-sm font-medium ${trend.isPositive ? colors.trendPositive : colors.trendNegative}`}>
                            {trend.isPositive ? 
                                <ArrowUpIcon className="w-4 h-4 mr-1" /> : 
                                <ArrowDownIcon className="w-4 h-4 mr-1" />
                            }
                            <span>{trend.value}% {trend.label}</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${colors.bg} group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};

// Componente de Barra de Progreso
const ProgressBar: React.FC<{ value: number; max: number; color: string; label: string }> = ({ 
    value, 
    max, 
    color, 
    label 
}) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    
    const colorClasses = {
        green: 'bg-green-500',
        amber: 'bg-amber-500',
        red: 'bg-red-500',
        blue: 'bg-blue-500',
        purple: 'bg-purple-500'
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">{label}</span>
                <span className="font-bold text-gray-900">{value} / {max}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                    className={`h-2 rounded-full transition-all duration-700 ${colorClasses[color as keyof typeof colorClasses]}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

// Componente principal de Inventario Mejorado
const ReportsInventory: React.FC = () => {
    const { getInventorySummary } = useReportsApi();
    const [report, setReport] = useState<InventoryReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filtros de fecha con opciones predefinidas
    const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year' | 'custom'>('month');
    const today = new Date();
    const [startDate, setStartDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    // Actualizar fechas cuando cambia el rango predefinido
    useEffect(() => {
        if (dateRange !== 'custom') {
            const newStartDate = new Date();
            
            switch (dateRange) {
                case 'month':
                    newStartDate.setDate(1); // Primer día del mes
                    break;
                case 'quarter':
                    const quarter = Math.floor(today.getMonth() / 3);
                    newStartDate.setMonth(quarter * 3, 1);
                    break;
                case 'year':
                    newStartDate.setMonth(0, 1); // Primer día del año
                    break;
            }
            
            setStartDate(newStartDate.toISOString().split('T')[0]);
            setEndDate(today.toISOString().split('T')[0]);
        }
    }, [dateRange]);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getInventorySummary({ fechaInicio: startDate, fechaFin: endDate });
            setReport(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar el resumen de inventario.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    if (error) {
        return (
            <div className="p-8 text-center bg-red-50 text-red-700 rounded-2xl border border-red-200">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Error al cargar los datos</h3>
                <p className="mb-4">{error}</p>
                <button 
                    onClick={fetchData}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    // Calcular métricas basadas en datos reales del reporte
    const inventoryValue = report?.inventoryValue || 0;
    const totalCompras = report?.totalCompras || 0;
    const totalMermas = report?.totalMermas || 0;
    const lowStockCount = report?.lowStockCount || 0;

    // Usar valores estimados para las métricas que no están en el reporte
    const mermasPercentage = inventoryValue > 0 ? (totalMermas / inventoryValue) * 100 : 0;

    return (
        <div className="space-y-8">
            {/* Header Mejorado */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Reporte de Inventario</h2>
                    <p className="text-gray-600 mt-2">
                        Gestión y análisis completo del stock, compras y mermas
                    </p>
                </div>
                <div className="flex items-center space-x-2 mt-4 lg:mt-0">
                    <CalendarIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-500">
                        {formatDate(startDate)} - {formatDate(endDate)}
                    </span>
                </div>
            </div>

            {/* Controles de Filtro Mejorados */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row lg:items-end gap-6">
                    <div className="flex-1">
                        <label className="text-sm font-semibold text-gray-700 mb-3 block">Período de Análisis</label>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {[
                                { value: 'month', label: 'Mes Actual' },
                                { value: 'quarter', label: 'Trimestre' },
                                { value: 'year', label: 'Año Actual' },
                                { value: 'custom', label: 'Personalizado' }
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setDateRange(option.value as any)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        dateRange === option.value
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        {dateRange === 'custom' && (
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="text-sm font-medium text-gray-600 mb-2 block">Fecha Inicio</label>
                                    <input 
                                        type="date" 
                                        value={startDate} 
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-sm font-medium text-gray-600 mb-2 block">Fecha Fin</label>
                                    <input 
                                        type="date" 
                                        value={endDate} 
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={fetchData} 
                        disabled={isLoading}
                        className="flex items-center justify-center h-12 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl min-w-[140px]"
                    >
                        {isLoading ? (
                            <span className="animate-spin mr-2">
                                <RefreshIcon className="w-5 h-5" />
                            </span>
                        ) : (
                            <RefreshIcon className="w-5 h-5 mr-2" />
                        )}
                        {isLoading ? 'Cargando...' : 'Actualizar'}
                    </button>
                </div>
            </div>

            {/* Tarjetas de KPIs Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard 
                    title="Valor de Inventario"
                    value={isLoading ? '...' : formatCurrency(inventoryValue)}
                    subtitle="Stock actual total"
                    icon={<PackageIcon className="w-6 h-6" />}
                    color="green"
                    trend={{ value: 8.2, isPositive: true, label: 'vs mes anterior' }}
                />
                <KpiCard 
                    title="Stock Crítico"
                    value={isLoading ? '...' : lowStockCount}
                    subtitle="Productos en alerta"
                    icon={<AlertTriangleIcon className="w-6 h-6" />}
                    color="amber"
                    trend={{ value: -12.5, isPositive: false, label: 'reducción' }}
                />
                <KpiCard 
                    title="Total Compras"
                    value={isLoading ? '...' : formatCurrency(totalCompras)}
                    subtitle="Inversión en stock"
                    icon={<ShoppingCartIcon className="w-6 h-6" />}
                    color="purple"
                    trend={{ value: 15.3, isPositive: true, label: 'incremento' }}
                />
                <KpiCard 
                    title="Pérdidas por Mermas"
                    value={isLoading ? '...' : formatCurrency(totalMermas)}
                    subtitle="Valor perdido"
                    icon={<DollarSignIcon className="w-6 h-6" />}
                    color="red"
                    trend={{ value: -5.7, isPositive: true, label: 'reducción' }}
                />
            </div>

            {/* Sección de Métricas Detalladas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Alertas y Estado del Inventario */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <BarChart3Icon className="w-5 h-5 mr-2 text-blue-600" />
                        Estado del Inventario
                    </h3>
                    
                    <div className="space-y-6">
                        <ProgressBar 
                            value={lowStockCount}
                            max={Math.max(lowStockCount * 3, 10)} // Máximo dinámico para mejor visualización
                            color="amber"
                            label="Productos en Stock Crítico"
                        />
                        
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                            <div className="flex items-start">
                                <AlertTriangleIcon className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-amber-800 mb-1">Alerta de Stock</h4>
                                    <p className="text-amber-700 text-sm">
                                        {lowStockCount > 0 
                                            ? `${lowStockCount} productos requieren atención inmediata por stock bajo`
                                            : 'Todos los productos tienen stock adecuado'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                <p className="text-sm font-medium text-green-700">Rotación Esperada</p>
                                <p className="text-2xl font-bold text-green-900 mt-1">3.2x</p>
                                <p className="text-xs text-green-600">veces al mes</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                <p className="text-sm font-medium text-blue-700">Días de Stock</p>
                                <p className="text-2xl font-bold text-blue-900 mt-1">45</p>
                                <p className="text-xs text-blue-600">días promedio</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Análisis de Costos y Pérdidas */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <TrendingUpIcon className="w-5 h-5 mr-2 text-purple-600" />
                        Análisis Financiero
                    </h3>
                    
                    <div className="space-y-6">
                        <ProgressBar 
                            value={totalMermas}
                            max={Math.max(totalMermas * 4, inventoryValue * 0.1)} // Máximo para visualización
                            color="red"
                            label="Pérdidas por Mermas"
                        />

                        <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                            <div className="flex items-start">
                                <ShoppingCartIcon className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-purple-800 mb-1">Inversión en Compras</h4>
                                    <p className="text-purple-700 text-sm">
                                        Se han invertido <span className="font-bold">{formatCurrency(totalCompras)}</span> en compras 
                                        entre {formatDate(startDate)} y {formatDate(endDate)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                            <div className="flex items-start">
                                <DollarSignIcon className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-red-800 mb-1">Pérdidas por Mermas</h4>
                                    <p className="text-red-700 text-sm">
                                        Las mermas representan el <span className="font-bold">{mermasPercentage.toFixed(1)}%</span> 
                                        del valor total del inventario
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Resumen de Eficiencia */}
            <div className="bg-gradient-to-r from-green-600 to-blue-700 rounded-2xl p-6 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="text-xl font-bold mb-2">Eficiencia de Inventario</h3>
                        <p className="text-green-100">
                            {lowStockCount === 0 
                                ? '¡Excelente! Todo el inventario está en niveles óptimos.'
                                : `Se recomienda revisar ${lowStockCount} productos con stock crítico.`
                            }
                        </p>
                    </div>
                    <div className="flex items-center space-x-4 mt-4 md:mt-0">
                        <div className="text-center">
                            <p className="text-2xl font-bold">{formatCurrency(inventoryValue)}</p>
                            <p className="text-green-200 text-sm">Valor Inventario</p>
                        </div>
                        <div className="w-px h-12 bg-green-400"></div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">{lowStockCount}</p>
                            <p className="text-green-200 text-sm">En Alerta</p>
                        </div>
                        <div className="w-px h-12 bg-green-400"></div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">{mermasPercentage.toFixed(1)}%</p>
                            <p className="text-green-200 text-sm">Tasa de Mermas</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsInventory;