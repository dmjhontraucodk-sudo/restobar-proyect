import React, { useState, useEffect } from 'react';
import {
    type FinanceReport, 
} from '@shared/types';
import { useReportsApi } from '@features/reports/model/useReportsApi';
// Importamos todos los íconos de la librería local
import { 
    RefreshIcon, 
    TrendingUpIcon, 
    DollarSignIcon, 
    AlertOctagonIcon, 
    BarChart3Icon 
} from '@shared/ui/Icons';
// Helper para formato de moneda
const formatCurrency = (value: number) => `$${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

// Componente de Tarjeta KPI
interface KpiCardProps {
    title: string;
    value: React.ReactNode; 
    icon: React.ReactNode;
    colorClasses: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, colorClasses }) => (
    <div className={`bg-white rounded-2xl p-6 shadow-md border ${colorClasses.replace('bg-', 'border-')}`}>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            </div>
            <div className={`p-3 rounded-xl ${colorClasses}`}>
                {icon}
            </div>
        </div>
    </div>
);

// Componente principal de Finanzas
const ReportsFinance: React.FC = () => {
    const { getFinanceSummary } = useReportsApi();
    const [report, setReport] = useState<FinanceReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // **********************************************
    // 1. CORRECCIÓN: Mover la función utilitaria aquí
    // **********************************************
    // Función para obtener color de margen
    const getMarginColor = (value: number) => {
        if (value > 0) return 'text-green-600';
        if (value < 0) return 'text-red-600';
        return 'text-gray-600';
    }
    // **********************************************


    // Filtros de fecha: Por defecto, Últimos 30 días
    const today = new Date();
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date(today);
        d.setDate(today.getDate() - 30);
        return d.toISOString().split('T')[0];
    });

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getFinanceSummary({ fechaInicio: startDate, fechaFin: endDate });
            setReport(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar el resumen financiero.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]); // Recargar al cambiar el rango de fechas

    if (error) {
        return <div className="p-8 text-center bg-red-50 text-red-700 rounded-xl border border-red-200">{error}</div>;
    }

    // Usamos JSX para el valor cuando el reporte está cargando
    const LoadingValue = (
        <span className="text-3xl font-bold text-gray-400">...</span>
    );
    
    // Obtenemos los valores finales o el placeholder de carga
    const totalIngresosDisplay = isLoading ? LoadingValue : formatCurrency(report?.totalIngresos || 0);
    const totalGastosDisplay = isLoading ? LoadingValue : formatCurrency(report?.totalGastos || 0);
    const totalSobranteDisplay = isLoading ? LoadingValue : formatCurrency(report?.totalSobrante || 0);
    
    // El margen bruto necesita un manejo especial para el color
    const margenBrutoValue = report?.margenBruto || 0;
    const margenBrutoDisplay = isLoading 
        ? LoadingValue
        : (
            <span className={`text-3xl font-bold ${getMarginColor(margenBrutoValue)}`}>
                {formatCurrency(margenBrutoValue)}
            </span>
        );
    
    // NOTA: getMarginColor ya está definida arriba y es accesible aquí.
    
    // Ordenar gastos por monto
    const sortedGastos = report?.gastosPorTipo.sort((a, b) => b.total - a.total) || [];

    // Calcular el porcentaje de cada método de pago
    const totalPayments = report?.ingresosPorMetodo.reduce((sum, p) => sum + p.total, 0) || 1;
    const paymentMethods = report?.ingresosPorMetodo.map(p => ({
        ...p,
        percentage: (p.total / totalPayments) * 100,
    })).sort((a, b) => b.total - a.total) || [];

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900">Métricas de Finanzas, Gastos y Caja</h2>

             {/* Controles de Filtro */}
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row items-end gap-4">
                <div className="flex-1 space-y-1 w-full">
                    <label className="text-sm font-medium text-gray-700">Rango de Fechas</label>
                    <div className='flex items-center space-x-2'>
                        <input 
                            type="date" 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)}
                            className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            disabled={isLoading}
                        />
                        <span className="text-gray-500">a</span>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)}
                            className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            disabled={isLoading}
                        />
                    </div>
                    {/* {DEBUG} <p>{`${startDate} - ${endDate}`}</p> */}
                </div>
                <button 
                    onClick={fetchData} 
                    disabled={isLoading}
                    className="flex items-center justify-center h-12 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
                >
                    {isLoading ? (
                        <span className="animate-spin mr-2">
                            <RefreshIcon className="w-5 h-5" />
                        </span>
                    ) : (
                        <RefreshIcon className="w-5 h-5 mr-2" />
                    )}
                    Aplicar
                </button>
            </div>

            {/* Tarjetas de Resumen (KPIs) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard 
                    title="Total Ingresos (Ventas)"
                    value={totalIngresosDisplay}
                    icon={<DollarSignIcon className="w-6 h-6 text-green-600" />}
                    colorClasses="bg-green-100"
                />
                <KpiCard 
                    title="Total Gastos (Operativos + Compras)"
                    value={totalGastosDisplay}
                    icon={<AlertOctagonIcon className="w-6 h-6 text-red-600" />}
                    colorClasses="bg-red-100"
                />
                <KpiCard 
                    title="Margen Bruto (Ingresos - Gastos)"
                    value={margenBrutoDisplay} // Aquí ya es un span o un string, sin error de tipo
                    icon={<TrendingUpIcon className="w-6 h-6 text-blue-600" />}
                    colorClasses="bg-blue-100"
                />
                <KpiCard 
                    title="Sobrante en Cajas"
                    value={totalSobranteDisplay}
                    icon={<svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c1.657 0 3 .895 3 2s-1.343 2-3 2a3 3 0 00-3 3v2m-2-2h10a2 2 0 002-2V7a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>}
                    colorClasses="bg-amber-100"
                />
            </div>

            {/* Gráficos de Distribución */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Distribución de Pagos */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <BarChart3Icon className="w-5 h-5 mr-2 text-green-600" /> Ingresos por Método de Pago
                    </h3>
                    <div className="space-y-3">
                        {paymentMethods.map(p => (
                            <div key={p.metodo} className="space-y-1">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-gray-700">{p.metodo}</span>
                                    <span className="font-bold text-gray-900">{formatCurrency(p.total)} ({p.percentage.toFixed(1)}%)</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full">
                                    <div 
                                        className="h-2 bg-green-500 rounded-full transition-all duration-700"
                                        style={{ width: `${p.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Distribución de Gastos */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <AlertOctagonIcon className="w-5 h-5 mr-2 text-red-600" /> Gastos por Categoría
                    </h3>
                    <div className="space-y-3">
                        {sortedGastos.map(g => (
                            <div key={g.nombre} className="space-y-1">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-gray-700">{g.nombre}</span>
                                    <span className="font-bold text-gray-900">{formatCurrency(g.total)}</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full">
                                    <div 
                                        className="h-2 bg-red-500 rounded-full transition-all duration-700"
                                        style={{ width: `${(g.total / (report?.totalGastos || 1)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ReportsFinance;