// src/pages/OrdersManagement.tsx
import React from 'react';
// --- ✨ 1. IMPORTAR TIPOS Y HOOKS NUEVOS ---
import { useOrdersManagement, type DateRangePreset } from '../hooks/useOrdersManagement';
import { type ApiOrden, type OrdenEstado } from '../types';
import { RefreshIcon } from '../components/icons'; // (Asegúrate de tener RefreshIcon)

// --- Componente de la Página de Pedidos ---
const OrdersManagementPage: React.FC = () => {
  // --- ✨ 2. OBTENER ESTADOS DEL FILTRO DE FECHA ---
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

  // 1. Manejo de estado de Carga
  if (isLoading && orders.length === 0) { // Solo mostrar spinner en la carga inicial
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-lg text-gray-600">Cargando pedidos...</p>
      </div>
    );
  }

  // 2. Manejo de estado de Error
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-xl mx-4" role="alert">
        <strong className="font-bold">¡Error!</strong>
        <span className="block sm:inline"> {error}</span>
        <button 
          onClick={reloadOrders} 
          className="ml-4 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // 3. Renderizado de la página
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabecera */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4 max-w-7xl mx-auto flex justify-between items-center">
          <div>
        	  <h1 className="text-2xl font-bold text-gray-900">Gestión de Pedidos</h1>
      	  <p className="text-gray-500 text-sm mt-1">Revisa y administra todos los pedidos.</p>
    	  </div>
        <button 
          onClick={reloadOrders} 
          disabled={isLoading}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
          title="Recargar pedidos"
        >
          <RefreshIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      </div>
      
      {/* --- ✨ 3. BARRA DE FILTROS DOBLE (ESTADO Y FECHA) --- */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
    	  <div className="px-6 pt-3 max-w-7xl mx-auto">
          {/* Filtros de Estado */}
    		  <FilterTabs>
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
  	 		  </FilterTabs>
        </div>
        <div className="px-6 pt-2 pb-3 max-w-7xl mx-auto flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-500">Ver:</span>
          {/* Filtros de Fecha */}
          <FilterTabs>
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
              label="Últ. 7 días"
              range="semana"
              filtroActual={filtroFecha}
              onClick={setFiltroFecha}
            />
            <FilterButtonDate 
              label="Últ. 30 días"
              range="mes"
              filtroActual={filtroFecha}
              onClick={setFiltroFecha}
            />
          </FilterTabs>
    	  </div>
  	  </div>

  	  {/* Contenido Principal: Lista de Pedidos */}
  	  <div className="px-4 py-6 max-w-7xl mx-auto">
  	 	<div className="space-y-6">
  	 	  {orders.length === 0 ? (
  	 		<div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
  	 		  <h3 className="text-xl font-medium text-gray-900">No hay pedidos</h3>
  	 		  <p className="text-gray-500 mt-2">
  	 			{filtroEstado 
  	 			  ? `No se encontraron pedidos con el estado "${filtroEstado}".`
  	 			  : "No se encontraron pedidos."
  	 			}
              {' '}
              {filtroFecha === 'hoy' && 'para hoy.'}
              {filtroFecha === 'ayer' && 'para ayer.'}
              {filtroFecha === 'semana' && 'en los últimos 7 días.'}
              {filtroFecha === 'mes' && 'en los últimos 30 días.'}
  	 		  </p>
  	 		</div>
  	 	  ) : (
  	 		<div className="bg-white rounded-2xl shadow-sm border border-gray-200 divide-y divide-gray-200">
  	 		  {orders.map(order => (
  	 			<OrderDetailCard key={order.id} order={order} />
  	 		  ))}
  	 		</div>
  	 	  )}
  	 	</div>
  	  </div>
  	</div>
  );
};

// --- ✨ 4. COMPONENTES REFACTORIZADOS ---

// Contenedor de Pestañas
const FilterTabs: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center space-x-2 border-b-2 border-transparent">{children}</div>
);

// Botón de Filtro de Estado
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
      className={`px-3 py-2 border-b-2 text-sm font-medium
        ${isActive 
          ? 'border-blue-600 text-blue-600' 
          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
        }
      `}
    >
      {label}
    </button>
  );
};

// Botón de Filtro de Fecha
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
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
        ${isActive 
          ? 'bg-gray-800 text-white' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }
      `}
    >
      {label}
    </button>
  );
};

// Tarjeta de Orden (sin cambios)
const OrderDetailCard: React.FC<{ order: ApiOrden }> = ({ order }) => {
  return (
  	<div className="p-4">
  	  <div className="flex justify-between items-center">
  	 	<h3 className="font-bold text-lg">
  	 	  Orden #{order.id} - 
  	 	  <span className="ml-2 font-medium text-blue-600">{order.mesas.nombre_o_numero}</span>
  	 	</h3>
  	 	<span className={`px-3 py-1 rounded-full text-sm font-medium ${
  	 	  order.estado === 'Abierta' ? 'bg-yellow-100 text-yellow-800' :
  	 	  order.estado === 'Pagada' ? 'bg-green-100 text-green-800' :
  	 	  order.estado === 'Cancelada' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
  	 	}`}>
  	 	  {order.estado}
  	 	</span>
  	  </div>
  	  <p className="text-sm text-gray-500 mt-1">
  	 	Tomada por: {order.empleados.nombre || order.empleados.email}
  	  </p>
  	  <ul className="mt-3 list-disc list-inside pl-2">
  	 	{order.ordendetalles.map(detalle => (
  	 	  <li key={detalle.id} className="text-gray-700">
  	 	 	{detalle.cantidad}x {detalle.productos.nombre}
  	 	  </li>
  	 	))}
  	  </ul>
  	  <p className="text-right font-bold text-lg mt-2">
  	 	Total: S/ {Number(order.total).toFixed(2)}
  	  </p>
  	</div>
  );
};

export default OrdersManagementPage;