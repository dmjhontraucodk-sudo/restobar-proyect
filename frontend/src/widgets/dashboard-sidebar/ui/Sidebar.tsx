// src/widgets/dashboard-sidebar/ui/Sidebar.tsx - CON CONFIGURACIÓN INTEGRADA

import React from "react";
import { NavigationContent } from "./NavigationContent";
import { SidebarLink } from "./SidebarLink";
import * as Icons from "./icons";
import { type User } from "@app/providers/AuthProvider";
import { useGlobalConfig } from "@shared/hooks/useGlobalConfig"; // ⭐ NUEVO
import { ALL_NAVIGATION_ITEMS, type NavigationItem } from '@shared/constants/navigation.constants'; // Import ALL_NAVIGATION_ITEMS

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
  const userPermissions = user.permissions || []; // Ensure it's an array
  const isAdmin = user.role === "Administrador";

  // Group navigation items by their 'group' property
  const groupedNavigationItems = ALL_NAVIGATION_ITEMS.reduce((acc: Record<string, NavigationItem[]>, item: NavigationItem) => {
    (acc[item.group] = acc[item.group] || []).push(item);
    return acc;
  }, {} as Record<string, NavigationItem[]>);

  const getIconForId = (id: string) => {
    switch (id) {
      case 'operaciones.panel_principal': return <Icons.HomeIcon />;
      case 'operaciones.pedidos': return <Icons.ClipboardListIcon />;
      case 'operaciones.pedidos_web': return <Icons.GlobeIcon />;
      case 'operaciones.mesas': return <Icons.TableIcon />;
      case 'operaciones.reservas': return <Icons.CalendarIcon />;
      
      case 'menu_cocina.menu_principal': return <Icons.UtensilsIcon />;
      case 'menu_cocina.bebidas_bar': return <Icons.WineIcon />;
      case 'menu_cocina.cocina': return <Icons.ChefHatIcon />;
      
      case 'inventario.gestion': return <Icons.PackageIcon />;
      case 'inventario.kardex': return <Icons.ClipboardListIcon />;
      case 'inventario.compras': return <Icons.ShoppingCartIcon />;
      case 'inventario.cierre': return <Icons.ClipboardCheckIcon />;
      case 'inventario.tipos_gasto': return <Icons.ListIcon />;
      
      case 'finanzas.caja': return <Icons.CurrencyDollarIcon />;
      case 'finanzas.nomina': return <Icons.UsersIcon />;
      case 'finanzas.gastos': return <Icons.TrendingDownIcon />;
      case 'finanzas.resumen': return <Icons.DollarSignIcon />;
      case 'finanzas.reportes': return <Icons.ChartBarIcon />;
      
      case 'gestion.equipo': return <Icons.UsersIcon />;
      case 'gestion.resenas': return <Icons.MessageSquareIcon />;
      case 'gestion.configuracion': return <Icons.CogIcon />;
      
      default: return <Icons.HomeIcon />;
    }
  };

  return (
    <nav className="mt-2 flex-1 flex flex-col space-y-1 px-2 pb-4">
      {Object.entries(groupedNavigationItems).map(([groupName, items]) => (
        <div key={groupName} className="pt-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-3">
            {groupName}
          </h3>
          <div className="space-y-1">
            {items
              .filter((item: NavigationItem) => isAdmin || userPermissions.includes(item.id))
              .map((item: NavigationItem) => (
                <SidebarLink
                  key={item.id}
                  to={item.path}
                  icon={getIconForId(item.id)}
                  label={item.label}
                  isCollapsed={false} // Flyout is never collapsed
                  onClick={onLinkClick}
                />
              ))}
          </div>
        </div>
      ))}
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
