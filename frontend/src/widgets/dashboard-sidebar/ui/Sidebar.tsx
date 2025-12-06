// src/widgets/dashboard-sidebar/ui/Sidebar.tsx - CON CONFIGURACIÓN INTEGRADA

import React from "react";
import { NavigationContent } from "./NavigationContent";
import { SidebarLink } from "./SidebarLink";
import * as Icons from "./icons";
import { type User } from "@app/providers/AuthProvider";
import { useGlobalConfig } from "@shared/hooks/useGlobalConfig"; // ⭐ NUEVO

interface SidebarProps {
  isCollapsed: boolean;
  showFlyout: boolean;
  sidebarWidthClass: string;
  onSidebarEnter: () => void;
  onSidebarLeave: (event: React.MouseEvent) => void;
  onFlyoutLeave: (event: React.MouseEvent) => void;
  onLinkClick?: () => void;
  user: User;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  showFlyout,
  sidebarWidthClass,
  onSidebarEnter,
  onSidebarLeave,
  onFlyoutLeave,
  onLinkClick,
  user,
}) => {
  const { nombreNegocio, logoUrl } = useGlobalConfig(); // ⭐ NUEVO

  return (
    <div
      className={`sidebar-container hidden md:flex flex-col bg-white border-r border-gray-200 shadow-xl transition-all duration-500 ease-in-out z-30 fixed inset-y-0 left-0 ${sidebarWidthClass}`}
      onMouseEnter={onSidebarEnter}
      onMouseLeave={onSidebarLeave}
    >
      <div className="flex flex-col grow pt-0 overflow-y-auto">
        <NavigationContent
          isCollapsed={isCollapsed}
          onLinkClick={onLinkClick}
        />
      </div>

      {/* Flyout */}
      <div
        className={`flyout-container absolute top-0 left-0 w-80 h-full bg-white border-r border-gray-200 shadow-2xl transition-all duration-500 ease-in-out pointer-events-auto ${
          showFlyout
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-4 pointer-events-none"
        }`}
        style={{ zIndex: 40 }}
        onMouseEnter={() => {
          /* mantener hover */
        }}
        onMouseLeave={onFlyoutLeave}
      >
        <div className="flex flex-col h-full overflow-hidden">
          <div className="shrink-0">
            <div className="flex items-center h-16 px-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                {/* ⭐ CAMBIO: Mostrar logo si existe, sino inicial */}
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={nombreNegocio}
                    className="w-8 h-8 rounded-lg object-cover shadow-lg"
                  />
                ) : (
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg shadow-lg">
                    <span className="text-sm font-bold text-white">
                      {nombreNegocio.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  {/* ⭐ CAMBIO: Usar nombre de configuración */}
                  <h1 className="text-lg font-bold text-gray-900">
                    {nombreNegocio}
                  </h1>
                  <p className="text-xs text-gray-500">Sistema</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <FlyoutNavigationContent onLinkClick={onLinkClick} user={user} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para el contenido del flyout
const FlyoutNavigationContent: React.FC<{
  onLinkClick?: () => void;
  user: User;
}> = ({ onLinkClick, user }) => {
  return (
    <nav className="mt-2 flex-1 flex flex-col space-y-1 px-2 pb-4">
      {/* Grupo 1: Operaciones en Tiempo Real */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-3">
          Operaciones
        </h3>
        <div className="space-y-1">
          <SidebarLink
            to="/dashboard"
            icon={<Icons.HomeIcon />}
            label="Panel Principal"
            isCollapsed={false}
            onClick={onLinkClick}
          />
          <SidebarLink
            to="/dashboard/orders"
            icon={<Icons.ClipboardListIcon />}
            label="Pedidos"
            isCollapsed={false}
            onClick={onLinkClick}
          />
          <SidebarLink
            to="/dashboard/web-orders"
            icon={<Icons.GlobeIcon />}
            label="Pedidos Web"
            isCollapsed={false}
            onClick={onLinkClick}
          />
          <SidebarLink
            to="/dashboard/tables"
            icon={<Icons.TableIcon />}
            label="Mesas"
            isCollapsed={false}
            onClick={onLinkClick}
          />
          <SidebarLink
            to="/dashboard/reservas"
            icon={<Icons.CalendarIcon />}
            label="Reservas"
            isCollapsed={false}
            onClick={onLinkClick}
          />
        </div>
      </div>

      {/* Grupo 2: Gestión de Menú y Cocina */}
      <div className="pt-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-3">
          Menú & Cocina
        </h3>
        <div className="space-y-1">
          <SidebarLink
            to="/dashboard/menu"
            icon={<Icons.UtensilsIcon />}
            label="Menú Principal"
            isCollapsed={false}
            onClick={onLinkClick}
          />
          <SidebarLink
            to="/dashboard/bebidas"
            icon={<Icons.WineIcon />}
            label="Bebidas & Bar"
            isCollapsed={false}
            onClick={onLinkClick}
          />
          <SidebarLink
            to="/dashboard/kitchen"
            icon={<Icons.ChefHatIcon />}
            label="Cocina"
            isCollapsed={false}
            onClick={onLinkClick}
          />
        </div>
      </div>

      {/* ✨ GRUPO 3: INVENTARIO (ACTUALIZADO) ✨ */}
      <div className="pt-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-3">
          Inventario
        </h3>
        <div className="space-y-1">
          <SidebarLink
            to="/dashboard/inventario"
            icon={<Icons.PackageIcon />}
            label="Gestión de Inventario"
            isCollapsed={false}
            onClick={onLinkClick}
          />
          <SidebarLink
            to="/dashboard/kardex"
            icon={<Icons.ClipboardListIcon />}
            label="Kardex Valorizado"
            isCollapsed={false}
            onClick={onLinkClick}
          />
          <SidebarLink
            to="/dashboard/compras"
            icon={<Icons.ShoppingCartIcon />}
            label="Compras"
            isCollapsed={false}
            onClick={onLinkClick}
          />
          <SidebarLink
            to="/dashboard/cierre-inventario"
            icon={<Icons.ClipboardCheckIcon />}
            label="Cierre Inventario"
            isCollapsed={false}
            onClick={onLinkClick}
          />

          {/* Solo dejamos Tipos de Gasto porque no está en los tabs */}
          <div className="ml-2 mt-2 pt-2 border-t border-gray-100">
            <SidebarLink
              to="/dashboard/tipos-gasto"
              icon={<Icons.ListIcon />}
              label="Tipos de Gasto"
              isCollapsed={false}
              onClick={onLinkClick}
            />
          </div>
        </div>
      </div>

      {/* ✨ GRUPO 4: FINANZAS ✨ */}
      <div className="pt-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-3">
          Finanzas
        </h3>
        <div className="space-y-1">
          <SidebarLink
            to="/dashboard/caja"
            icon={<Icons.CurrencyDollarIcon />}
            label="Caja y Turnos"
            isCollapsed={false}
            onClick={onLinkClick}
          />
          <SidebarLink
            to="/dashboard/nomina"
            icon={<Icons.UsersIcon />}
            label="Pago de Nómina"
            isCollapsed={false}
            onClick={onLinkClick}
          />
          <SidebarLink
            to="/dashboard/gastos"
            icon={<Icons.TrendingDownIcon />}
            label="Gastos Operativos"
            isCollapsed={false}
            onClick={onLinkClick}
          />
          <SidebarLink
            to="/dashboard/finances"
            icon={<Icons.DollarSignIcon />}
            label="Resumen Financiero"
            isCollapsed={false}
            onClick={onLinkClick}
          />
          <SidebarLink
            to="/dashboard/reports"
            icon={<Icons.ChartBarIcon />}
            label="Reportes"
            isCollapsed={false}
            onClick={onLinkClick}
          />
        </div>
      </div>

      {/* Grupo 5: Gestión */}
      <div className="pt-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-3">
          Gestión
        </h3>
        <div className="space-y-1">
          <SidebarLink
            to="/dashboard/team"
            icon={<Icons.UsersIcon />}
            label="Equipo"
            isCollapsed={false}
            onClick={onLinkClick}
          />
          <SidebarLink
            to="/dashboard/configuration"
            icon={<Icons.CogIcon />}
            label="Configuración"
            isCollapsed={false}
            onClick={onLinkClick}
          />
        </div>
      </div>

      {/* Información del Usuario en el Flyout */}
      {user && (
        <div className="p-2 mx-2 mt-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
          <div className="text-center">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-1 shadow-lg">
              <span className="text-white font-bold text-xs">
                {user.name?.charAt(0) || "U"}
              </span>
            </div>
            <h4 className="font-semibold text-gray-900 text-xs">{user.name}</h4>
            <p className="text-xs text-gray-600">{user.role}</p>
          </div>
        </div>
      )}
    </nav>
  );
};
