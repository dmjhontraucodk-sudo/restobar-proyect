// frontend/src/pages/dashboard/KitchenManagement.tsx - CORREGIDO

import React from 'react';
import { useKitchenManagement, type KitchenOrder } from '../../hooks/useKitchenManagement';
import { 
    type webpedidos_estado, 
    type webpedidos_tipo,
    WEBPEDIDOS_ESTADO,
    WEBPEDIDOS_TIPO 
} from '../../types';
import { 
    RefreshIcon, 
    ClockIcon, 
    ChefHatIcon, 
    CheckCircleIcon, 
    UserIcon,
    MapPinIcon,
    ExclamationIcon
} from '../../components/icons'; 
import toast from 'react-hot-toast';

// --- Función Auxiliar para mapear estados a colores MEJORADA ---
const getStatusClasses = (estado: webpedidos_estado) => {
    switch (estado) {
        case WEBPEDIDOS_ESTADO.Pendiente:
            return { 
                color: 'bg-amber-500/10 border-amber-500/30 text-amber-700', 
                dot: 'bg-amber-500',
                label: 'Pendiente' 
            };
        case WEBPEDIDOS_ESTADO.EnPreparacion:
            return { 
                color: 'bg-blue-500/10 border-blue-500/30 text-blue-700',
                dot: 'bg-blue-500',
                label: 'En Preparación' 
            };
        case WEBPEDIDOS_ESTADO.ListoParaRecoger:
            return { 
                color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700',
                dot: 'bg-emerald-500',
                label: 'Listo' 
            };
        case WEBPEDIDOS_ESTADO.EnCamino:
            return { 
                color: 'bg-purple-500/10 border-purple-500/30 text-purple-700',
                dot: 'bg-purple-500',
                label: 'En Camino' 
            };
        default:
            return { 
                color: 'bg-gray-500/10 border-gray-500/30 text-gray-700',
                dot: 'bg-gray-500',
                label: estado 
            };
    }
};

const getTipoPedidoLabel = (tipo: webpedidos_tipo): string => {
    return tipo === WEBPEDIDOS_TIPO.EntregaDomicilio ? 'A Domicilio' : 'Recoger en Local';
};

// --- Componente de Tarjeta de Pedido MEJORADO ---
const KitchenOrderCard: React.FC<{ 
    order: KitchenOrder; 
    updateStatus: (id: number, status: webpedidos_estado) => Promise<void>;
}> = ({ order, updateStatus }) => {
    const status = getStatusClasses(order.estado);
    
    const handleAction = async (newStatus: webpedidos_estado) => {
        await toast.promise(
            updateStatus(order.id, newStatus),
            {
                loading: 'Actualizando estado...',
                success: '¡Estado actualizado correctamente!',
                error: (err) => `Error: ${err.message || 'No se pudo actualizar'}`,
            }
        );
    };

    const isActionDisabled = 
        order.estado === WEBPEDIDOS_ESTADO.ListoParaRecoger || 
        order.estado === WEBPEDIDOS_ESTADO.EnCamino;
    
    // Calcular tiempo transcurrido
    const createdDate = new Date(order.created_at);
    const now = new Date();
    const minutesElapsed = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60));
    
    const isLate = minutesElapsed > 30 && order.estado !== WEBPEDIDOS_ESTADO.ListoParaRecoger;
    const isUrgent = minutesElapsed > 45;

    return (
        <div className={`
            relative bg-white rounded-2xl shadow-lg p-5 border-2 transition-all duration-300 hover:shadow-xl
            ${isUrgent ? 'border-red-500 animate-pulse' : isLate ? 'border-orange-500' : 'border-gray-200'}
            ${isUrgent ? 'bg-red-50/30' : ''}
        `}>
            {/* Indicador de Urgencia */}
            {isUrgent && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-bounce">
                    <ExclamationIcon className="w-3 h-3 inline mr-1" />
                    URGENTE
                </div>
            )}

            {/* Cabecera Mejorada */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                    <div className="flex flex-col">
                        <h3 className="font-black text-2xl text-gray-900 tracking-tight">
                            #{order.numero_pedido}
                        </h3>
                        <div className="flex items-center mt-1 space-x-2">
                            <div className="flex items-center text-sm font-medium text-gray-500">
                                <ClockIcon className="w-4 h-4 mr-1" />
                                {minutesElapsed} min
                            </div>
                            {isLate && !isUrgent && (
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                                    Atrasado
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-full border ${status.color}`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${status.dot}`}></div>
                        <span className="text-sm font-semibold">{status.label}</span>
                    </div>
                    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        order.tipo_pedido === WEBPEDIDOS_TIPO.EntregaDomicilio 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                    }`}>
                        <MapPinIcon className="w-3 h-3 mr-1" />
                        {getTipoPedidoLabel(order.tipo_pedido)}
                    </div>
                </div>
            </div>

            {/* Información del Cliente */}
            <div className="flex items-center mb-4 p-3 bg-gray-50 rounded-xl">
                <UserIcon className="w-4 h-4 text-gray-600 mr-2" />
                <span className="text-sm font-semibold text-gray-800">{order.cliente_nombre}</span>
            </div>

            {/* Lista de Productos Mejorada */}
            <div className="mb-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">PRODUCTOS</h4>
                <ul className="space-y-2">
                    {order.webpedidos_detalles.map((detalle, index) => (
                        <li key={detalle.id || index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                            <div className="flex items-center">
                                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                                    {detalle.cantidad}
                                </span>
                                <span className="text-sm font-medium text-gray-800">{detalle.productos.nombre}</span>
                            </div>
                            {/* Notas del producto - si existen en tu tipo de datos */}
                            {/* {detalle.notas && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {detalle.notas}
                                </span>
                            )} */}
                        </li>
                    ))}
                </ul>
            </div>
            
            {/* Notas Especiales Mejoradas */}
            {order.notas_especiales && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">NOTAS ESPECIALES</p>
                    <p className="text-sm text-amber-900">{order.notas_especiales}</p>
                </div>
            )}

            {/* Acciones Mejoradas */}
            <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                {order.estado === WEBPEDIDOS_ESTADO.Pendiente && (
                    <button
                        onClick={() => handleAction(WEBPEDIDOS_ESTADO.EnPreparacion)}
                        className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        <ChefHatIcon className="w-5 h-5 mr-2" />
                        Empezar Preparación
                    </button>
                )}
                
                {order.estado === WEBPEDIDOS_ESTADO.EnPreparacion && (
                    <button
                        onClick={() => handleAction(WEBPEDIDOS_ESTADO.ListoParaRecoger)}
                        className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        <CheckCircleIcon className="w-5 h-5 mr-2" />
                        Marcar como Listo
                    </button>
                )}

                {isActionDisabled && (
                    <div className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold">
                        <CheckCircleIcon className="w-5 h-5 mr-2 text-green-500" />
                        Esperando Entrega
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Componente Principal MEJORADO ---
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
    
    const activeOrders = orders.filter(o => 
        o.estado !== WEBPEDIDOS_ESTADO.Entregado && 
        o.estado !== WEBPEDIDOS_ESTADO.Cancelado
    );

    const pendingOrders = activeOrders.filter(o => o.estado === WEBPEDIDOS_ESTADO.Pendiente);
    const preparingOrders = activeOrders.filter(o => o.estado === WEBPEDIDOS_ESTADO.EnPreparacion);
    const readyOrders = activeOrders.filter(o => 
        o.estado === WEBPEDIDOS_ESTADO.ListoParaRecoger || 
        o.estado === WEBPEDIDOS_ESTADO.EnCamino
    );

    React.useEffect(() => {
        if (error) {
            toast.error(`Error: ${error}`);
        }
    }, [error]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            {/* Header Mejorado */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white rounded-2xl shadow-lg">
                            <ChefHatIcon className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                                Vista de Cocina
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Gestiona y prepara los pedidos activos
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        <button 
                            onClick={reloadOrders} 
                            disabled={isLoading}
                            className="flex items-center px-4 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-200 disabled:opacity-50"
                        >
                            <RefreshIcon className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            <span className="font-semibold">
                                {isLoading ? 'Cargando...' : 'Recargar'}
                            </span>
                        </button>
                        
                        <button
                            onClick={() => setIsPolling(prev => !prev)}
                            className={`flex items-center px-4 py-2.5 rounded-xl transition-all duration-300 shadow-lg font-semibold ${
                                isPolling 
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700' 
                                    : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700'
                            }`}
                        >
                            <div className={`w-2 h-2 rounded-full mr-2 ${isPolling ? 'bg-white animate-pulse' : 'bg-red-300'}`}></div>
                            {isPolling ? 'En Vivo' : 'Pausado'}
                        </button>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white rounded-2xl p-4 shadow-lg border-l-4 border-amber-500">
                        <div className="text-2xl font-black text-gray-900">{pendingOrders.length}</div>
                        <div className="text-sm font-medium text-gray-600">Pendientes</div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-lg border-l-4 border-blue-500">
                        <div className="text-2xl font-black text-gray-900">{preparingOrders.length}</div>
                        <div className="text-sm font-medium text-gray-600">En Preparación</div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-lg border-l-4 border-emerald-500">
                        <div className="text-2xl font-black text-gray-900">{readyOrders.length}</div>
                        <div className="text-sm font-medium text-gray-600">Listos</div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-lg border-l-4 border-purple-500">
                        <div className="text-2xl font-black text-gray-900">{activeOrders.length}</div>
                        <div className="text-sm font-medium text-gray-600">Total Activos</div>
                    </div>
                </div>
            </div>

            {isLoading && activeOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl shadow-lg">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-lg font-semibold text-gray-700">Cargando pedidos de cocina...</p>
                    <p className="text-gray-500 mt-1">Preparando todo para ti</p>
                </div>
            )}
            
            {/* Dashboard Kanban Mejorado */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <PedidoColumna 
                    title="Pendientes" 
                    icon={ClockIcon}
                    count={pendingOrders.length}
                    color="amber"
                >
                    {pendingOrders.map(order => (
                        <KitchenOrderCard 
                            key={order.id} 
                            order={order} 
                            updateStatus={updateOrderStatus} 
                        />
                    ))}
                </PedidoColumna>

                <PedidoColumna 
                    title="En Preparación" 
                    icon={ChefHatIcon}
                    count={preparingOrders.length}
                    color="blue"
                >
                    {preparingOrders.map(order => (
                        <KitchenOrderCard 
                            key={order.id} 
                            order={order} 
                            updateStatus={updateOrderStatus} 
                        />
                    ))}
                </PedidoColumna>

                <PedidoColumna 
                    title="Listos para Entregar" 
                    icon={CheckCircleIcon}
                    count={readyOrders.length}
                    color="emerald"
                >
                    {readyOrders.map(order => (
                        <KitchenOrderCard 
                            key={order.id} 
                            order={order} 
                            updateStatus={updateOrderStatus} 
                        />
                    ))}
                    
                    {readyOrders.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-2xl shadow-lg border-2 border-dashed border-gray-300">
                            <CheckCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">Esperando pedidos listos</p>
                            <p className="text-gray-400 text-sm mt-1">Los pedidos aparecerán aquí</p>
                        </div>
                    )}
                </PedidoColumna>
            </div>
            
            {activeOrders.length === 0 && !isLoading && (
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border-2 border-dashed border-gray-300 p-16 text-center mt-8">
                    <ChefHatIcon className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                    <h3 className="text-2xl font-black text-gray-900 mb-2">
                        ¡Excelente trabajo!
                    </h3>
                    <p className="text-gray-600 text-lg max-w-md mx-auto">
                        No hay pedidos activos en la cocina. Todo está bajo control.
                    </p>
                </div>
            )}
        </div>
    );
};

// Componente de Columna MEJORADO
interface ColumnaProps {
    title: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    children: React.ReactNode;
    count: number;
    color: 'amber' | 'blue' | 'emerald' | 'purple';
}

const PedidoColumna: React.FC<ColumnaProps> = ({ title, icon: Icon, children, count, color }) => {
    const colorClasses = {
        amber: 'bg-amber-500 text-white',
        blue: 'bg-blue-500 text-white',
        emerald: 'bg-emerald-500 text-white',
        purple: 'bg-purple-500 text-white'
    };

    return (
        <div className="flex flex-col">
            <div className={`flex items-center p-4 rounded-2xl ${colorClasses[color]} mb-4 shadow-lg`}>
                <Icon className="w-6 h-6 mr-3" />
                <h2 className="text-lg font-black uppercase tracking-wider flex-1">{title}</h2>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm">
                    {count}
                </span>
            </div>
            <div className="flex flex-col space-y-4">
                {children}
            </div>
        </div>
    );
};

export default KitchenManagementPage;