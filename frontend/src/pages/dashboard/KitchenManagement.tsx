import React, { useState } from 'react';
import { useKitchenManagement, type KitchenOrder } from '@features/kitchen/model/useKitchenManagement';
import { type webpedidos_estado, WEBPEDIDOS_ESTADO } from '@shared/types';
import { RefreshIcon, ClockIcon, ChefHatIcon, CheckCircleIcon } from '@shared/ui/Icons';
import toast from 'react-hot-toast';

// ─── helpers ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  [WEBPEDIDOS_ESTADO.Pendiente]: {
    label: 'Nuevo',
    border: 'border-amber-400',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-400',
  },
  [WEBPEDIDOS_ESTADO.Confirmado]: {
    label: 'Confirmado',
    border: 'border-sky-400',
    badge: 'bg-sky-100 text-sky-700',
    dot: 'bg-sky-400',
  },
  [WEBPEDIDOS_ESTADO.EnPreparacion]: {
    label: 'Preparando',
    border: 'border-blue-500',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
  },
  [WEBPEDIDOS_ESTADO.ListoParaRecoger]: {
    label: 'Listo',
    border: 'border-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
  },
} as Record<string, { label: string; border: string; badge: string; dot: string }>;

const getStatus = (estado: string) =>
  STATUS_CONFIG[estado] ?? { label: estado, border: 'border-gray-300', badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };

const getOrigin = (origen: string) => {
  if (origen === 'WEB') return { label: 'Web', color: 'bg-violet-100 text-violet-700' };
  if (origen.startsWith('MESA-')) {
    const n = origen.split('-')[1];
    return { label: `Mesa ${n}`, color: 'bg-blue-100 text-blue-700' };
  }
  return { label: origen, color: 'bg-gray-100 text-gray-600' };
};

const elapsed = (date: Date | string) => {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const isUrgent = (date: Date | string) =>
  (Date.now() - new Date(date).getTime()) / 60000 > 30;

// ─── ticket ─────────────────────────────────────────────────────────────────

const Ticket: React.FC<{
  order: KitchenOrder;
  updateStatus: (id: string, status: webpedidos_estado) => Promise<void>;
}> = ({ order, updateStatus }) => {
  const st = getStatus(order.estado);
  const origin = getOrigin(order.origen);
  const urgent = isUrgent(order.created_at);

  const act = async (newStatus: webpedidos_estado) => {
    await toast.promise(updateStatus(order.id, newStatus), {
      loading: 'Actualizando...',
      success: 'Estado actualizado',
      error: (e) => e.message ?? 'Error',
    });
  };

  return (
    <div
      className={`
        bg-white rounded-xl border-t-4 ${st.border} shadow-sm flex flex-col
        ${urgent ? 'ring-2 ring-red-400' : ''}
      `}
    >
      {/* ── cabecera ── */}
      <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-base font-bold text-gray-900 leading-none truncate">
            {order.numero_orden}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${origin.color}`}>
              {origin.label}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.badge}`}>
              {st.label}
            </span>
          </div>
        </div>

        <div className={`flex items-center gap-1 text-sm font-semibold shrink-0 ${urgent ? 'text-red-600' : 'text-gray-400'}`}>
          <ClockIcon className="w-3.5 h-3.5" />
          {elapsed(order.created_at)}
          {urgent && <span className="text-xs">🔥</span>}
        </div>
      </div>

      {/* ── items ── */}
      <div className="px-4 pb-3 flex-1 border-t border-gray-100 pt-2 space-y-1">
        {order.items.map((item, i) => (
          <div key={item.id_detalle ?? i} className="flex items-baseline gap-2">
            <span className="text-xs font-bold text-gray-500 w-4 text-right shrink-0">
              {item.cantidad}×
            </span>
            <span className="text-sm text-gray-800 leading-snug">{item.producto_nombre}</span>
            {item.notas && (
              <span className="ml-auto text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded shrink-0">
                nota
              </span>
            )}
          </div>
        ))}

        {order.notas_especiales && (
          <p className="mt-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
            {order.notas_especiales}
          </p>
        )}
      </div>

      {/* ── acción ── */}
      <div className="px-4 pb-4 pt-1">
        {(order.estado === WEBPEDIDOS_ESTADO.Pendiente ||
          order.estado === WEBPEDIDOS_ESTADO.Confirmado) && (
          <button
            onClick={() => act(WEBPEDIDOS_ESTADO.EnPreparacion)}
            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <ChefHatIcon className="w-4 h-4" />
            Iniciar preparación
          </button>
        )}

        {order.estado === WEBPEDIDOS_ESTADO.EnPreparacion && (
          <button
            onClick={() => act(WEBPEDIDOS_ESTADO.ListoParaRecoger)}
            className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <CheckCircleIcon className="w-4 h-4" />
            Marcar como listo
          </button>
        )}

        {order.estado === WEBPEDIDOS_ESTADO.ListoParaRecoger && (
          <div className="w-full py-2 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-semibold text-center border border-emerald-200">
            ✅ Listo para servir
          </div>
        )}
      </div>
    </div>
  );
};

// ─── página principal ────────────────────────────────────────────────────────

const KitchenManagementPage: React.FC = () => {
  const { orders, isLoading, error, reloadOrders, updateOrderStatus, isPolling, setIsPolling } =
    useKitchenManagement();

  const [search, setSearch] = useState('');

  const active = orders.filter(
    (o) =>
      o.estado === WEBPEDIDOS_ESTADO.Pendiente ||
      o.estado === WEBPEDIDOS_ESTADO.Confirmado ||
      o.estado === WEBPEDIDOS_ESTADO.EnPreparacion
  );

  const displayed = active.filter(
    (o) =>
      search === '' ||
      o.numero_orden.toLowerCase().includes(search.toLowerCase()) ||
      o.cliente_mesa_nombre.toLowerCase().includes(search.toLowerCase())
  );

  const countByStatus = (s: webpedidos_estado) => active.filter((o) => o.estado === s).length;

  React.useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-100">

      {/* ── barra superior ── */}
      <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <ChefHatIcon className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-lg text-gray-900 tracking-tight">Cocina</span>

          {/* contadores rápidos */}
          <div className="hidden sm:flex items-center gap-2 ml-2">
            <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
              {countByStatus(WEBPEDIDOS_ESTADO.Pendiente)} nuevos
            </span>
            <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
              {countByStatus(WEBPEDIDOS_ESTADO.EnPreparacion)} preparando
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* búsqueda */}
          <input
            type="text"
            placeholder="Buscar…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm bg-white text-gray-800 placeholder-gray-400 border border-gray-300 rounded-lg px-3 py-1.5 w-36 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* reload */}
          <button
            onClick={reloadOrders}
            disabled={isLoading}
            className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-40"
            title="Recargar"
          >
            <RefreshIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* live/paused */}
          <button
            onClick={() => setIsPolling((p) => !p)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              isPolling
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isPolling ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
            {isPolling ? 'En vivo' : 'Pausado'}
          </button>
        </div>
      </div>

      {/* ── contenido ── */}
      <div className="p-4">
        {isLoading && displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 bg-white rounded-xl shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
            <p className="text-sm text-gray-500">Cargando pedidos…</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-200">
            <ChefHatIcon className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">Sin pedidos activos</p>
            <p className="text-xs text-gray-400 mt-1">Los pedidos del POS y la Web aparecen aquí</p>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayed.map((order) => (
              <Ticket key={order.id} order={order} updateStatus={updateOrderStatus} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenManagementPage;
