// src/widgets/dashboard-sidebar/ui/NavigationContent.tsx - REFACTORIZADO CON PERMISOS DINÁMICOS

import React from "react";
import { useAuth } from "@app/providers/AuthProvider";
import { SidebarLink } from "./SidebarLink";
import * as Icons from "./icons";
import { useGlobalConfig } from "@shared/hooks/useGlobalConfig";
 
interface NavigationContentProps {
  isCollapsed: boolean;
  onLinkClick?: () => void;
}

export const NavigationContent: React.FC<NavigationContentProps> = ({
  isCollapsed,
  onLinkClick,
}) => {
  const { user } = useAuth();
  const { nombreNegocio, logoUrl } = useGlobalConfig();

  // Helper para verificar permisos
  const can = (permissionId: string): boolean => {
    if (!user) return false;
    // El Administrador siempre tiene acceso total
    if (user.role === 'Administrador') return true;
    // Verificar si el permiso está en el array de permisos del usuario
    return user.permissions?.includes(permissionId) ?? false;
  };

  // Visibilidad de los grupos de navegación basada en si algún hijo es visible
  const showOperacionesGroup = can('operaciones.panel_principal') || can('operaciones.pedidos') || can('operaciones.pedidos_web') || can('operaciones.mesas') || can('operaciones.reservas');
  const showMenuCocinaGroup = can('menu_cocina.menu_principal') || can('menu_cocina.bebidas_bar') || can('menu_cocina.cocina');
  const showInventarioGroup = can('inventario.gestion') || can('inventario.kardex') || can('inventario.compras') || can('inventario.cierre') || can('inventario.tipos_gasto');
  const showFinanzasGroup = can('finanzas.caja') || can('finanzas.nomina') || can('finanzas.gastos') || can('finanzas.resumen') || can('finanzas.reportes');
  const showGestionGroup = can('gestion.equipo') || can('gestion.resenas') || can('gestion.configuracion');

  return (
    <>
      {/* Logo */}
      <div
        className={`flex items-center shrink-0 border-b border-gray-200 transition-all ${
          isCollapsed ? "justify-center h-16 px-0" : "h-16 px-4"
        }`}
      >
        {isCollapsed ? (
          logoUrl ? <img src={logoUrl} alt={nombreNegocio} className="w-8 h-8 rounded-lg object-cover shadow-lg" />
          : <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg shadow-lg"><span className="text-sm font-bold text-white">{nombreNegocio.charAt(0)}</span></div>
        ) : (
          <div className="flex items-center space-x-2">
            {logoUrl ? <img src={logoUrl} alt={nombreNegocio} className="w-8 h-8 rounded-lg object-cover shadow-lg" />
            : <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg shadow-lg"><span className="text-sm font-bold text-white">{nombreNegocio.charAt(0)}</span></div>}
            <div>
              <h1 className="text-lg font-bold text-gray-900">{nombreNegocio}</h1>
              <p className="text-xs text-gray-500">Sistema</p>
            </div>
          </div>
        )}
      </div>

      {/* Navegación */}
      <nav
        className={`mt-2 flex-1 flex flex-col ${
          isCollapsed ? "space-y-0 px-1" : "space-y-1 px-2"
        }`}
      >
        {/* Grupo 1: Operaciones */}
        {showOperacionesGroup && (
          <div>
            {!isCollapsed && <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-3">Operaciones</h3>}
            <div className="space-y-1">
              {can('operaciones.panel_principal') && <SidebarLink to="/dashboard" icon={<Icons.HomeIcon />} label="Panel Principal" isCollapsed={isCollapsed} onClick={onLinkClick} />}
              {can('operaciones.pedidos') && <SidebarLink to="/dashboard/orders" icon={<Icons.ClipboardListIcon />} label="Pedidos" isCollapsed={isCollapsed} onClick={onLinkClick} />}
              {can('operaciones.pedidos_web') && <SidebarLink to="/dashboard/web-orders" icon={<Icons.GlobeIcon />} label="Pedidos Web" isCollapsed={isCollapsed} onClick={onLinkClick} />}
              {can('operaciones.mesas') && <SidebarLink to="/dashboard/tables" icon={<Icons.TableIcon />} label="Mesas" isCollapsed={isCollapsed} onClick={onLinkClick} />}
              {can('operaciones.reservas') && <SidebarLink to="/dashboard/reservas" icon={<Icons.CalendarIcon />} label="Reservas" isCollapsed={isCollapsed} onClick={onLinkClick} />}
            </div>
          </div>
        )}

        {/* Grupo 2: Menú & Cocina */}
        {showMenuCocinaGroup && (
          <div className={`${isCollapsed ? "pt-0" : "pt-2"}`}>
            {!isCollapsed && <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-3">Menú & Cocina</h3>}
            <div className="space-y-1">
              {can('menu_cocina.menu_principal') && <SidebarLink to="/dashboard/menu" icon={<Icons.UtensilsIcon />} label="Menú Principal" isCollapsed={isCollapsed} onClick={onLinkClick} />}
              {can('menu_cocina.bebidas_bar') && <SidebarLink to="/dashboard/bebidas" icon={<Icons.WineIcon />} label="Bebidas & Bar" isCollapsed={isCollapsed} onClick={onLinkClick} />}
              {can('menu_cocina.cocina') && <SidebarLink to="/dashboard/kitchen" icon={<Icons.ChefHatIcon />} label="Cocina" isCollapsed={isCollapsed} onClick={onLinkClick} />}
            </div>
          </div>
        )}

        {/* Grupo 3: Inventario */}
        {showInventarioGroup && (
          <div className={`${isCollapsed ? "pt-0" : "pt-2"}`}>
            {!isCollapsed && <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-3">Inventario</h3>}
            <div className="space-y-1">
              {can('inventario.gestion') && <SidebarLink to="/dashboard/inventario" icon={<Icons.PackageIcon />} label="Gestión de Inventario" isCollapsed={isCollapsed} onClick={onLinkClick} />}
              {can('inventario.kardex') && <SidebarLink to="/dashboard/kardex" icon={<Icons.ClipboardListIcon />} label="Kardex Valorizado" isCollapsed={isCollapsed} onClick={onLinkClick} />}
              {can('inventario.compras') && <SidebarLink to="/dashboard/compras" icon={<Icons.ShoppingCartIcon />} label="Compras" isCollapsed={isCollapsed} onClick={onLinkClick} />}
              {can('inventario.cierre') && <SidebarLink to="/dashboard/cierre-inventario" icon={<Icons.ClipboardCheckIcon />} label="Cierre Inventario" isCollapsed={isCollapsed} onClick={onLinkClick} />}
              {can('inventario.tipos_gasto') && !isCollapsed && (
                <div className="ml-2 mt-2 pt-2 border-t border-gray-100">
                  <SidebarLink to="/dashboard/tipos-gasto" icon={<Icons.ListIcon />} label="Tipos de Gasto" isCollapsed={isCollapsed} onClick={onLinkClick} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Grupo 4: Finanzas */}
        {showFinanzasGroup && (
          <div className={`${isCollapsed ? "pt-0" : "pt-2"}`}>
            {!isCollapsed && <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-3">Finanzas</h3>}
            <div className="space-y-1">
              {can('finanzas.caja') && <SidebarLink to="/dashboard/caja" icon={<Icons.CurrencyDollarIcon />} label="Caja y Turnos" isCollapsed={isCollapsed} onClick={onLinkClick} />}
              {can('finanzas.nomina') && <SidebarLink to="/dashboard/nomina" icon={<Icons.UsersIcon />} label="Pago de Nómina" isCollapsed={isCollapsed} onClick={onLinkClick} />}
              {can('finanzas.gastos') && <SidebarLink to="/dashboard/gastos" icon={<Icons.TrendingDownIcon />} label="Gastos Operativos" isCollapsed={isCollapsed} onClick={onLinkClick} />}
              {can('finanzas.resumen') && <SidebarLink to="/dashboard/finances" icon={<Icons.DollarSignIcon />} label="Resumen Financiero" isCollapsed={isCollapsed} onClick={onLinkClick} />}
              {can('finanzas.reportes') && <SidebarLink to="/dashboard/reports" icon={<Icons.ChartBarIcon />} label="Reportes" isCollapsed={isCollapsed} onClick={onLinkClick} />}
            </div>
          </div>
        )}

        {/* Grupo 5: Gestión */}
        {showGestionGroup && (
          <div className={`${isCollapsed ? "pt-0" : "pt-2"}`}>
            {!isCollapsed && <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-3">Gestión</h3>}
            <div className="space-y-1">
              {can('gestion.equipo') && <SidebarLink to="/dashboard/team" icon={<Icons.UsersIcon />} label="Equipo" isCollapsed={isCollapsed} onClick={onLinkClick} />}
              {can('gestion.resenas') && <SidebarLink to="/dashboard/reviews" icon={<Icons.MessageSquareIcon />} label="Reseñas" isCollapsed={isCollapsed} onClick={onLinkClick} />}
              {can('gestion.configuracion') && <SidebarLink to="/dashboard/configuration" icon={<Icons.CogIcon />} label="Configuración" isCollapsed={isCollapsed} onClick={onLinkClick} />}
            </div>
          </div>
        )}
      </nav>

      {/* Información del Usuario */}
      {!isCollapsed && user && (
        <div className="p-2 mx-2 mt-auto mb-2 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
          <div className="text-center">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-1 shadow-lg">
              <span className="text-white font-bold text-xs">{user.name?.charAt(0) || "U"}</span>
            </div>
            <h4 className="font-semibold text-gray-900 text-xs">{user.name}</h4>
            <p className="text-xs text-gray-600">{user.role}</p>
          </div>
        </div>
      )}
    </>
  );
};
