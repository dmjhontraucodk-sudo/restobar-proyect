// frontend/src/pages/WebOrdersManagement.tsx

import React, { useCallback, useState, useMemo } from 'react';
import toast from 'react-hot-toast';

// Importamos el hook
import { useWebReadyOrders } from '../hooks/useWebReadyOrders'; 
import { 
    RefreshIcon, 
    GlobeIcon, 
    TruckIcon, 
    CheckIcon, 
    ClockIcon, 
    XIcon, 
    UserIcon,
    MapPinIcon,
    PrinterIcon,
    SearchIcon
} from '../components/icons'; 

// Importamos los tipos y constantes
import { 
    type ApiWebPedido, 
    type webpedidos_estado, 
    type webpedidos_tipo,
    WEBPEDIDOS_ESTADO,
    WEBPEDIDOS_TIPO
} from '../types'; 

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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* Búsqueda */}
                <div className="flex-1 w-full lg:max-w-md">
                    <div className="relative">
                        <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente, teléfono o #pedido..."
                            value={filters.search}
                            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                    </div>
                </div>

                {/* Contador y Filtros */}
                <div className="flex flex-wrap gap-3 items-center">
                    <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                        {orderCount} pedido{orderCount !== 1 ? 's' : ''}
                    </span>
                    
                    {/* Filtro por Estado */}
                    <select
                        value={filters.estado}
                        onChange={(e) => onFiltersChange({ ...filters, estado: e.target.value as webpedidos_estado | 'all' })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                        <option value="all">Todos los estados</option>
                        <option value={WEBPEDIDOS_ESTADO.ListoParaRecoger}>Listo para recoger</option>
                        <option value={WEBPEDIDOS_ESTADO.EnCamino}>En camino</option>
                        <option value={WEBPEDIDOS_ESTADO.EnPreparacion}>En preparación</option>
                    </select>

                    {/* Filtro por Tipo */}
                    <select
                        value={filters.tipo}
                        onChange={(e) => onFiltersChange({ ...filters, tipo: e.target.value as webpedidos_tipo | 'all' })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                        <option value="all">Todos los tipos</option>
                        <option value={WEBPEDIDOS_TIPO.RecogerEnTienda}>Recojo en tienda</option>
                        <option value={WEBPEDIDOS_TIPO.EntregaDomicilio}>Delivery</option>
                    </select>

                    {/* Ordenamiento */}
                    <select
                        value={`${filters.sortBy}-${filters.sortOrder}`}
                        onChange={(e) => {
                            const [sortBy, sortOrder] = e.target.value.split('-') as ['fecha' | 'total' | 'prioridad', 'asc' | 'desc'];
                            onFiltersChange({ ...filters, sortBy, sortOrder });
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                        <option value="prioridad-desc">Prioridad alta</option>
                        <option value="fecha-asc">Más antiguos</option>
                        <option value="fecha-desc">Más recientes</option>
                        <option value="total-desc">Mayor monto</option>
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
}> = ({ order, onUpdateStatus, onSelect, isSelected }) => {
    const isDelivery = order.tipo_pedido === WEBPEDIDOS_TIPO.EntregaDomicilio;
    const isWaitingPayment = isDelivery && order.estado === WEBPEDIDOS_ESTADO.EnCamino;

    const statusConfig = {
        [WEBPEDIDOS_ESTADO.ListoParaRecoger]: { color: 'bg-orange-100 text-orange-800', badge: '📦' },
        [WEBPEDIDOS_ESTADO.EnCamino]: { color: 'bg-blue-100 text-blue-800', badge: '🚚' },
        [WEBPEDIDOS_ESTADO.Entregado]: { color: 'bg-green-100 text-green-800', badge: '✅' },
        [WEBPEDIDOS_ESTADO.Cancelado]: { color: 'bg-red-100 text-red-800', badge: '❌' },
        [WEBPEDIDOS_ESTADO.EnPreparacion]: { color: 'bg-amber-100 text-amber-800', badge: '⏱️' },
    };

    const status = statusConfig[order.estado] || { color: 'bg-gray-100 text-gray-800', badge: '❓' };

    const getPriorityScore = (order: ApiWebPedido): number => {
        let score = 0;
        
        // Pedidos En Camino tienen máxima prioridad (esperando pago)
        if (order.estado === WEBPEDIDOS_ESTADO.EnCamino) score += 100;
        
        // Pedidos listos para recoger
        if (order.estado === WEBPEDIDOS_ESTADO.ListoParaRecoger) score += 50;
        
        // Delivery tiene prioridad sobre recogida en tienda
        if (order.tipo_pedido === WEBPEDIDOS_TIPO.EntregaDomicilio) score += 20;
        
        // Pedidos más antiguos tienen más prioridad
        const ageInMinutes = (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60);
        score += Math.min(ageInMinutes / 10, 30); // Máximo 30 puntos por antigüedad
        
        return score;
    };

    const priorityScore = getPriorityScore(order);

    return (
        <div 
            className={`bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
                isSelected 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : isWaitingPayment 
                        ? 'border-amber-400' 
                        : 'border-gray-200'
            }`}
            onClick={() => onSelect(order)}
        >
            <div className="p-3">
                {/* Header compacto */}
                <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                {status.badge} {order.estado}
                            </span>
                            {priorityScore > 70 && (
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                    🔥 Alta Prioridad
                                </span>
                            )}
                        </div>
                        <h4 className="font-semibold text-gray-900 truncate">
                            #{order.numero_pedido}
                        </h4>
                        <p className="text-sm text-gray-600 truncate">{order.cliente_nombre}</p>
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
                    <span>{isDelivery ? '🚚 Delivery' : '🏪 Tienda'}</span>
                    <span>{order.webpedidos_detalles.length} ítems</span>
                </div>

                {/* Acción rápida */}
                {order.estado === WEBPEDIDOS_ESTADO.ListoParaRecoger && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStatus(
                                order.id, 
                                isDelivery ? WEBPEDIDOS_ESTADO.EnCamino : WEBPEDIDOS_ESTADO.Entregado
                            );
                        }}
                        className="w-full py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                    >
                        {isDelivery ? 'Despachar' : 'Entregar'}
                    </button>
                )}
                
                {order.estado === WEBPEDIDOS_ESTADO.EnCamino && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStatus(order.id, WEBPEDIDOS_ESTADO.Entregado);
                        }}
                        className="w-full py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors animate-pulse"
                    >
                        Confirmar Cobro
                    </button>
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
    
    // Detectar si estamos en la fase de espera de dinero (Delivery En Camino)
    const isWaitingPayment = isDelivery && order.estado === WEBPEDIDOS_ESTADO.EnCamino;

    const statusConfig = {
        [WEBPEDIDOS_ESTADO.ListoParaRecoger]: { color: 'bg-orange-100 text-orange-800 border-orange-300', icon: '📦' },
        [WEBPEDIDOS_ESTADO.EnCamino]: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: <TruckIcon className="w-4 h-4 inline" /> },
        [WEBPEDIDOS_ESTADO.Entregado]: { color: 'bg-green-100 text-green-800 border-green-300', icon: <CheckIcon className="w-4 h-4 inline" /> },
        [WEBPEDIDOS_ESTADO.Cancelado]: { color: 'bg-red-100 text-red-800 border-red-300', icon: <XIcon className="w-4 h-4 inline" /> },
        [WEBPEDIDOS_ESTADO.EnPreparacion]: { color: 'bg-amber-100 text-amber-800 border-amber-300', icon: <ClockIcon className="w-4 h-4 inline" /> },
    };
    
    const status = statusConfig[order.estado] || { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: '❓' };

    const tipoConfig = {
        [WEBPEDIDOS_TIPO.RecogerEnTienda]: { icon: <GlobeIcon className="w-4 h-4 inline" />, label: 'Recojo en Tienda' },
        [WEBPEDIDOS_TIPO.EntregaDomicilio]: { icon: <TruckIcon className="w-4 h-4 inline" />, label: 'A Domicilio' },
    };

    const handleAction = (newStatus: webpedidos_estado) => {
        if (order.estado === WEBPEDIDOS_ESTADO.Entregado || order.estado === WEBPEDIDOS_ESTADO.Cancelado) {
            toast.error("El pedido ya está finalizado.");
            return;
        }
        onUpdateStatus(order.id, newStatus);
    };

    // IMPRIMIR TICKET DE DESPACHO
    const handlePrintDeliveryTicket = () => {
        const printWindow = window.open('', '', 'height=600,width=400');
        if (!printWindow) return;

        const styles = `
            <style>
                body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; margin: 0; }
                .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
                .title { font-size: 16px; font-weight: bold; }
                .subtitle { font-size: 12px; }
                .section { margin-bottom: 10px; }
                .label { font-weight: bold; }
                .address { font-size: 14px; font-weight: bold; border: 2px solid #000; padding: 5px; margin: 5px 0; text-align: center; }
                .items-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
                .items-table th { text-align: left; border-bottom: 1px solid #000; }
                .items-table td { padding: 2px 0; }
                .total { font-size: 16px; font-weight: bold; text-align: right; margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; }
                .footer { text-align: center; margin-top: 20px; font-size: 10px; }
                .payment-status { text-align: center; font-weight: bold; font-size: 14px; margin-top: 10px; background: #000; color: #fff; padding: 2px; }
            </style>
        `;

        const itemsHtml = order.webpedidos_detalles.map(item => `
            <tr>
                <td>${item.cantidad}x ${item.productos.nombre}</td>
                <td style="text-align:right">S/ ${Number(item.subtotal).toFixed(2)}</td>
            </tr>
        `).join('');

        const content = `
            <html>
            <head><title>Ticket Delivery</title>${styles}</head>
            <body>
                <div class="header">
                    <div class="title">TICKET DE ENTREGA</div>
                    <div class="subtitle">Pedido Web #${order.numero_pedido}</div>
                    <div>${new Date().toLocaleString('es-PE')}</div>
                </div>

                <div class="section">
                    <div><span class="label">Cliente:</span> ${order.cliente_nombre}</div>
                    <div><span class="label">Teléfono:</span> ${order.cliente_telefono}</div>
                </div>

                ${isDelivery && order.direccion_entrega ? `
                    <div class="section">
                        <div class="label">DIRECCIÓN DE ENTREGA:</div>
                        <div class="address">${order.direccion_entrega}</div>
                        ${order.instrucciones_entrega ? `<div>Nota: ${order.instrucciones_entrega}</div>` : ''}
                    </div>
                ` : ''}

                <table class="items-table">
                    <thead><tr><th>Cant. Producto</th><th style="text-align:right">Total</th></tr></thead>
                    <tbody>${itemsHtml}</tbody>
                </table>

                <div class="total">
                    TOTAL A COBRAR: S/ ${Number(order.total).toFixed(2)}
                </div>

                <div class="payment-status">
                    PAGO PENDIENTE CONTRA ENTREGA
                </div>

                <div class="footer">
                    *** GUÍA DE DESPACHO ***<br/>
                    Entregar y confirmar cobro.
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(content);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    return (
        <div className={`bg-white rounded-2xl shadow-lg border overflow-hidden transition-all duration-300 hover:shadow-2xl ${isWaitingPayment ? 'border-amber-400 ring-1 ring-amber-200' : 'border-gray-100'}`}>
            
            {/* Header con Info Rápida */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                        <div className="flex items-center space-x-2 text-sm font-medium text-gray-500">
                            <span className="text-blue-600 font-semibold flex items-center gap-1">
                                {tipoConfig[order.tipo_pedido].icon} {tipoConfig[order.tipo_pedido].label}
                            </span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-xl mt-1">
                            #{order.numero_pedido}
                        </h3>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                        <span className={`px-3 py-1.5 rounded-full text-sm font-medium border flex items-center space-x-1 ${status.color}`}>
                            {status.icon}
                            <span>{order.estado}</span>
                        </span>
                        <span className="text-xl font-bold text-green-600">S/ {Number(order.total).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Detalles */}
            <div className="p-6">
                {/* 💡 ALERTA VISUAL PARA DELIVERY EN CAMINO */}
                {isWaitingPayment && (
                    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 animate-pulse">
                        <div className="bg-amber-100 p-2 rounded-full">
                            <ClockIcon className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="font-bold text-amber-800 text-sm">ESPERANDO CONFIRMACIÓN DE PAGO</p>
                            <p className="text-xs text-amber-700">El repartidor debe confirmar el cobro.</p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-3 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <UserIcon className="w-4 h-4 text-gray-500" />
                            <p className="text-sm font-semibold text-gray-800">{order.cliente_nombre}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-semibold text-gray-500 uppercase">Teléfono</p>
                            <p className="text-sm text-gray-700">{order.cliente_telefono}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                        <div className="flex items-center space-x-2">
                            <ClockIcon className="w-4 h-4 text-gray-500" />
                            <p className="text-sm font-semibold text-gray-800">Hora</p>
                        </div>
                        <p className="text-sm text-gray-700">
                            {new Date(order.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>

                {isDelivery && order.direccion_entrega && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-xl flex items-start gap-3">
                        <MapPinIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-xs font-semibold text-red-700 uppercase mb-0.5">Dirección de Entrega</p>
                            <p className="text-sm text-red-900 font-medium">{order.direccion_entrega}</p>
                        </div>
                    </div>
                )}
                
                {/* Lista de Productos */}
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Ítems ({order.webpedidos_detalles.length})</p>
                        <button 
                            onClick={handlePrintDeliveryTicket}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1 transition-colors"
                            title="Imprimir Guía"
                        >
                            <PrinterIcon className="w-4 h-4" />
                            Re-imprimir Guía
                        </button>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto pr-2 text-sm border border-dashed border-gray-200 p-2 rounded-lg bg-gray-50">
                        {order.webpedidos_detalles.map(detalle => (
                            <div key={detalle.id} className="flex justify-between items-center text-gray-700">
                                <span className="font-medium">{detalle.cantidad}x {detalle.productos.nombre}</span>
                                <span>S/ {Number(detalle.subtotal).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Acciones de Gestión */}
                <div className="pt-4 border-t border-gray-200 space-y-3">
                    
                    {/* ============ FLUJO DELIVERY ============ */}
                    {/* PASO 1: Despachar (Solo si es delivery y está listo) */}
                    {isDelivery && order.estado === WEBPEDIDOS_ESTADO.ListoParaRecoger && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    handleAction(WEBPEDIDOS_ESTADO.EnCamino);
                                    handlePrintDeliveryTicket(); 
                                }}
                                className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-lg"
                            >
                                <TruckIcon className="w-5 h-5 mr-2" />
                                Despachar e Imprimir
                            </button>
                        </div>
                    )}

                    {/* PASO 2: Confirmar Pago (Solo si está En Camino) */}
                    {isDelivery && order.estado === WEBPEDIDOS_ESTADO.EnCamino && (
                        <button
                            onClick={() => handleAction(WEBPEDIDOS_ESTADO.Entregado)}
                            className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 font-semibold shadow-lg animate-pulse hover:animate-none"
                        >
                            <CheckIcon className="w-5 h-5 mr-2" />
                            Confirmar Entrega y Cobro
                        </button>
                    )}
                    
                    {/* ============ FLUJO LOCAL ============ */}
                    {/* DIRECTO: Finalizar y Cobrar (Solo si es Local y está Listo) */}
                    {!isDelivery && order.estado === WEBPEDIDOS_ESTADO.ListoParaRecoger && (
                        <button
                            onClick={() => handleAction(WEBPEDIDOS_ESTADO.Entregado)}
                            className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 font-semibold shadow-lg"
                        >
                            <CheckIcon className="w-5 h-5 mr-2" />
                            Finalizar y Cobrar
                        </button>
                    )}

                    {/* ============ CANCELACIÓN ============ */}
                    {(order.estado === WEBPEDIDOS_ESTADO.ListoParaRecoger || order.estado === WEBPEDIDOS_ESTADO.EnCamino) && (
                        <button
                            onClick={() => handleAction(WEBPEDIDOS_ESTADO.Cancelado)}
                            className="w-full text-sm text-red-500 hover:text-red-700 transition-colors py-2 flex items-center justify-center gap-1"
                        >
                            <XIcon className="w-4 h-4 inline mr-1" />
                            {isWaitingPayment ? 'Cliente No Pagó / Cancelar' : 'Cancelar Pedido'}
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
    const [viewMode, setViewMode] = useState<'grid' | 'compact'>('compact');

    // Filtrar y ordenar pedidos
    const filteredAndSortedOrders = useMemo(() => {
        let filtered = orders.filter(order => {
            // Filtro de búsqueda
            const searchLower = filters.search.toLowerCase();
            const matchesSearch = 
                order.numero_pedido.toLowerCase().includes(searchLower) ||
                order.cliente_nombre.toLowerCase().includes(searchLower) ||
                order.cliente_telefono.includes(searchLower);
            
            // Filtro por estado
            const matchesEstado = filters.estado === 'all' || order.estado === filters.estado;
            
            // Filtro por tipo
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
            {/* Cabecera Mejorada */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-30">
                <div className="px-6 py-4 max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 rounded-xl">
                                    <GlobeIcon className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Pedidos Web</h1>
                                    <p className="text-gray-600 text-sm">
                                        {filteredAndSortedOrders.length} de {orders.length} pedidos activos
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                            {/* Selector de Vista */}
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('compact')}
                                    className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                                        viewMode === 'compact' 
                                            ? 'bg-white shadow-sm text-blue-600' 
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Compacta
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                                        viewMode === 'grid' 
                                            ? 'bg-white shadow-sm text-blue-600' 
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Detallada
                                </button>
                            </div>

                            <button 
                                onClick={reloadOrders} 
                                disabled={isLoading}
                                className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 hover:border-blue-200"
                                title="Recargar pedidos"
                            >
                                <RefreshIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Contenido Principal */}
            <div className="px-4 py-6 max-w-7xl mx-auto">
                {/* Filtros */}
                <OrderFilters 
                    filters={filters}
                    onFiltersChange={setFilters}
                    orderCount={filteredAndSortedOrders.length}
                />

                {isLoading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">Cargando pedidos...</p>
                    </div>
                )}

                {error && (
                    <div className="text-center py-8 bg-red-50 rounded-xl border border-red-200">
                        <p className="text-red-600 font-medium">Error al cargar pedidos</p>
                        <p className="text-red-500 text-sm mt-1">{error}</p>
                        <button 
                            onClick={reloadOrders}
                            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                            Reintentar
                        </button>
                    </div>
                )}
                
                {!isLoading && !error && filteredAndSortedOrders.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                        <TruckIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No hay pedidos que coincidan</h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                            {filters.search || filters.estado !== 'all' || filters.tipo !== 'all' 
                                ? 'Prueba ajustando los filtros de búsqueda.'
                                : 'No hay pedidos pendientes de entrega o recogida en este momento.'
                            }
                        </p>
                    </div>
                )}

                {/* Vista Principal */}
                {!isLoading && !error && filteredAndSortedOrders.length > 0 && (
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Panel de Lista (Siempre visible) */}
                        <div className={`${selectedOrder ? 'lg:w-2/5 xl:w-1/3' : 'w-full'}`}>
                            {/* Vista Agrupada para muchos pedidos */}
                            {viewMode === 'compact' && (
                                <div className="space-y-6">
                                    {/* En Camino (Máxima prioridad) */}
                                    {groupedOrders[WEBPEDIDOS_ESTADO.EnCamino].length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                                                En Camino - Esperando Pago ({groupedOrders[WEBPEDIDOS_ESTADO.EnCamino].length})
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                                                {groupedOrders[WEBPEDIDOS_ESTADO.EnCamino].map(order => (
                                                    <CompactOrderCard
                                                        key={order.id}
                                                        order={order}
                                                        onUpdateStatus={handleUpdateStatus}
                                                        onSelect={setSelectedOrder}
                                                        isSelected={selectedOrder?.id === order.id}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Listos para Recoger */}
                                    {groupedOrders[WEBPEDIDOS_ESTADO.ListoParaRecoger].length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-3">
                                                Listos para Recoger/Entregar ({groupedOrders[WEBPEDIDOS_ESTADO.ListoParaRecoger].length})
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                                                {groupedOrders[WEBPEDIDOS_ESTADO.ListoParaRecoger].map(order => (
                                                    <CompactOrderCard
                                                        key={order.id}
                                                        order={order}
                                                        onUpdateStatus={handleUpdateStatus}
                                                        onSelect={setSelectedOrder}
                                                        isSelected={selectedOrder?.id === order.id}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* En Preparación */}
                                    {groupedOrders[WEBPEDIDOS_ESTADO.EnPreparacion].length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-3 text-gray-500">
                                                En Preparación ({groupedOrders[WEBPEDIDOS_ESTADO.EnPreparacion].length})
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                                                {groupedOrders[WEBPEDIDOS_ESTADO.EnPreparacion].map(order => (
                                                    <CompactOrderCard
                                                        key={order.id}
                                                        order={order}
                                                        onUpdateStatus={handleUpdateStatus}
                                                        onSelect={setSelectedOrder}
                                                        isSelected={selectedOrder?.id === order.id}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Otros estados */}
                                    {groupedOrders.otros.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-3 text-gray-500">
                                                Otros ({groupedOrders.otros.length})
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                                                {groupedOrders.otros.map(order => (
                                                    <CompactOrderCard
                                                        key={order.id}
                                                        order={order}
                                                        onUpdateStatus={handleUpdateStatus}
                                                        onSelect={setSelectedOrder}
                                                        isSelected={selectedOrder?.id === order.id}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Vista Grid tradicional */}
                            {viewMode === 'grid' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filteredAndSortedOrders.map(order => (
                                        <WebOrderDetailCard 
                                            key={order.id} 
                                            order={order} 
                                            onUpdateStatus={handleUpdateStatus} 
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Panel de Detalle (Condicional) */}
                        {selectedOrder && (
                            <div className="hidden lg:block flex-1 sticky top-24 self-start">
                                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                                    <div className="flex justify-between items-center p-4 border-b border-gray-200">
                                        <h3 className="font-bold text-lg">Detalle del Pedido</h3>
                                        <button
                                            onClick={() => setSelectedOrder(null)}
                                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <XIcon className="w-5 h-5 text-gray-500" />
                                        </button>
                                    </div>
                                    <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
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