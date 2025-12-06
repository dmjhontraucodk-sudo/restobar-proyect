// frontend/src/pages/WebOrdersManagement.tsx - CON IMPRESIÓN PARA RECOJO EN TIENDA

import React, { useCallback, useState, useMemo } from 'react';
import toast from 'react-hot-toast';

// Importamos el hook
import { useWebReadyOrders } from '@features/orders/model/useWebReadyOrders'; 
import { 
    RefreshIcon, 
    GlobeIcon, 
    TruckIcon, 
    ClockIcon, 
    XIcon, 
    MapPinIcon,
    PrinterIcon,
    SearchIcon
} from '@shared/ui/Icons'; 

// Importamos los tipos y constantes
import { 
    type ApiWebPedido, 
    type webpedidos_estado, 
    type webpedidos_tipo,
    WEBPEDIDOS_ESTADO,
    WEBPEDIDOS_TIPO
} from '@shared/types'; 

// ====================================================================
// INTERFACES Y TIPOS
// ====================================================================

interface FilterState {
    search: string;
    estado: webpedidos_estado | 'all';
    tipo: webpedidos_tipo | 'all';
    sortBy: 'fecha' | 'total' | 'prioridad';
    sortOrder: 'asc' | 'desc';
}

interface WebOrderDetailCardProps {
    order: ApiWebPedido; 
    onUpdateStatus: (orderId: number, newStatus: webpedidos_estado) => void;
}

// ====================================================================
// COMPONENTE: Filtros de Pedidos
// ====================================================================

const OrderFilters: React.FC<{
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    orderCount: number;
}> = ({ filters, onFiltersChange, orderCount }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
                {/* Búsqueda */}
                <div className="flex-1 w-full lg:max-w-md">
                    <div className="relative">
                        <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente, teléfono o #pedido..."
                            value={filters.search}
                            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                        />
                    </div>
                </div>

                {/* Contador y Filtros */}
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full font-medium">
                        {orderCount} activo{orderCount !== 1 ? 's' : ''}
                    </span>
                    
                    {/* Filtro por Estado */}
                    <select
                        value={filters.estado}
                        onChange={(e) => onFiltersChange({ ...filters, estado: e.target.value as webpedidos_estado | 'all' })}
                        className="px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                    >
                        <option value="all">Todos</option>
                        <option value={WEBPEDIDOS_ESTADO.ListoParaRecoger}>Listo</option>
                        <option value={WEBPEDIDOS_ESTADO.EnCamino}>En camino</option>
                        <option value={WEBPEDIDOS_ESTADO.EnPreparacion}>Preparación</option>
                    </select>

                    {/* Filtro por Tipo */}
                    <select
                        value={filters.tipo}
                        onChange={(e) => onFiltersChange({ ...filters, tipo: e.target.value as webpedidos_tipo | 'all' })}
                        className="px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                    >
                        <option value="all">Todos</option>
                        <option value={WEBPEDIDOS_TIPO.RecogerEnTienda}>Recojo</option>
                        <option value={WEBPEDIDOS_TIPO.EntregaDomicilio}>Delivery</option>
                    </select>

                    {/* Ordenamiento */}
                    <select
                        value={`${filters.sortBy}-${filters.sortOrder}`}
                        onChange={(e) => {
                            const [sortBy, sortOrder] = e.target.value.split('-') as ['fecha' | 'total' | 'prioridad', 'asc' | 'desc'];
                            onFiltersChange({ ...filters, sortBy, sortOrder });
                        }}
                        className="px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                    >
                        <option value="prioridad-desc">Prioridad</option>
                        <option value="fecha-asc">Antiguos</option>
                        <option value="fecha-desc">Recientes</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

// ====================================================================
// COMPONENTE: Tarjeta Compacta para muchos pedidos
// ====================================================================

const CompactOrderCard: React.FC<{
    order: ApiWebPedido;
    onUpdateStatus: (orderId: number, newStatus: webpedidos_estado) => void;
    onSelect: (order: ApiWebPedido) => void;
    isSelected?: boolean;
    onPrintTicket: (order: ApiWebPedido) => void; // ✅ NUEVO
}> = ({ order, onUpdateStatus, onSelect, isSelected, onPrintTicket }) => {
    const isDelivery = order.tipo_pedido === WEBPEDIDOS_TIPO.EntregaDomicilio;
    const isWaitingPayment = isDelivery && order.estado === WEBPEDIDOS_ESTADO.EnCamino;

    const statusConfig = {
        [WEBPEDIDOS_ESTADO.ListoParaRecoger]: { color: 'bg-orange-100 text-orange-800 border-orange-300', badge: '📦' },
        [WEBPEDIDOS_ESTADO.EnCamino]: { color: 'bg-blue-100 text-blue-800 border-blue-300', badge: '🚚' },
        [WEBPEDIDOS_ESTADO.EnPreparacion]: { color: 'bg-amber-100 text-amber-800 border-amber-300', badge: '⏱️' },
    };
 
    const status = statusConfig[order.estado] || { color: 'bg-gray-100 text-gray-800 border-gray-300', badge: '❓' };

    // Calcular si requiere preparación en cocina
    const requierePreparacion = order.webpedidos_detalles.some(
        detalle => detalle.productos.producto_inventario_id === null
    );

    return (
        <div 
            className={`bg-white rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-sm ${
                isSelected 
                    ? 'border-blue-500 ring-1 ring-blue-200 bg-blue-50' 
                    : isWaitingPayment 
                        ? 'border-amber-400 bg-amber-50' 
                        : 'border-gray-200'
            }`}
            onClick={() => onSelect(order)}
        >
            <div className="p-2">
                {/* Header compacto */}
                <div className="flex justify-between items-start mb-1">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1">
                            <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium border ${status.color}`}>
                                {status.badge}
                            </span>
                            {isDelivery ? (
                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs border border-blue-200">
                                    🚚
                                </span>
                            ) : (
                                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs border border-gray-200">
                                    🏪
                                </span>
                            )}
                            {requierePreparacion ? (
                                <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 rounded-full text-xs border border-orange-200">
                                    🍳
                                </span>
                            ) : (
                                <span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded-full text-xs border border-green-200">
                                    ⚡
                                </span>
                            )}
                        </div>
                        <h4 className="font-semibold text-gray-900 text-sm truncate">
                            #{order.numero_pedido}
                        </h4>
                        <p className="text-xs text-gray-600 truncate">{order.cliente_nombre}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                        <p className="font-bold text-green-600 text-sm">S/ {Number(order.total).toFixed(2)}</p>
                        <p className="text-xs text-gray-500">
                            {new Date(order.created_at).toLocaleTimeString('es-PE', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            })}
                        </p>
                    </div>
                </div>

                {/* Info rápida */}
                <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    <span className="truncate flex-1 mr-2">
                        {order.webpedidos_detalles.length} ítem{order.webpedidos_detalles.length !== 1 ? 's' : ''}
                    </span>
                    {isDelivery && order.direccion_entrega && (
                        <span className="text-xs text-red-600 truncate flex-1" title={order.direccion_entrega}>
                            📍 {order.direccion_entrega.substring(0, 15)}...
                        </span>
                    )}
                </div>

                {/* Acción rápida */}
                {order.estado === WEBPEDIDOS_ESTADO.ListoParaRecoger && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            // ✅ NUEVO: Imprimir antes de finalizar si NO es delivery
                            if (!isDelivery) {
                                onPrintTicket(order);
                                setTimeout(() => {
                                    onUpdateStatus(order.id, WEBPEDIDOS_ESTADO.Entregado);
                                }, 1000);
                            } else {
                                onUpdateStatus(order.id, WEBPEDIDOS_ESTADO.EnCamino);
                            }
                        }}
                        className="w-full py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                    >
                        {isDelivery ? 'Despachar' : '🖨️ Imprimir y Entregar'}
                    </button>
                )}
                
                {order.estado === WEBPEDIDOS_ESTADO.EnCamino && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStatus(order.id, WEBPEDIDOS_ESTADO.Entregado);
                        }}
                        className="w-full py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors animate-pulse"
                    >
                        Confirmar Cobro
                    </button>
                )}

                {order.estado === WEBPEDIDOS_ESTADO.EnPreparacion && (
                    <div className="bg-amber-50 border border-amber-300 rounded p-2 text-center">
                        <p className="text-xs text-amber-800 font-medium">⏳ En Cocina</p>
                        <p className="text-xs text-amber-600">Solo cocina puede marcar listo</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ====================================================================
// COMPONENTE: Tarjeta de Detalle Completo del Pedido
// ====================================================================

const WebOrderDetailCard: React.FC<WebOrderDetailCardProps> = ({ order, onUpdateStatus }) => {
    
    const isDelivery = order.tipo_pedido === WEBPEDIDOS_TIPO.EntregaDomicilio;
    const isWaitingPayment = isDelivery && order.estado === WEBPEDIDOS_ESTADO.EnCamino;

    const requierePreparacion = useMemo(() => {
        return order.webpedidos_detalles.some(detalle => 
            detalle.productos.producto_inventario_id === null || detalle.productos.producto_inventario_id === undefined
        );
    }, [order.webpedidos_detalles]);

    const statusConfig = {
        [WEBPEDIDOS_ESTADO.Pendiente]: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: '⏳' },
        [WEBPEDIDOS_ESTADO.Confirmado]: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: '✓' },
        [WEBPEDIDOS_ESTADO.EnPreparacion]: { color: 'bg-amber-100 text-amber-800 border-amber-300', icon: <ClockIcon className="w-3 h-3 inline" /> },
        [WEBPEDIDOS_ESTADO.ListoParaRecoger]: { color: 'bg-orange-100 text-orange-800 border-orange-300', icon: '📦' },
        [WEBPEDIDOS_ESTADO.EnCamino]: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: <TruckIcon className="w-3 h-3 inline" /> },
    };
    
    const status = statusConfig[order.estado] || { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: '❓' };

    const handleAction = (newStatus: webpedidos_estado) => {
        if (order.estado === WEBPEDIDOS_ESTADO.Entregado || order.estado === WEBPEDIDOS_ESTADO.Cancelado) {
            toast.error("El pedido ya está finalizado.");
            return;
        }
        onUpdateStatus(order.id, newStatus);
    };

    // Log para depuración
    console.log(`Pedido #${order.numero_pedido}: requierePreparacion = ${requierePreparacion}`);
    order.webpedidos_detalles.forEach((detalle, index) => {
        console.log(`  - Detalle ${index}: Producto ${detalle.productos.nombre}, producto_inventario_id = ${detalle.productos.producto_inventario_id}`);
    });

    // ⭐ FUNCIÓN PARA IMPRIMIR TICKET
    const handlePrintTicket = () => {
        window.open(
            `/api/web/${order.numero_pedido}/ticket`,
            '_blank'
        );
        toast.success('Generando ticket PDF...');
    };

    return (
        <div className={`bg-white rounded-lg border overflow-hidden transition-all duration-300 ${
            isWaitingPayment ? 'border-amber-400 ring-1 ring-amber-200' : 'border-gray-200'
        }`}>
            
            {/* Header compacto */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 px-4 py-3 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${status.color}`}>
                            {status.icon}
                            <span className="text-xs">{order.estado}</span>
                        </span>
                        <span className="text-blue-600 font-semibold text-xs flex items-center gap-1">
                            {isDelivery ? '🚚 Delivery' : '🏪 Tienda'}
                        </span>
                        {requierePreparacion ? (
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full border border-orange-200">
                                🍳 Cocina
                            </span>
                        ) : (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full border border-green-200">
                                ⚡ Directo
                            </span>
                        )}
                    </div>
                    <span className="text-lg font-bold text-green-600">S/ {Number(order.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                    <h3 className="font-bold text-gray-900 text-sm">
                        #{order.numero_pedido} • {order.cliente_nombre}
                    </h3>
                    <p className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleTimeString('es-PE', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })}
                    </p>
                </div>
            </div>

            {/* Contenido compacto */}
            <div className="p-4">
                {isWaitingPayment && (
                    <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center gap-2 animate-pulse">
                        <div className="bg-amber-100 p-1 rounded-full">
                            <ClockIcon className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                            <p className="font-bold text-amber-800 text-xs">ESPERANDO PAGO</p>
                            <p className="text-xs text-amber-700">Confirmar cobro al entregar</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Cliente</p>
                        <p className="font-medium text-gray-900">{order.cliente_nombre}</p>
                        <p className="text-xs text-gray-600">{order.cliente_telefono}</p>
                    </div>
                    {isDelivery && order.direccion_entrega && (
                        <div>
                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                <MapPinIcon className="w-3 h-3" /> Dirección
                            </p>
                            <p className="font-medium text-gray-900 text-xs">{order.direccion_entrega}</p>
                            {order.instrucciones_entrega && (
                                <p className="text-xs text-gray-600">Nota: {order.instrucciones_entrega}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Items compactos */}
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-semibold text-gray-500">Productos ({order.webpedidos_detalles.length})</p>
                    </div>
                    <div className="space-y-1 max-h-24 overflow-y-auto text-sm border border-dashed border-gray-200 p-2 rounded bg-gray-50">
                        {order.webpedidos_detalles.map(detalle => (
                            <div key={detalle.id} className="flex justify-between items-center text-xs">
                                <span>
                                    {detalle.cantidad}x {detalle.productos.nombre}
                                    {detalle.productos.producto_inventario_id !== null && (
                                        <span className="ml-1 text-green-600">⚡</span>
                                    )}
                                </span>
                                <span>S/ {Number(detalle.subtotal).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Acciones compactas */}
                <div className="space-y-2">
                    {order.estado === WEBPEDIDOS_ESTADO.Pendiente && (
                        <button
                            onClick={() => handleAction(WEBPEDIDOS_ESTADO.Confirmado)}
                            className="w-full py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors font-medium"
                        >
                            Confirmar Pedido
                        </button>
                    )}

                    {order.estado === WEBPEDIDOS_ESTADO.Confirmado && (
                        <>
                            {requierePreparacion ? ( // Si requiere preparación
                                <button
                                    onClick={() => handleAction(WEBPEDIDOS_ESTADO.EnPreparacion)}
                                    className="w-full py-2 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 transition-colors font-medium"
                                >
                                    Enviar a Cocina
                                </button>
                            ) : ( // Si no requiere preparación (solo cerrados)
                                isDelivery ? ( // Si es delivery, va directo EnCamino
                                    <button
                                        onClick={() => {
                                            handleAction(WEBPEDIDOS_ESTADO.EnCamino);
                                            handlePrintTicket(); // Imprimir ticket al despachar
                                        }}
                                        className="w-full py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors font-medium"
                                    >
                                        Despachar Directo
                                    </button>
                                ) : ( // Si no es delivery (recojo), va a ListoParaRecoger
                                    <button
                                        onClick={() => {
                                            handlePrintTicket(); // Imprimir ticket al marcar listo
                                            setTimeout(() => {
                                                handleAction(WEBPEDIDOS_ESTADO.ListoParaRecoger);
                                            }, 1000);
                                        }}
                                        className="w-full py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                                    >
                                        <PrinterIcon className="w-4 h-4" />
                                        Marcar Listo y Entregar
                                    </button>
                                )
                            )}
                        </>
                    )}

                    {order.estado === WEBPEDIDOS_ESTADO.EnPreparacion && (
                        <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="bg-amber-100 p-2 rounded-full">
                                    <ClockIcon className="w-5 h-5 text-amber-600 animate-pulse" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-amber-900 text-sm">En Cocina</p>
                                    <p className="text-xs text-amber-700">Esperando confirmación de cocina</p>
                                </div>
                            </div>
                            <div className="bg-white border border-amber-200 rounded p-3 text-center">
                                <p className="text-xs text-gray-600 mb-1">
                                    🔒 Este pedido está bloqueado
                                </p>
                                <p className="text-xs text-gray-500">
                                    Solo cocina puede marcarlo como listo
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {/* DELIVERY: Listo para recoger */}
                    {isDelivery && order.estado === WEBPEDIDOS_ESTADO.ListoParaRecoger && (
                        <>
                            <button
                                onClick={() => {
                                    handlePrintTicket();
                                    setTimeout(() => {
                                        handleAction(WEBPEDIDOS_ESTADO.EnCamino);
                                    }, 1000);
                                }}
                                className="w-full py-3 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors font-bold flex items-center justify-center gap-2"
                            >
                                <PrinterIcon className="w-4 h-4" />
                                🚚 Imprimir Ticket y Despachar
                            </button>
                            <p className="text-xs text-center text-gray-500">
                                Se generará el ticket PDF automáticamente
                            </p>
                        </>
                    )}

                    {/* DELIVERY: En camino */}
                    {isDelivery && order.estado === WEBPEDIDOS_ESTADO.EnCamino && (
                        <button
                            onClick={() => handleAction(WEBPEDIDOS_ESTADO.Entregado)}
                            className="w-full py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors font-medium animate-pulse"
                        >
                            Confirmar Entrega y Cobro
                        </button>
                    )}
                    
                    {/* ✅ RECOJO EN TIENDA: Listo para recoger */}
                    {!isDelivery && order.estado === WEBPEDIDOS_ESTADO.ListoParaRecoger && (
                        <>
                            <button
                                onClick={() => {
                                    handlePrintTicket();
                                    setTimeout(() => {
                                        handleAction(WEBPEDIDOS_ESTADO.Entregado);
                                    }, 1000);
                                }}
                                className="w-full py-3 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors font-bold flex items-center justify-center gap-2"
                            >
                                <PrinterIcon className="w-4 h-4" />
                                🏪 Imprimir Ticket y Cobrar
                            </button>
                            <p className="text-xs text-center text-gray-500">
                                Se generará el ticket PDF automáticamente
                            </p>
                        </>
                    )}

                    {order.estado !== WEBPEDIDOS_ESTADO.Entregado && order.estado !== WEBPEDIDOS_ESTADO.Cancelado && (
                        <button
                            onClick={() => handleAction(WEBPEDIDOS_ESTADO.Cancelado)}
                            className="w-full text-xs text-red-500 hover:text-red-700 transition-colors py-1"
                        >
                            Cancelar Pedido
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ====================================================================
// COMPONENTE PRINCIPAL: Página de Gestión de Pedidos Web
// ====================================================================

const WebOrdersManagementPage: React.FC = () => {
    const { orders, isLoading, error, reloadOrders, updateOrderStatus } = useWebReadyOrders();
    
    // Estado para filtros y vista
    const [filters, setFilters] = useState<FilterState>({
        search: '',
        estado: 'all',
        tipo: 'all',
        sortBy: 'prioridad',
        sortOrder: 'desc'
    });
    
    const [selectedOrder, setSelectedOrder] = useState<ApiWebPedido | null>(null);

    // ⭐ FUNCIÓN PARA IMPRIMIR TICKET
    const handlePrintTicket = useCallback((order: ApiWebPedido) => {
        window.open(
            `/api/web/${order.numero_pedido}/ticket`,
            '_blank'
        );
        toast.success('Generando ticket PDF...');
    }, []);

    // Filtrar pedidos: EXCLUIR entregados y cancelados, luego aplicar otros filtros
    const filteredAndSortedOrders = useMemo(() => {
        // Primero excluir pedidos finalizados
        let filtered = orders.filter(order => 
            order.estado !== WEBPEDIDOS_ESTADO.Entregado && 
            order.estado !== WEBPEDIDOS_ESTADO.Cancelado
        );

        // Aplicar otros filtros
        filtered = filtered.filter(order => {
            const searchLower = filters.search.toLowerCase();
            const matchesSearch = 
                order.numero_pedido.toLowerCase().includes(searchLower) ||
                order.cliente_nombre.toLowerCase().includes(searchLower) ||
                order.cliente_telefono.includes(searchLower);
            
            const matchesEstado = filters.estado === 'all' || order.estado === filters.estado;
            const matchesTipo = filters.tipo === 'all' || order.tipo_pedido === filters.tipo;
            
            return matchesSearch && matchesEstado && matchesTipo;
        });

        // Ordenamiento
        filtered.sort((a, b) => {
            const getPriorityScore = (order: ApiWebPedido): number => {
                let score = 0;
                if (order.estado === WEBPEDIDOS_ESTADO.EnCamino) score += 100;
                if (order.estado === WEBPEDIDOS_ESTADO.ListoParaRecoger) score += 50;
                if (order.tipo_pedido === WEBPEDIDOS_TIPO.EntregaDomicilio) score += 20;
                const ageInMinutes = (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60);
                score += Math.min(ageInMinutes / 10, 30);
                return score;
            };

            switch (filters.sortBy) {
                case 'prioridad':
                    const priorityA = getPriorityScore(a);
                    const priorityB = getPriorityScore(b);
                    return filters.sortOrder === 'desc' ? priorityB - priorityA : priorityA - priorityB;
                
                case 'fecha':
                    const dateA = new Date(a.created_at).getTime();
                    const dateB = new Date(b.created_at).getTime();
                    return filters.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
                
                case 'total':
                    return filters.sortOrder === 'desc' ? b.total - a.total : a.total - b.total;
                
                default:
                    return 0;
            }
        });

        return filtered;
    }, [orders, filters]);

    const handleUpdateStatus = useCallback((orderId: number, newStatus: webpedidos_estado) => {
        updateOrderStatus(orderId, newStatus)
            .then(() => {
                toast.success(`Pedido #${orderId} actualizado a ${newStatus}.`);
                reloadOrders();
                
                // Si el pedido seleccionado fue actualizado, actualizar también
                if (selectedOrder && selectedOrder.id === orderId) {
                    setSelectedOrder(prev => prev ? { ...prev, estado: newStatus } : null);
                }
            })
            .catch((err: any) => {
                console.error(err);
                toast.error(err.message || 'Error al actualizar el estado del pedido.');
            });
    }, [updateOrderStatus, reloadOrders, selectedOrder]);

    // Agrupar pedidos por estado para vista organizada
    const groupedOrders = useMemo(() => {
        const groups = {
            [WEBPEDIDOS_ESTADO.EnCamino]: [] as ApiWebPedido[],
            [WEBPEDIDOS_ESTADO.ListoParaRecoger]: [] as ApiWebPedido[],
            [WEBPEDIDOS_ESTADO.EnPreparacion]: [] as ApiWebPedido[],
            otros: [] as ApiWebPedido[],
        };

        filteredAndSortedOrders.forEach(order => {
            if (order.estado === WEBPEDIDOS_ESTADO.EnCamino) {
                groups[WEBPEDIDOS_ESTADO.EnCamino].push(order);
            } else if (order.estado === WEBPEDIDOS_ESTADO.ListoParaRecoger) {
                groups[WEBPEDIDOS_ESTADO.ListoParaRecoger].push(order);
            } else if (order.estado === WEBPEDIDOS_ESTADO.EnPreparacion) {
                groups[WEBPEDIDOS_ESTADO.EnPreparacion].push(order);
            } else {
                groups.otros.push(order);
            }
        });

        return groups;
    }, [filteredAndSortedOrders]);

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Cabecera Fija */}
            <div className="bg-white border-b border-gray-200/60">
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="p-1.5 bg-blue-100 rounded-lg">
                                <GlobeIcon className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">Pedidos Web</h1>
                                <p className="text-gray-600 text-xs">
                                    {filteredAndSortedOrders.length} activo{filteredAndSortedOrders.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <button 
                                onClick={reloadOrders} 
                                disabled={isLoading}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
                                title="Recargar pedidos"
                            >
                                <RefreshIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Contenido Principal */}
            <div className="p-3">
                {/* Filtros */}
                <OrderFilters 
                    filters={filters}
                    onFiltersChange={setFilters}
                    orderCount={filteredAndSortedOrders.length}
                />

                {isLoading && (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600 text-sm">Cargando pedidos...</p>
                    </div>
                )}

                {error && (
                    <div className="text-center py-6 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-red-600 font-medium text-sm">Error al cargar pedidos</p>
                        <p className="text-red-500 text-xs mt-1">{error}</p>
                        <button 
                            onClick={reloadOrders}
                            className="mt-2 px-3 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                        >
                            Reintentar
                        </button>
                    </div>
                )}
                
                {!isLoading && !error && filteredAndSortedOrders.length === 0 && (
                    <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                        <TruckIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">No hay pedidos activos</h3>
                        <p className="text-gray-600 text-sm max-w-md mx-auto">
                            {filters.search || filters.estado !== 'all' || filters.tipo !== 'all' 
                                ? 'Prueba ajustando los filtros de búsqueda.'
                                : 'Todos los pedidos han sido entregados.'
                            }
                        </p>
                    </div>
                )}

                {/* Vista Principal */}
                {!isLoading && !error && filteredAndSortedOrders.length > 0 && (
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Panel de Lista */}
                        <div className={`${selectedOrder ? 'lg:w-2/5 xl:w-1/3' : 'w-full'}`}>
                            <div className="space-y-4">
                                {/* En Camino */}
                                {groupedOrders[WEBPEDIDOS_ESTADO.EnCamino].length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1">
                                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                            En Camino ({groupedOrders[WEBPEDIDOS_ESTADO.EnCamino].length})
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
                                            {groupedOrders[WEBPEDIDOS_ESTADO.EnCamino].map(order => (
                                                <CompactOrderCard
                                                    key={order.id}
                                                    order={order}
                                                    onUpdateStatus={handleUpdateStatus}
                                                    onSelect={setSelectedOrder}
                                                    isSelected={selectedOrder?.id === order.id}
                                                    onPrintTicket={handlePrintTicket}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Listos para Recoger */}
                                {groupedOrders[WEBPEDIDOS_ESTADO.ListoParaRecoger].length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 mb-2">
                                            Listos ({groupedOrders[WEBPEDIDOS_ESTADO.ListoParaRecoger].length})
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
                                            {groupedOrders[WEBPEDIDOS_ESTADO.ListoParaRecoger].map(order => (
                                                <CompactOrderCard
                                                    key={order.id}
                                                    order={order}
                                                    onUpdateStatus={handleUpdateStatus}
                                                    onSelect={setSelectedOrder}
                                                    isSelected={selectedOrder?.id === order.id}
                                                    onPrintTicket={handlePrintTicket}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* En Preparación */}
                                {groupedOrders[WEBPEDIDOS_ESTADO.EnPreparacion].length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-500 mb-2">
                                            En Preparación ({groupedOrders[WEBPEDIDOS_ESTADO.EnPreparacion].length})
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
                                            {groupedOrders[WEBPEDIDOS_ESTADO.EnPreparacion].map(order => (
                                                <CompactOrderCard
                                                    key={order.id}
                                                    order={order}
                                                    onUpdateStatus={handleUpdateStatus}
                                                    onSelect={setSelectedOrder}
                                                    isSelected={selectedOrder?.id === order.id}
                                                    onPrintTicket={handlePrintTicket}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Otros estados */}
                                {groupedOrders.otros.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-500 mb-2">
                                            Otros ({groupedOrders.otros.length})
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
                                            {groupedOrders.otros.map(order => (
                                                <CompactOrderCard
                                                    key={order.id}
                                                    order={order}
                                                    onUpdateStatus={handleUpdateStatus}
                                                    onSelect={setSelectedOrder}
                                                    isSelected={selectedOrder?.id === order.id}
                                                    onPrintTicket={handlePrintTicket}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Panel de Detalle */}
                        {selectedOrder && (
                            <div className="hidden lg:block flex-1 sticky top-4 self-start">
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                    <div className="flex justify-between items-center p-3 border-b border-gray-200">
                                        <h3 className="font-bold text-sm">Detalle del Pedido</h3>
                                        <button
                                            onClick={() => setSelectedOrder(null)}
                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                        >
                                            <XIcon className="w-4 h-4 text-gray-500" />
                                        </button>
                                    </div>
                                    <div className="max-h-[calc(100vh-140px)] overflow-y-auto">
                                        <WebOrderDetailCard 
                                            order={selectedOrder} 
                                            onUpdateStatus={handleUpdateStatus} 
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WebOrdersManagementPage;