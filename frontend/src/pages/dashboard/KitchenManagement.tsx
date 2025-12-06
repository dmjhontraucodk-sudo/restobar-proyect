// frontend/src/pages/dashboard/KitchenManagement.tsx - SOLO PEDIDOS EN COCINA

import React, { useState } from 'react';
import { useKitchenManagement, type KitchenOrder } from '@features/kitchen/model/useKitchenManagement';
import { 
    type webpedidos_estado, 
    WEBPEDIDOS_ESTADO,
} from '@shared/types';
import { 
    RefreshIcon, 
    ClockIcon, 
    ChefHatIcon, 
    CheckCircleIcon, 
    MapPinIcon,
    ExclamationIcon,
    TableIcon,
    SearchIcon
} from '@shared/ui/Icons'; 
import toast from 'react-hot-toast';

// --- Función Auxiliar para mapear estados a colores ---
const getStatusClasses = (estado: webpedidos_estado) => {
    switch (estado) {
        case WEBPEDIDOS_ESTADO.Pendiente:
            return { 
                bg: 'bg-amber-500',
                text: 'text-amber-700',
                border: 'border-amber-300',
                label: 'Pendiente' 
            };
        case WEBPEDIDOS_ESTADO.EnPreparacion:
            return { 
                bg: 'bg-blue-500',
                text: 'text-blue-700',
                border: 'border-blue-300',
                label: 'En Prep.' 
            };
        case WEBPEDIDOS_ESTADO.ListoParaRecoger:
            return { 
                bg: 'bg-emerald-500',
                text: 'text-emerald-700',
                border: 'border-emerald-300',
                label: 'Listo' 
            };
        case WEBPEDIDOS_ESTADO.EnCamino:
            return { 
                bg: 'bg-purple-500',
                text: 'text-purple-700',
                border: 'border-purple-300',
                label: 'En Camino' 
            };
        default:
            return { 
                bg: 'bg-gray-500',
                text: 'text-gray-700',
                border: 'border-gray-300',
                label: estado 
            };
    }
};

// --- Función Auxiliar para determinar la etiqueta de Origen ---
const getOriginLabel = (origen: string): { label: string, icon: React.FC<React.SVGProps<SVGSVGElement>>, color: string } => {
    if (origen === 'WEB') {
        return { 
            label: 'Web', 
            icon: MapPinIcon, 
            color: 'bg-purple-100 text-purple-700' 
        };
    }
    if (origen.startsWith('MESA-')) {
        const mesa = origen.split('-')[1];
        return { 
            label: `M${mesa}`, 
            icon: TableIcon, 
            color: 'bg-blue-100 text-blue-700' 
        };
    }
    return { 
        label: '?', 
        icon: ExclamationIcon, 
        color: 'bg-gray-100 text-gray-500' 
    };
};

// --- Componente de Ticket de Pedido COMPACTO ---
const KitchenOrderTicket: React.FC<{ 
    order: KitchenOrder; 
    updateStatus: (id: string, status: webpedidos_estado) => Promise<void>;
    isExpanded: boolean;
    onToggle: () => void;
}> = ({ order, updateStatus, isExpanded, onToggle }) => {
    const status = getStatusClasses(order.estado);
    const originInfo = getOriginLabel(order.origen);
    
    // Calcular tiempo transcurrido
    const createdDate = new Date(order.created_at);
    const now = new Date();
    const minutesElapsed = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60));
    
    const isLate = minutesElapsed > 30 && order.estado !== WEBPEDIDOS_ESTADO.ListoParaRecoger;
    const isUrgent = minutesElapsed > 45;

    const handleAction = async (newStatus: webpedidos_estado) => {
        await toast.promise(
            updateStatus(order.id, newStatus),
            {
                loading: 'Actualizando estado...',
                success: '¡Estado actualizado!',
                error: (err) => `Error: ${err.message || 'No se pudo actualizar'}`,
            }
        );
    };

    return (
        <div className={`
            bg-white rounded-lg border-l-4 ${status.border} shadow-sm hover:shadow-md transition-all duration-200
            ${isUrgent ? 'animate-pulse bg-red-50' : isLate ? 'bg-orange-50' : ''}
            ${isExpanded ? 'ring-2 ring-blue-500' : ''}
        `}>
            {/* Header Compacto */}
            <div 
                className="p-3 cursor-pointer"
                onClick={onToggle}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        {/* Número de Orden */}
                        <div className="flex items-center">
                            <span className="text-lg font-bold text-gray-900">#{order.numero_orden}</span>
                        </div>
                        
                        {/* Origen */}
                        <div className={`px-2 py-1 rounded text-xs font-medium ${originInfo.color}`}>
                            <originInfo.icon className="w-3 h-3 inline mr-1" />
                            {originInfo.label}
                        </div>

                        {/* Cliente/Mesa */}
                        <div className="text-sm text-gray-700 font-medium max-w-20 truncate">
                            {order.cliente_mesa_nombre}
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        {/* Tiempo */}
                        <div className={`flex items-center text-sm font-medium ${
                            isUrgent ? 'text-red-600' : isLate ? 'text-orange-600' : 'text-gray-500'
                        }`}>
                            <ClockIcon className="w-3 h-3 mr-1" />
                            {minutesElapsed}m
                        </div>

                        {/* Estado */}
                        <div className={`px-2 py-1 rounded-full text-xs font-bold ${status.text} bg-white border ${status.border}`}>
                            {status.label}
                        </div>

                        {/* Indicador de expansión */}
                        <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            ▼
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido Expandible */}
            {isExpanded && (
                <div className="border-t border-gray-200 p-3 bg-gray-50">
                    {/* Productos */}
                    <div className="mb-3">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Productos:</div>
                        <div className="space-y-1">
                            {order.items.map((detalle, index) => (
                                <div key={detalle.id_detalle || index} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center">
                                        <span className="w-5 h-5 bg-gray-600 text-white rounded text-xs flex items-center justify-center mr-2">
                                            {detalle.cantidad}
                                        </span>
                                        <span>{detalle.producto_nombre}</span>
                                    </div>
                                    {detalle.notas && (
                                        <span className="text-xs text-gray-500 bg-white px-1 rounded border">
                                            Nota
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Notas Especiales */}
                    {order.notas_especiales && (
                        <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-sm">
                            <div className="text-xs font-semibold text-amber-700 mb-1">Nota:</div>
                            {order.notas_especiales}
                        </div>
                    )}

                    {/* Acciones - SOLO para pedidos en preparación */}
                    <div className="flex space-x-2 pt-2">
                        {order.estado === WEBPEDIDOS_ESTADO.EnPreparacion && (
                            <button
                                onClick={() => handleAction(WEBPEDIDOS_ESTADO.ListoParaRecoger)}
                                className="flex-1 bg-emerald-600 text-white py-2 px-3 rounded text-sm font-semibold hover:bg-emerald-700 transition-colors"
                            >
                                <CheckCircleIcon className="w-3 h-3 inline mr-1" />
                                Marcar como Listo
                            </button>
                        )}

                        {order.estado === WEBPEDIDOS_ESTADO.ListoParaRecoger && (
                            <div className="flex-1 bg-green-100 text-green-700 py-2 px-3 rounded text-sm font-semibold text-center border border-green-300">
                                <CheckCircleIcon className="w-3 h-3 inline mr-1" />
                                ✅ Listo para servir
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Componente Principal REDISEÑADO ---
const KitchenManagementPage: React.FC = () => {
    const { 
        orders, 
        isLoading, 
        error, 
        reloadOrders, 
        updateOrderStatus, 
        isPolling, 
        setIsPolling 
    } = useKitchenManagement();

    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // ⭐ FILTRO PRINCIPAL: SOLO mostrar pedidos en estado "EnPreparacion"
    const activeOrders = orders.filter(o => 
        o.estado !== WEBPEDIDOS_ESTADO.Entregado && 
        o.estado !== WEBPEDIDOS_ESTADO.Cancelado &&
        o.estado === WEBPEDIDOS_ESTADO.EnPreparacion // ⭐ SOLO pedidos enviados a cocina
    );

    // Filtrar por búsqueda
    const filteredOrders = activeOrders.filter(order => {
        const matchesSearch = searchTerm === '' || 
            order.numero_orden.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.cliente_mesa_nombre.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // Separar por tiempo (para priorizar)
    const urgentOrders = filteredOrders.filter(o => {
        const minutesElapsed = Math.floor((new Date().getTime() - new Date(o.created_at).getTime()) / (1000 * 60));
        return minutesElapsed > 45;
    });

    const normalOrders = filteredOrders.filter(o => {
        const minutesElapsed = Math.floor((new Date().getTime() - new Date(o.created_at).getTime()) / (1000 * 60));
        return minutesElapsed <= 45;
    });

    React.useEffect(() => {
        if (error) {
            toast.error(`Error: ${error}`);
        }
    }, [error]);

    const toggleOrderExpansion = (orderId: string) => {
        setExpandedOrder(expandedOrder === orderId ? null : orderId);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            {/* Header Compacto */}
            <div className="mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                            <ChefHatIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Cocina</h1>
                            <p className="text-gray-600 text-sm">Solo pedidos en preparación</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                        {/* Búsqueda */}
                        <div className="relative">
                            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar pedido..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-48"
                            />
                        </div>

                        {/* Controles */}
                        <div className="flex space-x-2">
                            <button 
                                onClick={reloadOrders} 
                                disabled={isLoading}
                                className="flex items-center px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                <RefreshIcon className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                                <span className="text-sm">Recargar</span>
                            </button>
                            
                            <button
                                onClick={() => setIsPolling(prev => !prev)}
                                className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                                    isPolling 
                                        ? 'bg-green-600 text-white hover:bg-green-700' 
                                        : 'bg-gray-600 text-white hover:bg-gray-700'
                                }`}
                            >
                                <div className={`w-2 h-2 rounded-full mr-2 ${isPolling ? 'bg-white' : 'bg-red-300'}`}></div>
                                {isPolling ? 'En Vivo' : 'Pausado'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Overview Compacto */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-red-500">
                        <div className="text-xl font-bold text-gray-900">{urgentOrders.length}</div>
                        <div className="text-xs text-gray-600">🔥 Urgentes (+45m)</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-blue-500">
                        <div className="text-xl font-bold text-gray-900">{normalOrders.length}</div>
                        <div className="text-xs text-gray-600">En Preparación</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-emerald-500">
                        <div className="text-xl font-bold text-gray-900">{filteredOrders.length}</div>
                        <div className="text-xs text-gray-600">Total en Cocina</div>
                    </div>
                </div>
            </div>

            {/* Lista de Pedidos - Diseño Compacto */}
            {isLoading && filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 bg-white rounded-lg shadow-sm">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                    <p className="text-sm text-gray-600">Cargando pedidos...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Pedidos Urgentes primero */}
                    {urgentOrders.length > 0 && (
                        <div>
                            <h2 className="text-sm font-bold text-red-600 mb-2 flex items-center">
                                🔥 URGENTES (+45 minutos)
                            </h2>
                            <div className="space-y-2">
                                {urgentOrders.map(order => (
                                    <KitchenOrderTicket 
                                        key={order.id} 
                                        order={order} 
                                        updateStatus={updateOrderStatus}
                                        isExpanded={expandedOrder === order.id}
                                        onToggle={() => toggleOrderExpansion(order.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pedidos Normales */}
                    {normalOrders.length > 0 && (
                        <div>
                            {urgentOrders.length > 0 && (
                                <h2 className="text-sm font-bold text-blue-600 mb-2 mt-4">
                                    En Preparación
                                </h2>
                            )}
                            <div className="space-y-2">
                                {normalOrders.map(order => (
                                    <KitchenOrderTicket 
                                        key={order.id} 
                                        order={order} 
                                        updateStatus={updateOrderStatus}
                                        isExpanded={expandedOrder === order.id}
                                        onToggle={() => toggleOrderExpansion(order.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Estado vacío */}
            {filteredOrders.length === 0 && !isLoading && (
                <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-8 text-center">
                    <ChefHatIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        ¡Sin pedidos en cocina!
                    </h3>
                    <p className="text-gray-600 text-sm">
                        No hay pedidos enviados a cocina en este momento.
                    </p>
                    <p className="text-gray-500 text-xs mt-2">
                        Los pedidos aparecerán aquí cuando se envíen desde "Pedidos Web"
                    </p>
                </div>
            )}
        </div>
    );
};

export default KitchenManagementPage;