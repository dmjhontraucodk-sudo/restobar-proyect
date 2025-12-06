// frontend/src/pages/OrdersManagement.tsx - DISEÑO MEJORADO
import React, { useState } from 'react';
import { useOrdersManagement, type DateRangePreset } from '@features/orders/model/useOrdersManagement';
import { type ApiOrden, type OrdenEstado } from '@shared/types';
import { RefreshIcon, PlusIcon, TableIcon, DollarSignIcon, CalendarIcon, FilterIcon, SendIcon } from '@shared/ui/Icons';
import { PosOrderModal } from '@features/orders';

// --- Componente de la Página de Pedidos ---
const OrdersManagementPage: React.FC = () => {
    const [isPosModalOpen, setIsPosModalOpen] = useState(false);
    const [orderToClose, setOrderToClose] = useState<ApiOrden | null>(null);
    const [orderToEdit, setOrderToEdit] = useState<ApiOrden | null>(null); // ✅ NUEVO ESTADO para la edición/añadir ítems
    

    const { 
        orders, 
        isLoading, 
        error, 
        reloadOrders, 
        filtroEstado, 
        setFiltroEstado,
        filtroFecha,
        setFiltroFecha
    } = useOrdersManagement();

    const handleOpenCloseOrder = (order: ApiOrden) => {
        setOrderToClose(order);
        setOrderToEdit(null); // Asegurar que solo está en modo Cierre
        setIsPosModalOpen(true);
    };

    // ✅ NUEVA FUNCIÓN PARA ABRIR EN MODO EDICIÓN/AÑADIR ÍTEMS
    const handleAddItemsToOrder = (order: ApiOrden) => {
        setOrderToClose(null); // No está en modo cierre
        setOrderToEdit(order); // Pasa la orden a editar
        setIsPosModalOpen(true);
    };

    const handleCreateNewOrder = () => {
        setOrderToClose(null);
        setOrderToEdit(null); // Asegurar que es una orden nueva
        setIsPosModalOpen(true);
    };

    // 1. Manejo de estado de Carga
    if (isLoading && orders.length === 0) { 
        return (
            <div className="flex flex-col justify-center items-center min-h-96 space-y-4">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600"></div>
                <p className="text-lg text-gray-600 font-medium">Cargando pedidos...</p>
                <p className="text-sm text-gray-400">Esto puede tomar unos segundos</p>
            </div>
        );
    }

    // 2. Manejo de estado de Error
    if (error) {
        return (
            <div className="max-w-2xl mx-auto mt-8 px-4">
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-sm" role="alert">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg font-medium text-red-800">Error al cargar los pedidos</h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>{error}</p>
                            </div>
                            <div className="mt-4">
                                <button 
                                    onClick={reloadOrders} 
                                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    <RefreshIcon className="w-4 h-4 mr-2" />
                                    Reintentar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 3. Renderizado de la página
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
            {/* Cabecera Mejorada */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-20">
                <div className="px-6 py-6 max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 rounded-xl">
                                    <TableIcon className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Pedidos</h1>
                                    <p className="text-gray-600 mt-1">Administra y procesa todos los pedidos del restaurante</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                            {/* Botón Nueva Orden POS */}
                            <button
                                onClick={handleCreateNewOrder}
                                className="flex items-center px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                <PlusIcon className="w-5 h-5 mr-2" />
                                Nueva Orden
                            </button>
                            
                            {/* Botón Recargar */}
                            <button 
                                onClick={reloadOrders} 
                                disabled={isLoading}
                                className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 hover:border-blue-200"
                                title="Recargar pedidos"
                            >
                                <RefreshIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Barra de Filtros Mejorada */}
            <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200/60 sticky top-[88px] z-10">
                <div className="px-6 py-4 max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Filtros de Estado */}
                        <div className="flex items-center space-x-1">
                            <FilterIcon className="w-5 h-5 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-500 mr-3">Estado:</span>
                            <div className="flex flex-wrap gap-2">
                                <FilterButton 
                                    label="Abiertas" 
                                    estado="Abierta"
                                    filtroActual={filtroEstado} 
                                    onClick={setFiltroEstado} 
                                />
                                <FilterButton 
                                    label="Pagadas" 
                                    estado="Pagada"
                                    filtroActual={filtroEstado} 
                                    onClick={setFiltroEstado} 
                                />
                                <FilterButton 
                                    label="Canceladas" 
                                    estado="Cancelada"
                                    filtroActual={filtroEstado} 
                                    onClick={setFiltroEstado} 
                                />
                                <FilterButton 
                                    label="Todas" 
                                    estado={undefined}
                                    filtroActual={filtroEstado} 
                                    onClick={setFiltroEstado} 
                                />
                            </div>
                        </div>

                        {/* Filtros de Fecha */}
                        <div className="flex items-center space-x-1">
                            <CalendarIcon className="w-5 h-5 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-500 mr-3">Período:</span>
                            <div className="flex flex-wrap gap-2">
                                <FilterButtonDate 
                                    label="Hoy"
                                    range="hoy"
                                    filtroActual={filtroFecha}
                                    onClick={setFiltroFecha}
                                />
                                <FilterButtonDate 
                                    label="Ayer"
                                    range="ayer"
                                    filtroActual={filtroFecha}
                                    onClick={setFiltroFecha}
                                />
                                <FilterButtonDate 
                                    label="7 días"
                                    range="semana"
                                    filtroActual={filtroFecha}
                                    onClick={setFiltroFecha}
                                />
                                <FilterButtonDate 
                                    label="30 días"
                                    range="mes"
                                    filtroActual={filtroFecha}
                                    onClick={setFiltroFecha}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido Principal Mejorado */}
            <div className="px-4 py-8 max-w-7xl mx-auto">
                {/* Estadísticas Rápidas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard 
                        title="Total Pedidos" 
                        value={orders.length.toString()} 
                        color="blue"
                    />
                    <StatCard 
                        title="Abiertas" 
                        value={orders.filter(o => o.estado === 'Abierta').length.toString()} 
                        color="amber"
                    />
                    <StatCard 
                        title="Pagadas Hoy" 
                        value={orders.filter(o => o.estado === 'Pagada').length.toString()} 
                        color="green"
                    />
                </div>

                {/* Lista de Pedidos */}
                {orders.length === 0 ? (
                    <EmptyState 
                        filtroEstado={filtroEstado}
                        filtroFecha={filtroFecha}
                        onCreateOrder={handleCreateNewOrder}
                    />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {orders.map(order => (
                            <OrderDetailCard 
                                key={order.id} 
                                order={order} 
                                onCobrar={handleOpenCloseOrder} 
                                onAddItems={handleAddItemsToOrder} // ✅ PASANDO EL NUEVO HANDLER
                            />
                        ))}
                    </div>
                )}
            </div>
            
            {/* Modal de Orden/Cobro POS */}
            {isPosModalOpen && (
                <PosOrderModal
                    isOpen={isPosModalOpen}
                    onClose={() => {
                        setIsPosModalOpen(false);
                        setOrderToClose(null);
                        setOrderToEdit(null);
                        // Esto fuerza una recarga poco después de cerrar el modal
                        setTimeout(() => reloadOrders(), 100); // 100ms es suficiente.
                    }}
                    initialOrder={orderToClose || orderToEdit}
                    isEditMode={!!orderToEdit && !orderToClose} // ✅ DEFINIR EL MODO EDICIÓN
                />
            )}
        </div>
    );
};

// --- COMPONENTES AUXILIARES MEJORADOS ---

// Tarjeta de Estadísticas
const StatCard: React.FC<{ title: string; value: string; color: 'blue' | 'green' | 'amber' }> = ({ 
    title, 
    value, 
    color 
}) => {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-emerald-600',
        amber: 'from-amber-500 to-orange-500'
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-r ${colorClasses[color]} text-white`}>
                    <TableIcon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
};

// Estado Vacío Mejorado
const EmptyState: React.FC<{ 
    filtroEstado?: OrdenEstado; 
    filtroFecha: DateRangePreset;
    onCreateOrder: () => void;
}> = ({ filtroEstado, filtroFecha, onCreateOrder }) => {
    const getMessage = () => {
        if (filtroEstado) {
            return `No se encontraron pedidos con estado "${filtroEstado}"`;
        }
        
        const timeMessages = {
            hoy: 'para hoy',
            ayer: 'para ayer', 
            semana: 'en los últimos 7 días',
            mes: 'en los últimos 30 días'
        };
        
        return `No se encontraron pedidos ${timeMessages[filtroFecha] || ''}`;
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <TableIcon className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No hay pedidos</h3>
                <p className="text-gray-500 mb-6 text-lg">
                    {getMessage()}. Intenta ajustar los filtros o crear un nuevo pedido.
                </p>
                <button
                    onClick={onCreateOrder}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Crear Primer Pedido
                </button>
            </div>
        </div>
    );
};

// Botón de Filtro de Estado Mejorado
interface FilterButtonProps {
    label: string;
    estado?: OrdenEstado;
    filtroActual?: OrdenEstado;
    onClick: (estado?: OrdenEstado) => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({ label, estado, filtroActual, onClick }) => {
    const isActive = estado === filtroActual;
    
    return (
        <button
            onClick={() => onClick(estado)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                isActive 
                    ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50'
            }`}
        >
            {label}
        </button>
    );
};

// Botón de Filtro de Fecha Mejorado
interface FilterButtonDateProps {
    label: string;
    range: DateRangePreset;
    filtroActual: DateRangePreset;
    onClick: (range: DateRangePreset) => void;
}

const FilterButtonDate: React.FC<FilterButtonDateProps> = ({ label, range, filtroActual, onClick }) => {
    const isActive = range === filtroActual;
    
    return (
        <button
            onClick={() => onClick(range)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 border ${
                isActive 
                    ? 'bg-gray-800 text-white border-gray-800 shadow-sm' 
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50'
            }`}
        >
            {label}
        </button>
    );
};

// Tarjeta de Orden Mejorada
interface OrderDetailCardProps {
    order: ApiOrden; 
    onCobrar: (order: ApiOrden) => void;
    onAddItems: (order: ApiOrden) => void; // ✅ Propiedad añadida aquí
}

const OrderDetailCard: React.FC<OrderDetailCardProps> = ({ order, onCobrar, onAddItems }) => {
    const canClose = order.estado === 'Abierta';
    const isClosed = order.estado === 'Pagada' || order.estado === 'Cancelada';

    const statusConfig = {
        Abierta: { color: 'bg-amber-100 text-amber-800 border-amber-300', icon: '🟡' },
        Pagada: { color: 'bg-green-100 text-green-800 border-green-300', icon: '✅' },
        Cancelada: { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: '❌' },
        Cerrada: { color: 'bg-gray-200 text-gray-700 border-gray-400', icon: '🔒' }
    };
    
    const status = statusConfig[order.estado] || statusConfig.Cancelada;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-gray-300 group">
            {/* Header con Gradiente */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-200">
                            <TableIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">
                                Mesa {order.mesas.nombre_o_numero}
                            </h3>
                            <p className="text-sm text-gray-500">Orden #{order.id}</p>
                        </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${status.color} flex items-center space-x-1`}>
                        <span>{status.icon}</span>
                        <span>{order.estado}</span>
                    </span>
                </div>
            </div>

            {/* Información de la Orden */}
            <div className="p-6">
                {/* Información del Empleado */}
                <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-xl">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Atendido por</p>
                        <p className="text-sm font-medium text-gray-900">
                            {order.empleados.nombre || order.empleados.email}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Total</p>
                        <p className="text-lg font-bold text-blue-600">S/ {Number(order.total).toFixed(2)}</p>
                    </div>
                </div>

                {/* Lista de Productos */}
                <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Productos</p>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                        {order.ordendetalles.map(detalle => (
                            <div key={detalle.id} className="flex justify-between items-center py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs font-medium bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                        {detalle.cantidad}x
                                    </span>
                                    <span className="text-sm text-gray-700">{detalle.productos.nombre}</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                    S/ {(Number(detalle.cantidad) * Number(detalle.precio_unitario)).toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Botón de Acción */}
                <div className="pt-4 border-t border-gray-200">
                    {canClose && (
                        <div className="space-y-3">
                            {/* ✅ BOTÓN DE VER/AÑADIR PEDIDO */}
                            <button
                                onClick={() => onAddItems(order)}
                                className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                <SendIcon className="w-5 h-5 mr-2" />
                                Añadir / Ver Pedido
                            </button>

                            {/* ✅ BOTÓN COBRAR Y CERRAR */}
                            <button
                                onClick={() => onCobrar(order)}
                                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
                            >
                                <DollarSignIcon className="w-5 h-5 mr-2" />
                                Cobrar y Cerrar
                            </button>
                        </div>
                    )}
                    
                    {isClosed && (
                        <div className="text-center py-3 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl border border-gray-200">
                            <div className="flex items-center justify-center space-x-2">
                                <span>✅</span>
                                <span>Transacción Finalizada</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrdersManagementPage;