// src/components/dashboard/Sidebar/NavigationContent.tsx - ACTUALIZADO CON INVENTARIO

import React from "react";
import { useAuth } from "../../../context/AuthContext";
import { SidebarLink } from "./SidebarLink";
import * as Icons from "./icons";

interface NavigationContentProps {
  isCollapsed: boolean;
  onLinkClick?: () => void;
}

export const NavigationContent: React.FC<NavigationContentProps> = ({
  isCollapsed,
  onLinkClick,
}) => {
  const { user } = useAuth();

  return (
    <>
      {/* Logo - Compacto */}
      <div
        className={`flex items-center shrink-0 border-b border-gray-200 transition-all ${
          isCollapsed ? "justify-center h-16 px-0" : "h-16 px-4"
        }`}
      >
        {isCollapsed ? (
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg shadow-lg">
            <span className="text-sm font-bold text-white">
              {user?.name?.charAt(0) || "R"}
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg shadow-lg">
              <span className="text-sm font-bold text-white">
                {user?.name?.charAt(0) || "R"}
              </span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {user?.tenantName || "RestoBar"}
              </h1>
              <p className="text-xs text-gray-500">Sistema</p>
            </div>
          </div>
        )}
      </div>

      {/* Navegación - Compacto */}
      <nav
        className={`mt-2 flex-1 flex flex-col ${
          isCollapsed ? "space-y-0 px-1" : "space-y-0 px-2"
        }`}
      >
        {/* Grupo 1: Operaciones en Tiempo Real */}
        <div>
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-3">
              Operaciones
            </h3>
          )}
          <div className="space-y-1">
            <SidebarLink
              to="/dashboard"
              icon={<Icons.HomeIcon />}
              label="Panel Principal"
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
            />
            <SidebarLink
              to="/dashboard/orders"
              icon={<Icons.ClipboardListIcon />}
              label="Pedidos"
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
            />
            <SidebarLink
              to="/dashboard/tables"
              icon={<Icons.TableIcon />}
              label="Mesas"
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
            />
            <SidebarLink
              to="/dashboard/reservas"
              icon={<Icons.CalendarIcon />}
              label="Reservas"
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
            />
          </div>
        </div>

        {/* Grupo 2: Gestión de Menú y Cocina */}
        <div className={`${isCollapsed ? "pt-0" : "pt-2"}`}>
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-3">
              Menú & Cocina
            </h3>
          )}
          <div className="space-y-0">
            <SidebarLink
              to="/dashboard/menu"
              icon={<Icons.UtensilsIcon />}
              label="Menú Principal"
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
            />
            <SidebarLink
              to="/dashboard/bebidas"
              icon={<Icons.WineIcon />}
              label="Bebidas & Bar"
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
            />
            <SidebarLink
              to="/dashboard/kitchen"
              icon={<Icons.ChefHatIcon />}
              label="Cocina"
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
            />
          </div>
        </div>

        {/* ✨ GRUPO 3: INVENTARIO DINÁMICO (NUEVO) ✨ */}
        <div className={`${isCollapsed ? "pt-0" : "pt-2"}`}>
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-3">
              Inventario
            </h3>
          )}
          <div className="space-y-1">
            <SidebarLink
              to="/dashboard/productos-inventario"
              icon={<Icons.PackageIcon />}
              label="Productos"
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
            />
            <SidebarLink
              to="/dashboard/compras"
              icon={<Icons.ShoppingCartIcon />}
              label="Compras & Gastos"
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
            />
            <SidebarLink
              to="/dashboard/categorias-inventario"
              icon={<Icons.TagIcon />}
              label="Categorías"
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
            />
            <SidebarLink
              to="/dashboard/tipos-gasto"
              icon={<Icons.DollarSignIcon />}
              label="Tipos de Gasto"
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
            />
            <SidebarLink
              to="/dashboard/unidades-medida"
              icon={<Icons.RulerIcon />}
              label="Unidades"
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
            />
            <SidebarLink
              to="/dashboard/cierre-inventario"
              icon={<Icons.ClipboardListIcon />}
              label="Inventario"
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
            />
          </div>
        </div>

        {/* Grupo 4: Gestión y Reportes */}
        <div className={`${isCollapsed ? "pt-0" : "pt-2"}`}>
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-3">
              Gestión
            </h3>
          )}
          <div className="space-y-1">
            <SidebarLink
              to="/dashboard/reports"
              icon={<Icons.ChartBarIcon />}
              label="Reportes"
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
            />
            <SidebarLink
              to="/dashboard/finances"
              icon={<Icons.DollarSignIcon />}
              label="Finanzas"
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
            />
            <SidebarLink
              to="/dashboard/team"
              icon={<Icons.UsersIcon />}
              label="Equipo"
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
            />
            <SidebarLink
              to="/dashboard/settings"
              icon={<Icons.SettingsIcon />}
              label="Configuración"
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
            />
          </div>
        </div>
      </nav>

      {/* Información del Usuario - Compacto */}
      {!isCollapsed && user && (
        <div className="p-2 mx-2 mt-auto mb-2 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
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
    </>
  );
};
