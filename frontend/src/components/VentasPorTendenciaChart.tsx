import React, { useMemo } from 'react';

interface TrendData {
    dia: string;
    total: number;
}

interface TrendChartProps {
    data: TrendData[];
}

const formatCurrency = (value: number) => `$${value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

export const VentasPorTendenciaChart: React.FC<TrendChartProps> = ({ data }) => {
    
    // Calcular estadísticas para el gráfico
    const { maxTotal, minTotal, averageTotal, totalSemana } = useMemo(() => {
        const totals = data.map(item => item.total);
        const max = Math.max(...totals);
        const min = Math.min(...totals);
        const avg = totals.reduce((sum, total) => sum + total, 0) / totals.length;
        const total = totals.reduce((sum, total) => sum + total, 0);
        
        return { maxTotal: max, minTotal: min, averageTotal: avg, totalSemana: total };
    }, [data]);

    // Encontrar el día con ventas máximas
    const maxDay = useMemo(() => {
        return data.reduce((max, item) => item.total > max.total ? item : max, data[0]);
    }, [data]);

    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 min-h-[300px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <p className="text-lg font-medium text-gray-600 mb-2">No hay datos disponibles</p>
                <p className="text-sm text-gray-500 text-center">Los datos de tendencia semanal aparecerán aquí cuando estén disponibles</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full">
            {/* Header con estadísticas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                    <div className="text-sm font-medium text-blue-700 mb-1">Total Semanal</div>
                    <div className="text-2xl font-bold text-blue-900">{formatCurrency(totalSemana)}</div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                    <div className="text-sm font-medium text-green-700 mb-1">Promedio Diario</div>
                    <div className="text-2xl font-bold text-green-900">{formatCurrency(averageTotal)}</div>
                </div>
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
                    <div className="text-sm font-medium text-amber-700 mb-1">Día Más Alto</div>
                    <div className="text-lg font-bold text-amber-900">{maxDay.dia}</div>
                    <div className="text-sm text-amber-700">{formatCurrency(maxDay.total)}</div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                    <div className="text-sm font-medium text-purple-700 mb-1">Días Activos</div>
                    <div className="text-2xl font-bold text-purple-900">
                        {data.filter(item => item.total > 0).length}
                    </div>
                </div>
            </div>

            {/* Gráfico Mejorado */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">Distribución Semanal de Ventas</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-full mr-2"></div>
                            <span>Ventas</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-gradient-to-b from-green-500 to-green-600 rounded-full mr-2"></div>
                            <span>Promedio</span>
                        </div>
                    </div>
                </div>

                <div className="relative flex flex-col w-full">
                    {/* Eje Y y Líneas de Referencia */}
                    <div className="flex mb-4" style={{ height: '250px' }}>
                        {/* Etiquetas del Eje Y */}
                        <div className="flex flex-col justify-between h-full pr-4 text-right">
                            {[1, 0.75, 0.5, 0.25, 0].map((level, index) => (
                                <span key={index} className="text-xs text-gray-500 font-medium">
                                    {formatCurrency(maxTotal * level)}
                                </span>
                            ))}
                        </div>

                        {/* Área del Gráfico */}
                        <div className="flex-1 relative">
                            {/* Líneas de referencia horizontales */}
                            {[0.25, 0.5, 0.75].map((level, index) => (
                                <div
                                    key={index}
                                    className="absolute left-0 right-0 border-t border-dashed border-gray-300"
                                    style={{ bottom: `${level * 100}%` }}
                                />
                            ))}

                            {/* Línea del promedio */}
                            <div
                                className="absolute left-0 right-0 border-t-2 border-dashed border-green-500 opacity-60"
                                style={{ bottom: `${(averageTotal / maxTotal) * 100}%` }}
                            >
                                <div className="absolute -left-10 -top-2 text-xs text-green-600 font-medium bg-white px-1">
                                    Avg
                                </div>
                            </div>

                            {/* Barras del Gráfico */}
                            <div className="flex flex-row justify-around items-end h-full gap-2 px-2">
                                {data.map((item, index) => {
                                    const heightPercent = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0;
                                    const isMaxDay = item.total === maxTotal;
                                    const isAboveAverage = item.total > averageTotal;
                                    
                                    // Gradiente dinámico basado en el desempeño
                                    const barGradient = isMaxDay 
                                        ? 'from-amber-500 to-amber-600' 
                                        : isAboveAverage
                                            ? 'from-indigo-500 to-indigo-600'
                                            : 'from-indigo-400 to-indigo-500';
                                    
                                    const barShadow = isMaxDay 
                                        ? 'shadow-lg shadow-amber-500/25' 
                                        : 'shadow-md shadow-indigo-500/20';

                                    return (
                                        <div 
                                            key={item.dia} 
                                            className="flex flex-col items-center flex-1 group relative"
                                            style={{ maxWidth: '90px' }}
                                        >
                                            {/* Tooltip Mejorado */}
                                            <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-2 z-10">
                                                <div className="bg-gray-900 text-white text-sm rounded-lg py-2 px-3 shadow-xl whitespace-nowrap">
                                                    <div className="font-semibold">{item.dia}</div>
                                                    <div className="text-indigo-300">{formatCurrency(item.total)}</div>
                                                    {isMaxDay && (
                                                        <div className="text-amber-400 text-xs mt-1 flex items-center">
                                                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                                                            </svg>
                                                            Mejor día
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="w-3 h-3 bg-gray-900 transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                                            </div>

                                            {/* Barra con efecto de brillo */}
                                            <div className="relative w-full flex justify-center">
                                                <div 
                                                    className={`w-10 rounded-t-xl transition-all duration-700 ease-out group-hover:scale-105 ${barShadow} relative overflow-hidden`}
                                                    style={{ height: `${Math.max(heightPercent, 2)}%` }}
                                                >
                                                    {/* Barra principal con gradiente */}
                                                    <div className={`absolute inset-0 bg-gradient-to-t ${barGradient} rounded-t-xl`}></div>
                                                    
                                                    {/* Efecto de brillo */}
                                                    <div className="absolute top-0 left-0 right-0 h-1/3 bg-white/30 rounded-t-xl"></div>
                                                    
                                                    {/* Indicador de promedio */}
                                                    {Math.abs(item.total - averageTotal) / averageTotal < 0.1 && (
                                                        <div className="absolute -right-1 top-1/2 w-2 h-2 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Etiqueta del Día */}
                                            <div className="mt-3 text-center">
                                                <span className={`text-sm font-semibold ${
                                                    isMaxDay ? 'text-amber-600' : 'text-gray-700'
                                                }`}>
                                                    {item.dia}
                                                </span>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {formatCurrency(item.total)}
                                                </div>
                                            </div>

                                            {/* Indicador de crecimiento */}
                                            {index > 0 && item.total > data[index - 1].total && (
                                                <div className="absolute -top-1 right-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Eje X */}
                    <div className="flex justify-around px-2 pt-4 border-t border-gray-200">
                        {data.map((item, index) => (
                            <div key={index} className="text-xs text-gray-500 font-medium flex-1 text-center">
                                {item.dia}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Leyenda y Estadísticas Adicionales */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                            <span className="text-gray-600">Rango: </span>
                            <span className="font-semibold text-gray-800">
                                {formatCurrency(minTotal)} - {formatCurrency(maxTotal)}
                            </span>
                        </div>
                        <div className="text-center">
                            <span className="text-gray-600">Variación: </span>
                            <span className="font-semibold text-gray-800">
                                {maxTotal > 0 ? ((maxTotal - minTotal) / maxTotal * 100).toFixed(1) : 0}%
                            </span>
                        </div>
                        <div className="text-center">
                            <span className="text-gray-600">Días sobre promedio: </span>
                            <span className="font-semibold text-green-600">
                                {data.filter(item => item.total > averageTotal).length}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};