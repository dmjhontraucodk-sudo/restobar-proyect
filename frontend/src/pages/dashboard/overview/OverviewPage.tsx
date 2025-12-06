import React, { useEffect, useState } from 'react';
import { FaDollarSign, FaChartLine, FaClipboardList, FaChair, FaUtensils, FaCocktail, FaRegCalendarAlt, FaClock, FaChevronDown, FaChevronUp, FaFire, FaStar, FaCrown } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useDashboardApi } from '@shared/api/useDashboardApi';
import { type DashboardOverview } from '@shared/types'; 
import { VentasPorTendenciaChart } from '@features/reports';

// =======================================================
// COMPONENTES DE GRÁFICOS MEJORADOS - DISEÑO MODERNO
// =======================================================

// Componente para Ventas por Hora - Diseño Mejorado
const VentasPorHoraChart: React.FC<{ data: any[] }> = ({ data }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
                <FaChartLine className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm font-medium">No hay datos de ventas por hora</p>
                <p className="text-xs text-gray-500 mt-1">Los datos aparecerán aquí cuando estén disponibles</p>
            </div>
        );
    }

    const maxVenta = Math.max(...data.map(item => item.total || 0));
    const totalDia = data.reduce((sum, item) => sum + (item.total || 0), 0);
    const horasConVentas = data.filter(item => item.total > 0);
    const horasParaMostrar = isExpanded ? data : data.slice(0, 6);
    const horaActual = new Date().getHours();
    
    return (
        <div className="space-y-5">
            {/* Header con estadísticas mejoradas */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 rounded-2xl text-white shadow-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-sm font-medium opacity-90">Total del día</p>
                        <p className="text-2xl font-bold mt-1">${totalDia.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-right">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2">
                            <p className="text-xs opacity-90">Horas activas</p>
                            <p className="text-lg font-semibold">{horasConVentas.length}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center mt-3 text-sm">
                    <div className="flex items-center mr-4">
                        <div className="w-3 h-3 bg-blue-300 rounded-full mr-2"></div>
                        <span>Horas normales</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-white rounded-full mr-2"></div>
                        <span>Hora actual</span>
                    </div>
                </div>
            </div>
            
            {/* Gráfico de barras mejorado */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-semibold text-gray-800">Distribución por Horas</h4>
                    <div className="flex space-x-1">
                        {[1, 2, 3].map((dot) => (
                            <div key={dot} className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        ))}
                    </div>
                </div>
                
                <div className="h-32 relative">
                    <div className="flex items-end justify-between h-full space-x-1">
                        {data.map((item, index) => {
                            const porcentaje = maxVenta > 0 ? (item.total / maxVenta) * 100 : 0;
                            const esHoraActual = horaActual === parseInt(item.hora);
                            const esHoraPico = porcentaje > 70;
                            
                            return (
                                <div key={index} className="flex-1 flex flex-col items-center group relative">
                                    {/* Barra del gráfico */}
                                    <div 
                                        className={`w-full rounded-t-lg transition-all duration-500 ease-out cursor-pointer group-hover:opacity-80 ${
                                            esHoraActual 
                                                ? 'bg-gradient-to-t from-white to-blue-400 shadow-lg' 
                                                : esHoraPico
                                                    ? 'bg-gradient-to-t from-amber-500 to-amber-400'
                                                    : 'bg-gradient-to-t from-blue-300 to-blue-200'
                                        }`}
                                        style={{ height: `${Math.max(porcentaje * 0.8, 8)}%` }}
                                        title={`${item.hora}:00 - $${item.total?.toFixed(2) || '0.00'}`}
                                    >
                                        {/* Efecto de brillo en barras altas */}
                                        {porcentaje > 50 && (
                                            <div className="h-1/2 bg-white/20 rounded-t-lg"></div>
                                        )}
                                    </div>
                                    
                                    {/* Tooltip en hover */}
                                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-900 text-white text-xs rounded-lg py-1 px-2 whitespace-nowrap z-10">
                                        <div className="font-semibold">{item.hora}:00</div>
                                        <div>${item.total?.toFixed(2) || '0.00'}</div>
                                    </div>
                                    
                                    {/* Indicador de hora actual */}
                                    {esHoraActual && (
                                        <div className="absolute -top-6 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                            Ahora
                                        </div>
                                    )}
                                    
                                    {/* Etiqueta de hora */}
                                    <div className={`text-xs font-medium mt-2 ${
                                        esHoraActual ? 'text-blue-600 font-bold' : 'text-gray-500'
                                    }`}>
                                        {item.hora}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Lista detallada de horas */}
            <div className={`space-y-3 transition-all duration-300 ${!isExpanded ? 'max-h-60' : 'max-h-96'} overflow-y-auto custom-scrollbar`}>
                {horasParaMostrar.map((item, index) => {
                    const porcentaje = maxVenta > 0 ? (item.total / maxVenta) * 100 : 0;
                    const esHoraActual = horaActual === parseInt(item.hora);
                    const esTop3 = index < 3 && porcentaje > 50;
                    
                    return (
                        <div key={index} className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${
                            esHoraActual 
                                ? 'bg-blue-50 border-blue-200 shadow-sm' 
                                : esTop3
                                    ? 'bg-amber-50 border-amber-200'
                                    : 'bg-white border-gray-100'
                        }`}>
                            <div className="flex items-center space-x-4">
                                <div className={`flex items-center justify-center w-12 h-12 rounded-xl font-bold ${
                                    esHoraActual 
                                        ? 'bg-blue-500 text-white shadow-lg' 
                                        : esTop3
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {item.hora}:00
                                </div>
                                
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <span className="font-semibold text-gray-800">
                                            ${item.total?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                        </span>
                                        {esHoraActual && (
                                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                                                En curso
                                            </span>
                                        )}
                                        {esTop3 && index === 0 && (
                                            <FaCrown className="text-amber-500 w-4 h-4" />
                                        )}
                                        {esTop3 && index === 1 && (
                                            <FaStar className="text-amber-500 w-4 h-4" />
                                        )}
                                        {esTop3 && index === 2 && (
                                            <FaFire className="text-amber-500 w-4 h-4" />
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        {porcentaje.toFixed(1)}% del pico
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                                <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                    <div 
                                        className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${
                                            esHoraActual 
                                                ? 'bg-gradient-to-r from-blue-400 to-blue-500' 
                                                : esTop3
                                                    ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                                                    : 'bg-gradient-to-r from-blue-300 to-blue-400'
                                        }`}
                                        style={{ width: `${porcentaje}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Botón expandir/contraer mejorado */}
            {data.length > 6 && (
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full py-3 text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center justify-center space-x-2 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all duration-300 border border-blue-200 hover:border-blue-300"
                >
                    <span>{isExpanded ? 'Mostrar menos horas' : `Ver todas las ${data.length} horas`}</span>
                    {isExpanded ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
                </button>
            )}
        </div>
    );
};

// Componente para Ventas por Categoría - Diseño Modernizado
const VentasPorCategoriaChart: React.FC<{ data: any[] }> = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
                <FaChartLine className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm font-medium">No hay datos de categorías</p>
            </div>
        );
    }

    const colors = [
        'bg-gradient-to-r from-blue-500 to-blue-600',
        'bg-gradient-to-r from-green-500 to-green-600', 
        'bg-gradient-to-r from-amber-500 to-amber-600',
        'bg-gradient-to-r from-red-500 to-red-600',
        'bg-gradient-to-r from-purple-500 to-purple-600'
    ];
    
    const totalVentas = data.reduce((sum, cat) => sum + (cat.total || 0), 0);
    
    return (
        <div className="space-y-5">
            {/* Header con resumen */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-5 rounded-2xl text-white shadow-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-sm font-medium opacity-90">Distribución por Categoría</p>
                        <p className="text-2xl font-bold mt-1">${totalVentas.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-right">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2">
                            <p className="text-xs opacity-90">Categorías</p>
                            <p className="text-lg font-semibold">{data.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gráfico de barras horizontal mejorado */}
            <div className="space-y-4">
                {data.map((categoria, index) => {
                    const porcentaje = categoria.porcentaje || 0;
                    const monto = categoria.total || 0;
                    
                    return (
                        <div key={index} className="group cursor-pointer transform hover:scale-[1.02] transition-transform duration-200">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-3 h-3 rounded-full ${colors[index % colors.length].replace('bg-gradient-to-r', 'bg-blue-500')}`}></div>
                                    <span className="text-sm font-semibold text-gray-800 truncate max-w-24">
                                        {categoria.nombre}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-bold text-gray-900">{porcentaje.toFixed(1)}%</span>
                                    <div className="text-xs text-gray-500">${monto.toFixed(0)}</div>
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                                <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div 
                                        className={`h-3 rounded-full ${colors[index % colors.length]} transition-all duration-1000 ease-out shadow-sm`}
                                        style={{ width: `${porcentaje}%` }}
                                    ></div>
                                </div>
                                <div className="text-xs text-gray-500 font-medium min-w-10 text-right">
                                    {porcentaje.toFixed(0)}%
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Componente para Estado de Mesas - Diseño Elegante Mejorado
const EstadoMesasChart: React.FC<{ data: any[]; totalMesas: number }> = ({ data, totalMesas }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
                <FaChair className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm font-medium">No hay datos de mesas</p>
            </div>
        );
    }

    const mesasOcupadas = data.find(e => e.estado === 'Ocupada')?.cantidad || 0;
    const mesasReservadas = data.find(e => e.estado === 'Reservada')?.cantidad || 0;
    const mesasDisponibles = totalMesas - mesasOcupadas - mesasReservadas;
    const porcentajeOcupacion = totalMesas > 0 ? ((mesasOcupadas + mesasReservadas) / totalMesas) * 100 : 0;

    return (
        <div className="space-y-5">
            {/* Header con indicador circular mejorado */}
            <div className="bg-gradient-to-r from-purple-500 to-violet-600 p-6 rounded-2xl text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium opacity-90">Ocupación Total</p>
                        <p className="text-2xl font-bold mt-1">{porcentajeOcupacion.toFixed(0)}%</p>
                        <p className="text-xs opacity-80 mt-1">
                            {mesasOcupadas + mesasReservadas} de {totalMesas} mesas
                        </p>
                    </div>
                    
                    <div className="relative w-20 h-20">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="rgba(255,255,255,0.2)"
                                strokeWidth="3"
                            />
                            <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="white"
                                strokeWidth="3"
                                strokeDasharray={`${porcentajeOcupacion}, 100`}
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <FaChair className="w-6 h-6 opacity-80" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tarjetas de estado mejoradas */}
            <div className="grid grid-cols-1 gap-3">
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-amber-500 rounded-full mr-3"></div>
                            <span className="font-semibold text-amber-800">Ocupadas</span>
                        </div>
                        <div className="text-right">
                            <span className="text-xl font-bold text-amber-900">{mesasOcupadas}</span>
                            <div className="text-xs text-amber-700">
                                {totalMesas > 0 ? ((mesasOcupadas / totalMesas) * 100).toFixed(0) : 0}%
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                            <span className="font-semibold text-blue-800">Reservadas</span>
                        </div>
                        <div className="text-right">
                            <span className="text-xl font-bold text-blue-900">{mesasReservadas}</span>
                            <div className="text-xs text-blue-700">
                                {totalMesas > 0 ? ((mesasReservadas / totalMesas) * 100).toFixed(0) : 0}%
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
                            <span className="font-semibold text-gray-800">Disponibles</span>
                        </div>
                        <div className="text-right">
                            <span className="text-xl font-bold text-gray-900">{mesasDisponibles}</span>
                            <div className="text-xs text-gray-700">
                                {totalMesas > 0 ? ((mesasDisponibles / totalMesas) * 100).toFixed(0) : 0}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// =======================================================
// PÁGINA PRINCIPAL MEJORADA
// =======================================================

export default function OverviewPage() {
    const { getOverviewData, isLoading } = useDashboardApi();
    const [data, setData] = useState<DashboardOverview | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const overviewData = await getOverviewData();
                setData(overviewData);
            } catch (err: any) {
                console.error("Error al cargar Overview:", err);
                toast.error("Error al cargar las métricas del dashboard.");
            }
        };

        fetchData();
    }, [getOverviewData]);
    
    // --- Lógica de Formateo de Datos ---
    const ventasHoy = data?.ventasHoy || 0;
    const pedidosHoy = data?.pedidosHoy || 0;
    const ocupacion = data?.ocupacionPorcentaje || 0;
    const ticketPromedio = data?.ticketPromedio || 0;
    const totalMesas = data?.totalMesas || 0;
    
    // Mapeo de días
    const dayNameMap: { [key: string]: string } = {
        'Mon': 'Lun', 'Tue': 'Mar', 'Wed': 'Mié', 'Thu': 'Jue',
        'Fri': 'Vie', 'Sat': 'Sáb', 'Sun': 'Dom'
    };
    
    const trendData = data?.tendenciaVentas.map(item => ({
        ...item,
        dia: dayNameMap[item.dia] || item.dia
    })) || [];

    if (isLoading && !data) {
        return (
            <div className="flex justify-center items-center min-h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-500 text-lg font-medium">Cargando la Visión General...</p>
                    <p className="text-gray-400 text-sm mt-2">Preparando tus métricas</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4">
            {/* Header Mejorado */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Panel de Control
                    </h1>
                    <p className="text-gray-600 mt-1">Resumen completo de tu restaurante</p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-100 px-4 py-2 rounded-xl border border-blue-200 shadow-sm">
                    <div className="text-sm font-semibold text-blue-800">
                        {new Date().toLocaleDateString('es-ES', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </div>
                </div>
            </div>
            
            {/* 1. Sección de KPIs Mejorados - CORREGIDOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <KpiCard 
                    title="Ventas de Hoy" 
                    value={`$${ventasHoy.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                    subtext="Total caja y web"
                    color="blue"
                    icon={<FaDollarSign className="w-6 h-6"/>}
                    trend="up"
                />
                
                <KpiCard 
                    title="Pedidos de Hoy" 
                    value={pedidosHoy.toString()} 
                    subtext="Salón y pedidos web"
                    color="green"
                    icon={<FaClipboardList className="w-6 h-6"/>}
                    trend="up"
                />

                <KpiCard 
                    title="Ocupación" 
                    value={`${ocupacion}%`} 
                    subtext="Estado de mesas"
                    color="purple"
                    icon={<FaChair className="w-6 h-6"/>}
                    trend="stable"
                />
                
                <KpiCard 
                    title="Ticket Promedio" 
                    value={`$${ticketPromedio.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                    subtext="Por transacción"
                    color="orange"
                    icon={<FaChartLine className="w-6 h-6"/>}
                    trend="up"
                />
            </div>

            {/* 2. Sección de Rankings y Categorías */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Platos Más Vendidos */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-full">
                    <div className="flex items-center mb-5 pb-4 border-b border-gray-100">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <FaUtensils className="w-5 h-5 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold ml-3 text-gray-800">Platos Más Vendidos</h3>
                    </div>
                    <TopProductListContent products={data?.topPlatos || []} />
                </div>

                {/* Bebidas Más Vendidas */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-full">
                    <div className="flex items-center mb-5 pb-4 border-b border-gray-100">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FaCocktail className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold ml-3 text-gray-800">Bebidas Más Vendidas</h3>
                    </div>
                    <TopProductListContent products={data?.topBebidas || []} />
                </div>

                {/* Ventas por Categoría */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex items-center mb-5 pb-4 border-b border-gray-100">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <FaChartLine className="w-5 h-5 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold ml-3 text-gray-800">Ventas por Categoría</h3>
                    </div>
                    <VentasPorCategoriaChart data={data?.ventasPorCategoria || []} />
                </div>
            </div>

            {/* 3. Sección de Gráficos Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Ventas por Hora - Mejorado */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex items-center mb-5 pb-4 border-b border-gray-100">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FaClock className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold ml-3 text-gray-800">Ventas por Hora</h3>
                    </div>
                    <VentasPorHoraChart data={data?.ventasPorHora || []} />
                </div>

                {/* Estado de Mesas - Mejorado */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex items-center mb-5 pb-4 border-b border-gray-100">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <FaChair className="w-5 h-5 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold ml-3 text-gray-800">Estado de Mesas</h3>
                    </div>
                    <EstadoMesasChart 
                        data={data?.estadoMesas || []} 
                        totalMesas={totalMesas}
                    />
                </div>

                {/* Tendencia Semanal */}
                <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex items-center mb-5 pb-4 border-b border-gray-100">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <FaRegCalendarAlt className="w-5 h-5 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-semibold ml-3 text-gray-800">Tendencia Semanal de Ventas</h3>
                    </div>
                    <VentasPorTendenciaChart data={trendData} />
                </div>
            </div>
        </div>
    );
}

// =======================================================
// COMPONENTES AUXILIARES MEJORADOS - KPI CARD CORREGIDO
// =======================================================

interface KpiCardProps {
    title: string;
    value: string;
    subtext: string;
    color: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'stable';
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtext, color, icon, trend = 'stable' }) => {
    const trendIcons = {
        up: '↗',
        down: '↘', 
        stable: '→'
    };
    
    const trendColors = {
        up: 'text-green-500',
        down: 'text-red-500',
        stable: 'text-gray-500'
    };

    // Mapeo de colores para evitar problemas con Tailwind
    const colorClasses = {
        blue: {
            bg: 'from-blue-50 to-blue-100',
            text: 'text-blue-600',
            gradient: 'from-blue-600 to-blue-800'
        },
        green: {
            bg: 'from-green-50 to-green-100',
            text: 'text-green-600',
            gradient: 'from-green-600 to-green-800'
        },
        purple: {
            bg: 'from-purple-50 to-purple-100',
            text: 'text-purple-600',
            gradient: 'from-purple-600 to-purple-800'
        },
        orange: {
            bg: 'from-orange-50 to-orange-100',
            text: 'text-orange-600',
            gradient: 'from-orange-600 to-orange-800'
        }
    };

    const currentColor = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 group hover:border-gray-300">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</h3>
                        <span className={`text-sm font-bold ${trendColors[trend]}`}>
                            {trendIcons[trend]}
                        </span>
                    </div>
                    <p className={`text-3xl font-bold ${currentColor.text} mb-2`}>
                        {value}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">{subtext}</p>
                </div>
                <div className={`p-4 rounded-xl bg-gradient-to-br ${currentColor.bg} ${currentColor.text} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};

// Componente para lista de productos top mejorado
interface TopProductListContentProps {
    products: DashboardOverview['topPlatos'];
}

const TopProductListContent: React.FC<TopProductListContentProps> = ({ products }) => (
    <>
        {products && products.length > 0 ? (
            <ul className="space-y-3">
                {products.slice(0, 5).map((p, index) => (
                    <li key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group hover:shadow-sm">
                        <div className="flex items-center min-w-0 flex-1">
                            <span className={`text-sm font-bold ${
                                index === 0 
                                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white' 
                                    : index === 1
                                        ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                                        : index === 2
                                            ? 'bg-gradient-to-r from-amber-700 to-amber-800 text-white'
                                            : 'bg-gray-200 text-gray-700'
                            } w-8 h-8 rounded-full flex items-center justify-center text-xs mr-4 shadow-sm`}>
                                {index + 1}
                            </span>
                            <span className="text-sm font-medium text-gray-800 truncate group-hover:text-gray-900">
                                {p.nombre}
                            </span>
                        </div>
                        <span className="font-bold text-gray-800 bg-blue-50 px-3 py-1.5 rounded-full text-sm min-w-[50px] text-center shadow-sm group-hover:bg-blue-100 transition-colors">
                            {p.cantidad}
                        </span>
                    </li>
                ))}
            </ul>
        ) : (
            <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FaChartLine className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No hay datos de ventas</p>
                <p className="text-gray-400 text-sm mt-1">Los productos aparecerán aquí</p>
            </div>
        )}
    </>
);

// Estilos CSS personalizados para scrollbars
const styles = `
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}
`;

// Inyectar estilos
const styleSheet = document.createElement('style');
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);