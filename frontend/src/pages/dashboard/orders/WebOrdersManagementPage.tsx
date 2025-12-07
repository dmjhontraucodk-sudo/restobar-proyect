// frontend/src/pages/dashboard/orders/WebOrdersManagementPage.tsx
import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useWebOrders } from '@features/orders/model/useWebOrders';
import { useGlobalConfig } from '@shared/hooks/useGlobalConfig';
import { 
    RefreshIcon, GlobeIcon, TruckIcon, ClockIcon, MapPinIcon,
    UserIcon, ChevronDownIcon, ChevronUpIcon, PhoneIcon, CheckIcon, ShoppingBagIcon
} from '@shared/ui/Icons';
import { 
    type ApiWebPedido, 
    type ApiWebPedidoDetalle,
    type webpedidos_estado, 
    WEBPEDIDOS_ESTADO,
    WEBPEDIDOS_TIPO
} from '@shared/types';

// --- UTILIDADES ---
const formatTime = (dateString: string) => {
    if (!dateString) return '--:--';
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'p. m.' : 'a. m.';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

const formatDateShort = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    return date.getDate() === now.getDate() && 
           date.getMonth() === now.getMonth() && 
           date.getFullYear() === now.getFullYear() 
           ? 'Hoy' 
           : date.toLocaleDateString('es-PE', { month: 'short', day: 'numeric' });
};

const calculateDuration = (start?: string | null, end?: string | null) => {
    if (!start) return null;
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : new Date().getTime();
    const diffMinutes = Math.floor((endTime - startTime) / 60000);
    
    if (diffMinutes < 60) return `${diffMinutes} min`;
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return `${hours}h ${mins}m`;
};

// --- COMPONENTES ---

const DeliveryInfo: React.FC<{ order: ApiWebPedido; employees: any[]; onAssign: (id: number) => void }> = ({ order, employees, onAssign }) => {
    const [isEditing, setIsEditing] = useState(false);

    if (order.tipo_pedido !== WEBPEDIDOS_TIPO.EntregaDomicilio) return null;

    return (
        <div className="mt-3 pt-3 border-t border-gray-100 bg-slate-50 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <TruckIcon className="w-3 h-3" /> Delivery
                </h4>
                {order.motorizado ? (
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                            {order.motorizado.nombre}
                        </span>
                        {!order.hora_salida_delivery && order.estado !== WEBPEDIDOS_ESTADO.Entregado && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsEditing(!isEditing); }}
                                className="text-[10px] text-gray-400 hover:text-blue-600 underline"
                            >
                                Cambiar
                            </button>
                        )}
                    </div>
                ) : (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsEditing(!isEditing); }}
                        className="text-xs text-blue-600 hover:underline font-medium"
                    >
                        + Asignar
                    </button>
                )}
            </div>

            {/* Selector de Motorizado */}
            {(isEditing || (!order.motorizado && order.estado === WEBPEDIDOS_ESTADO.EnPreparacion)) && (
                <div className="mb-3" onClick={e => e.stopPropagation()}>
                    <select 
                        className="w-full text-xs border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-1.5 bg-white"
                        onChange={(e) => {
                            if (e.target.value) {
                                onAssign(Number(e.target.value));
                                setIsEditing(false);
                            }
                        }}
                        defaultValue=""
                    >
                        <option value="" disabled>Seleccionar repartidor...</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Cronología de Tiempos */}
            {(order.hora_salida_delivery || order.hora_entrega_delivery) && (
                <div className="flex gap-2 text-[10px] items-center justify-center bg-white border border-gray-200 rounded p-1.5">
                    <div className="flex items-center gap-1">
                        <span className="text-gray-400">Salida:</span>
                        <span className="font-bold text-gray-700">{order.hora_salida_delivery ? formatTime(order.hora_salida_delivery) : '--'}</span>
                    </div>
                    <span className="text-gray-300">|</span>
                    <div className="flex items-center gap-1">
                        <span className="text-gray-400">Llegada:</span>
                        <span className="font-bold text-gray-700">{order.hora_entrega_delivery ? formatTime(order.hora_entrega_delivery) : '--'}</span>
                    </div>
                </div>
            )}

            {/* Duración Total */}
            {order.hora_salida_delivery && (
                <div className={`mt-2 flex items-center justify-center gap-1.5 text-xs font-bold p-1 rounded ${
                    order.hora_entrega_delivery ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600 animate-pulse'
                }`}>
                    <ClockIcon className="w-3 h-3" />
                    {order.hora_entrega_delivery 
                        ? `Total: ${calculateDuration(order.hora_salida_delivery, order.hora_entrega_delivery)}`
                        : `En ruta: ${calculateDuration(order.hora_salida_delivery)}`
                    }
                </div>
            )}
        </div>
    );
};

interface OrderCardProps {
    order: ApiWebPedido;
    employees: any[];
    onUpdateStatus: (id: number, status: webpedidos_estado) => void;
    onAssignMotorizado: (orderId: number, empId: number) => void;
    isExpanded: boolean;
    onToggle: () => void;
}

const WebOrderDetailCard: React.FC<OrderCardProps> = ({ 
    order, 
    employees, 
    onUpdateStatus, 
    onAssignMotorizado,
    isExpanded,
    onToggle
}) => {
    
    const { formatCurrency } = useGlobalConfig();
    const isDelivery = order.tipo_pedido === WEBPEDIDOS_TIPO.EntregaDomicilio;
    const totalItems = order.webpedidos_detalles.reduce((sum: number, item: ApiWebPedidoDetalle) => sum + item.cantidad, 0);
    const mainProduct = order.webpedidos_detalles[0]?.productos?.nombre || 'Productos';
    
    const statusConfig = {
        [WEBPEDIDOS_ESTADO.Pendiente]: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pendiente' },
        [WEBPEDIDOS_ESTADO.Confirmado]: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Confirmado' },
        [WEBPEDIDOS_ESTADO.EnPreparacion]: { color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'En Cocina' },
        [WEBPEDIDOS_ESTADO.ListoParaRecoger]: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Listo' },
        [WEBPEDIDOS_ESTADO.EnCamino]: { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'En Ruta' },
        [WEBPEDIDOS_ESTADO.Entregado]: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Entregado' },
        [WEBPEDIDOS_ESTADO.Cancelado]: { color: 'bg-gray-100 text-gray-600 border-gray-200', label: 'Cancelado' },
    };
    
    const status = statusConfig[order.estado];

    // Acciones disponibles
    const renderActions = () => {
        if (order.estado === WEBPEDIDOS_ESTADO.Entregado || order.estado === WEBPEDIDOS_ESTADO.Cancelado) return null;

        return (
            <div className="mt-4 space-y-2" onClick={e => e.stopPropagation()}>
                {order.estado === WEBPEDIDOS_ESTADO.Pendiente && (
                    <button onClick={() => onUpdateStatus(order.id, WEBPEDIDOS_ESTADO.Confirmado)} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold shadow-sm transition-all">
                        Aceptar Pedido
                    </button>
                )}
                
                {order.estado === WEBPEDIDOS_ESTADO.Confirmado && (
                    <button onClick={() => onUpdateStatus(order.id, WEBPEDIDOS_ESTADO.EnPreparacion)} className="w-full py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-bold shadow-sm transition-all">
                        Enviar a Cocina
                    </button>
                )}

                {/* DESPACHO: Solo si está listo */}
                {order.estado === WEBPEDIDOS_ESTADO.ListoParaRecoger && (
                    isDelivery ? (
                        <button 
                            onClick={() => {
                                if (!order.motorizado_id) {
                                    toast.error("⚠️ Asigna un motorizado antes de despachar");
                                    return;
                                }
                                onUpdateStatus(order.id, WEBPEDIDOS_ESTADO.EnCamino);
                            }} 
                            className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-all"
                        >
                            <TruckIcon className="w-4 h-4" /> Iniciar Ruta
                        </button>
                    ) : (
                        <button onClick={() => onUpdateStatus(order.id, WEBPEDIDOS_ESTADO.Entregado)} className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-bold shadow-sm transition-all">
                            Entregar en Tienda
                        </button>
                    )
                )}

                {/* FINALIZAR RUTA */}
                {order.estado === WEBPEDIDOS_ESTADO.EnCamino && (
                    <button onClick={() => onUpdateStatus(order.id, WEBPEDIDOS_ESTADO.Entregado)} className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-all animate-pulse">
                        Confirmar Entrega
                    </button>
                )}

                <button onClick={() => onUpdateStatus(order.id, WEBPEDIDOS_ESTADO.Cancelado)} className="w-full py-1.5 text-red-500 hover:bg-red-50 rounded text-xs font-medium transition-colors">
                    Cancelar Pedido
                </button>
            </div>
        );
    };

    // Contenido expandido (compacto)
    const ExpandedContent = () => (
        <div className="mt-2 pt-2 border-t border-gray-200">
            {/* Productos */}
            <div className="mb-2">
                <div className="flex justify-between items-center mb-1">
                    <h4 className="text-xs font-medium text-gray-700">Productos ({totalItems})</h4>
                    <span className="text-[10px] text-gray-500">{totalItems} items</span>
                </div>
                <div className="space-y-1.5">
                    {order.webpedidos_detalles.map((d: ApiWebPedidoDetalle) => (
                        <div key={d.id} className="flex justify-between items-center">
                            <div className="text-xs text-gray-900">
                                <span className="font-bold">{d.cantidad}x</span> {d.productos?.nombre}
                            </div>
                            <div className="text-xs font-medium text-gray-900">
                                {formatCurrency(Number(d.subtotal))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Notas del pedido */}
            {order.notas && (
                <div className="mb-2 p-1.5 bg-yellow-50 rounded border border-yellow-100">
                    <p className="text-[10px] font-medium text-yellow-700 mb-0.5">📝 Notas:</p>
                    <p className="text-[10px] text-yellow-800 italic">"{order.notas}"</p>
                </div>
            )}
            
            {/* Delivery Info con asignación */}
            <DeliveryInfo order={order} employees={employees} onAssign={(id) => onAssignMotorizado(order.id, id)} />
            
            {renderActions()}
        </div>
    );

    return (
        <div 
            className={`bg-white rounded-xl border shadow-sm transition-all duration-200 overflow-hidden hover:shadow-md cursor-pointer ${
                isExpanded ? 'ring-1 ring-blue-300 border-blue-300' : 'border-gray-200'
            }`}
            onClick={onToggle}
        >
            <div className="p-2.5">
                {/* Cabecera */}
                <div className="flex justify-between items-start mb-1.5">
                    <div className="flex-1">
                        <div className="flex items-center gap-1 mb-0.5">
                            <span className="font-bold text-sm text-gray-900">
                                #{order.numero_pedido.split('-').pop()}
                            </span>
                            <span className={`px-1 py-0.5 rounded text-[10px] font-bold uppercase ${status.color.split(' ')[0]} ${status.color.split(' ')[1]}`}>
                                {status.label}
                            </span>
                            {isDelivery && (
                                <span className="px-1 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-600">
                                    Delivery
                                </span>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                            <ClockIcon className="w-3 h-3" />
                            {formatDateShort(order.created_at)} • {formatTime(order.created_at)}
                        </div>
                    </div>
                    
                    <div className="text-right">
                        <div className="font-bold text-green-600 text-sm">
                            {formatCurrency(Number(order.total))}
                        </div>
                    </div>
                </div>
                
                {/* Cliente */}
                <div className="mb-1.5">
                    <div className="flex items-center gap-1 mb-0.5">
                        <UserIcon className="w-3 h-3 text-gray-400" />
                        <span className="font-medium text-xs text-gray-800">{order.cliente_nombre}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-600">
                        <PhoneIcon className="w-2.5 h-2.5" />
                        {order.cliente_telefono}
                    </div>
                </div>
                
                {/* Productos Resumen */}
                <div className="mb-1.5 flex items-center gap-1 text-xs">
                    <ShoppingBagIcon className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-700">
                        <span className="font-medium">{totalItems} items</span>
                        <span className="text-gray-500"> • {mainProduct}</span>
                        {order.webpedidos_detalles.length > 1 && (
                            <span className="text-gray-500"> +{order.webpedidos_detalles.length - 1}</span>
                        )}
                    </span>
                </div>
                
                {/* Dirección */}
                {isDelivery && order.direccion_entrega && (
                    <div className="mb-1.5 flex items-start gap-1 text-[10px] text-gray-600">
                        <MapPinIcon className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                        <span className="truncate">{order.direccion_entrega}</span>
                    </div>
                )}
                
                {/* Estado delivery */}
                {isDelivery && order.motorizado && (
                    <div className="mb-1.5 flex items-center gap-1 text-[10px]">
                        <TruckIcon className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-700">
                            {order.hora_salida_delivery ? 'En ruta' : 'Asignado'}
                        </span>
                        <span className="text-blue-600 font-medium ml-auto">
                            {order.motorizado.nombre}
                        </span>
                    </div>
                )}
                
                {/* Botón expandir */}
                <div className="pt-1.5 border-t border-gray-200">
                    <button 
                        className={`flex items-center justify-center gap-1 w-full text-[10px] font-medium ${
                            isExpanded ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                        }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle();
                        }}
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUpIcon className="w-3 h-3" />
                                Menos detalles
                            </>
                        ) : (
                            <>
                                <ChevronDownIcon className="w-3 h-3" />
                                Ver detalles completos
                            </>
                        )}
                    </button>
                </div>
            </div>
            
            {/* Contenido expandido */}
            {isExpanded && (
                <div className="px-2.5 pb-2.5">
                    <ExpandedContent />
                </div>
            )}
        </div>
    );
};

// --- PÁGINA PRINCIPAL ---

export default function WebOrdersManagementPage() {
    const { orders, employees, reloadOrders, updateOrderStatus, assignMotorized, isLoading } = useWebOrders();
    const [filter, setFilter] = useState<string>('all');
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

    const filteredOrders = useMemo(() => {
        if (filter === 'all') return orders;
        return orders.filter(o => o.estado === filter);
    }, [orders, filter]);

    const counts = useMemo(() => ({
        all: orders.length,
        pendiente: orders.filter(o => o.estado === WEBPEDIDOS_ESTADO.Pendiente).length,
        confirmado: orders.filter(o => o.estado === WEBPEDIDOS_ESTADO.Confirmado).length,
        cocina: orders.filter(o => o.estado === WEBPEDIDOS_ESTADO.EnPreparacion).length,
        listo: orders.filter(o => o.estado === WEBPEDIDOS_ESTADO.ListoParaRecoger).length,
        ruta: orders.filter(o => o.estado === WEBPEDIDOS_ESTADO.EnCamino).length,
        entregado: orders.filter(o => o.estado === WEBPEDIDOS_ESTADO.Entregado).length,
        cancelado: orders.filter(o => o.estado === WEBPEDIDOS_ESTADO.Cancelado).length,
    }), [orders]);

    // Función para manejar el toggle de expansión
    const handleToggleOrder = (orderId: number) => {
        if (expandedOrderId === orderId) {
            // Si ya está expandido, lo cerramos
            setExpandedOrderId(null);
        } else {
            // Si no está expandido, lo expandimos (y cerramos cualquier otro)
            setExpandedOrderId(orderId);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-2.5">
            {/* Header */}
            <div className="mb-3">
                <div className="flex justify-between items-center mb-2">
                    <div>
                        <h1 className="text-base font-bold text-gray-900">Pedidos Web</h1>
                        <p className="text-gray-500 text-[10px]">Gestiona pedidos en tiempo real</p>
                    </div>
                    <button 
                        onClick={reloadOrders} 
                        className="flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-medium text-gray-600 hover:bg-gray-50"
                        disabled={isLoading}
                    >
                        <RefreshIcon className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                        {isLoading ? 'Actualizando...' : 'Actualizar'}
                    </button>
                </div>

                {/* Filtros */}
                <div className="flex flex-wrap gap-1 mb-2">
                    {[
                        { key: 'all', label: 'Todos', count: counts.all, color: 'gray' },
                        { key: WEBPEDIDOS_ESTADO.Pendiente, label: 'Pendientes', count: counts.pendiente, color: 'yellow' },
                        { key: WEBPEDIDOS_ESTADO.Confirmado, label: 'Confirmados', count: counts.confirmado, color: 'blue' },
                        { key: WEBPEDIDOS_ESTADO.EnPreparacion, label: 'Cocina', count: counts.cocina, color: 'orange' },
                        { key: WEBPEDIDOS_ESTADO.ListoParaRecoger, label: 'Listos', count: counts.listo, color: 'purple' },
                        { key: WEBPEDIDOS_ESTADO.EnCamino, label: 'En Ruta', count: counts.ruta, color: 'indigo' },
                        { key: WEBPEDIDOS_ESTADO.Entregado, label: 'Entregados', count: counts.entregado, color: 'green' },
                        { key: WEBPEDIDOS_ESTADO.Cancelado, label: 'Cancelados', count: counts.cancelado, color: 'gray' },
                    ].map(item => (
                        <button
                            key={item.key}
                            onClick={() => setFilter(item.key)}
                            className={`
                                flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors
                                ${filter === item.key 
                                    ? `bg-${item.color}-600 text-white` 
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                }
                            `}
                        >
                            <span>{item.label}</span>
                            {item.count > 0 && (
                                <span className={`
                                    px-0.5 py-0.5 rounded text-[8px]
                                    ${filter === item.key 
                                        ? 'bg-white/20' 
                                        : `bg-${item.color}-100 text-${item.color}-600`
                                    }
                                `}>
                                    {item.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid de Pedidos */}
            {filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 bg-white rounded border border-dashed border-gray-300">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-1.5">
                        <GlobeIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <h3 className="text-xs font-medium text-gray-700 mb-0.5">No hay pedidos</h3>
                    <p className="text-gray-500 text-[10px]">No se encontraron pedidos con el filtro seleccionado</p>
                </div>
            ) : (
                <div className={`grid gap-2.5 ${expandedOrderId ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                    {filteredOrders
                        .filter(order => !expandedOrderId || order.id === expandedOrderId)
                        .map(order => (
                            <WebOrderDetailCard 
                                key={order.id} 
                                order={order} 
                                employees={employees}
                                onUpdateStatus={updateOrderStatus}
                                onAssignMotorizado={assignMotorized}
                                isExpanded={expandedOrderId === order.id}
                                onToggle={() => handleToggleOrder(order.id)}
                            />
                        ))}
                </div>
            )}
            
            {/* Contador */}
            <div className="mt-3 text-center">
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded text-[10px] text-gray-600 border border-gray-300">
                    <span>Mostrando</span>
                    <span className="font-bold">
                        {expandedOrderId ? 1 : filteredOrders.length}
                    </span>
                    <span>pedido{expandedOrderId ? '' : filteredOrders.length !== 1 ? 's' : ''}</span>
                    {expandedOrderId && (
                        <button 
                            onClick={() => setExpandedOrderId(null)}
                            className="ml-1 text-blue-600 hover:text-blue-700 text-[10px] font-medium"
                        >
                            Ver todos
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
