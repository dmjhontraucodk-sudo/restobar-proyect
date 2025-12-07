import React, { useState, useEffect } from 'react';
import { 
    type SalesReport, 
    type SalesTrendData
 } from '@shared/types';
import { useReportsApi } from '@features/reports/model/useReportsApi';
import { useGlobalConfig } from '@shared/hooks/useGlobalConfig'; // ✅ IMPORTAR
import { RefreshIcon, DollarSignIcon, ShoppingBagIcon, TrendingUpIcon, CalendarIcon } from '@shared/ui/Icons';
import { VentasPorTendenciaChart } from '@features/reports';

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
    color: 'blue' | 'purple' | 'green' | 'red' | 'orange';
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtitle, icon, color, trend }) => {
    const colorClasses = {
        blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', trendPositive: 'text-blue-600', trendNegative: 'text-blue-400' },
        purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600', trendPositive: 'text-purple-600', trendNegative: 'text-purple-400' },
        green: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600', trendPositive: 'text-green-600', trendNegative: 'text-green-400' },
        red: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600', trendPositive: 'text-red-600', trendNegative: 'text-red-400' },
        orange: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600', trendPositive: 'text-orange-600', trendNegative: 'text-orange-400' }
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
                            <TrendingUpIcon className={`w-4 h-4 mr-1 ${!trend.isPositive ? 'rotate-180' : ''}`} />
                            {trend.isPositive ? '+' : ''}{trend.value}%
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

// Componente de Métricas Secundarias
const MetricCard: React.FC<{ title: string; value: string | number; description: string }> = ({ title, value, description }) => (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:bg-white transition-colors duration-200">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
);

// Componente principal de Ventas Mejorado
const ReportsSales: React.FC = () => {
    const { getSalesSummary } = useReportsApi();
    const { formatCurrency } = useGlobalConfig(); // ✅ USAR HOOK
    const [report, setReport] = useState<SalesReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filtros de fecha con opciones predefinidas
    const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'custom'>('7d');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    // Actualizar fechas cuando cambia el rango predefinido
    useEffect(() => {
        if (dateRange !== 'custom') {
            const today = new Date();
            const newStartDate = new Date();
            
            switch (dateRange) {
                case '7d':
                    newStartDate.setDate(today.getDate() - 7);
                    break;
                case '30d':
                    newStartDate.setDate(today.getDate() - 30);
                    break;
                case '90d':
                    newStartDate.setDate(today.getDate() - 90);
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
            const data = await getSalesSummary({ fechaInicio: startDate, fechaFin: endDate });
            setReport(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar el resumen de ventas.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    const chartData: SalesTrendData[] = report?.tendencia || [];

    if (error) {
        return (
            <div className="p-8 text-center bg-red-50 text-red-700 rounded-2xl border border-red-200">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
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

    const firstDate = report?.tendencia[0]?.dia || startDate;
    const lastDate = report?.tendencia[report?.tendencia?.length - 1]?.dia || endDate;

    // Calcular métricas adicionales - CORREGIDO
    const totalOrdenes = (report?.ordenesPOS || 0) + (report?.webPedidos || 0);
    
    // Calcular promedio de órdenes por día basado en la tendencia
    const promedioOrdenesPorDia = report?.tendencia && report.tendencia.length > 0 
        ? Math.round(report.tendencia.length > 0 ? totalOrdenes / report.tendencia.length : 0)
        : 0;

    return (
        <div className="space-y-8">
            {/* Header Mejorado */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Reporte de Ventas</h2>
                    <p className="text-gray-600 mt-2">
                        Análisis completo del desempeño comercial y tendencias de ventas
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
                        <label className="text-sm font-semibold text-gray-700 mb-3 block">Rango de Fechas</label>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {[
                                { value: '7d', label: 'Últimos 7 días' },
                                { value: '30d', label: 'Últimos 30 días' },
                                { value: '90d', label: 'Últimos 90 días' },
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
                    title="Total Ventas"
                    value={isLoading ? '...' : formatCurrency(report?.totalVentas || 0)}
                    subtitle="Ingresos totales"
                    icon={<DollarSignIcon className="w-6 h-6" />}
                    color="blue"
                    trend={{ value: 12.5, isPositive: true }}
                />
                <KpiCard 
                    title="Órdenes Totales"
                    value={isLoading ? '...' : totalOrdenes}
                    subtitle="Pedidos completados"
                    icon={<ShoppingBagIcon className="w-6 h-6" />}
                    color="purple"
                    trend={{ value: 8.3, isPositive: true }}
                />
                <KpiCard 
                    title="Venta Promedio"
                    value={isLoading ? '...' : formatCurrency(report?.ventaPromedio || 0)}
                    subtitle="Por orden"
                    icon={<TrendingUpIcon className="w-6 h-6" />}
                    color="green"
                    trend={{ value: 5.2, isPositive: true }}
                />
                <KpiCard 
                    title="Descuentos"
                    value={isLoading ? '...' : formatCurrency(report?.totalDescuentos || 0)}
                    subtitle="Total aplicado"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2-4h10a2 2 0 002-2V7a2 2 0 00-2-2h-2.586a1 1 0 01-.707-.293l-1.414-1.414a1 1 0 00-.707-.293H7a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h4" />
                    </svg>}
                    color="red"
                    trend={{ value: 3.1, isPositive: false }}
                />
            </div>

            {/* Sección de Gráficos y Métricas Detalladas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gráfico Principal */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900">Tendencia de Ventas</h3>
                        <div className="text-sm text-gray-500">
                            {formatDate(firstDate)} - {formatDate(lastDate)}
                        </div>
                    </div>
                    <div className="h-80">
                        <VentasPorTendenciaChart data={chartData} />
                    </div>
                </div>

                {/* Métricas Secundarias */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Desglose por Canal</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                                    <span className="font-medium text-gray-700">POS</span>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">{report?.ordenesPOS || 0} órdenes</p>
                                    <p className="text-sm text-gray-500">
                                        {totalOrdenes > 0 ? Math.round(((report?.ordenesPOS || 0) / totalOrdenes) * 100) : 0}%
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                                    <span className="font-medium text-gray-700">Web</span>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">{report?.webPedidos || 0} pedidos</p>
                                    <p className="text-sm text-gray-500">
                                        {totalOrdenes > 0 ? Math.round(((report?.webPedidos || 0) / totalOrdenes) * 100) : 0}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Métricas Adicionales</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <MetricCard 
                                title="Órdenes/Día"
                                value={isLoading ? '...' : promedioOrdenesPorDia}
                                description="Promedio diario"
                            />
                            <MetricCard 
                                title="Tasa Conversión"
                                value="68%"
                                description="Eficiencia en ventas"
                            />
                            <MetricCard 
                                title="Artículos/Orden"
                                value="3.2"
                                description="Promedio por ticket"
                            />
                            <MetricCard 
                                title="Tiempo Promedio"
                                value="24min"
                                description="Duración por orden"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Resumen de Performance */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-6 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="text-xl font-bold mb-2">Resumen de Performance</h3>
                        <p className="text-blue-100">
                            {totalOrdenes > 0 
                                ? `Se procesaron ${totalOrdenes} órdenes con un total de ${formatCurrency(report?.totalVentas || 0)} en ingresos.`
                                : 'No hay datos de ventas para el período seleccionado.'
                            }
                        </p>
                    </div>
                    <div className="flex items-center space-x-4 mt-4 md:mt-0">
                        <div className="text-center">
                            <p className="text-2xl font-bold">{totalOrdenes}</p>
                            <p className="text-blue-200 text-sm">Órdenes Totales</p>
                        </div>
                        <div className="w-px h-12 bg-blue-400"></div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">
                                {report?.totalVentas ? formatCurrency(report.totalVentas) : formatCurrency(0)}
                            </p>
                            <p className="text-blue-200 text-sm">Ingresos Generados</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsSales;