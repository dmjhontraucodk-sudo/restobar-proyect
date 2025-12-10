export interface NavigationItem {
  id: string; // e.g., 'operaciones.panel_principal'
  label: string;
  group: string;
  path: string;
}

export const ALL_NAVIGATION_ITEMS: NavigationItem[] = [
  { id: 'operaciones.panel_principal', label: 'Panel Principal', group: 'Operaciones', path: '/dashboard' },
  { id: 'operaciones.pedidos', label: 'Pedidos', group: 'Operaciones', path: '/dashboard/orders' },
  { id: 'operaciones.pedidos_web', label: 'Pedidos Web', group: 'Operaciones', path: '/dashboard/web-orders' },
  { id: 'operaciones.mesas', label: 'Mesas', group: 'Operaciones', path: '/dashboard/tables' },
  { id: 'operaciones.reservas', label: 'Reservas', group: 'Operaciones', path: '/dashboard/reservas' },

  { id: 'menu_cocina.menu_principal', label: 'Menú Principal', group: 'Menú & Cocina', path: '/dashboard/menu' },
  { id: 'menu_cocina.bebidas_bar', label: 'Bebidas & Bar', group: 'Menú & Cocina', path: '/dashboard/bebidas' },
  { id: 'menu_cocina.cocina', label: 'Cocina', group: 'Menú & Cocina', path: '/dashboard/kitchen' },

  { id: 'inventario.gestion', label: 'Gestión de Inventario', group: 'Inventario', path: '/dashboard/inventario' },
  { id: 'inventario.kardex', label: 'Kardex Valorizado', group: 'Inventario', path: '/dashboard/kardex' },
  { id: 'inventario.compras', label: 'Compras', group: 'Inventario', path: '/dashboard/compras' },
  { id: 'inventario.cierre', label: 'Cierre Inventario', group: 'Inventario', path: '/dashboard/cierre-inventario' },
  { id: 'inventario.tipos_gasto', label: 'Tipos de Gasto', group: 'Inventario', path: '/dashboard/tipos-gasto' },

  { id: 'finanzas.caja', label: 'Caja y Turnos', group: 'Finanzas', path: '/dashboard/caja' },
  { id: 'finanzas.nomina', label: 'Pago de Nómina', group: 'Finanzas', path: '/dashboard/nomina' },
  { id: 'finanzas.gastos', label: 'Gastos Operativos', group: 'Finanzas', path: '/dashboard/gastos' },
  { id: 'finanzas.resumen', label: 'Resumen Financiero', group: 'Finanzas', path: '/dashboard/finances' },
  { id: 'finanzas.reportes', label: 'Reportes', group: 'Finanzas', path: '/dashboard/reports' },

  { id: 'gestion.equipo', label: 'Equipo', group: 'Gestión', path: '/dashboard/team' },
  { id: 'gestion.resenas', label: 'Reseñas', group: 'Gestión', path: '/dashboard/reviews' },
  { id: 'gestion.configuracion', label: 'Configuración', group: 'Gestión', path: '/dashboard/configuration' },
];

export const getNavigationMap = () => {
    const map = new Map<string, NavigationItem>();
    for (const item of ALL_NAVIGATION_ITEMS) {
        map.set(item.id, item);
    }
    return map;
}
