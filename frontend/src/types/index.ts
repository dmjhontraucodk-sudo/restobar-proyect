// src/types/index.ts
export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  foto_url?: string;
  disponible: boolean;
  visible_en_web: boolean;
  es_vegetariano: boolean;
  es_vegano: boolean;
  sin_gluten: boolean;
  es_picante: boolean;
  es_recomendado: boolean;
  es_nuevo: boolean;
  categoria_id: number;
}

export interface CategoriaMenu {
  id: number;
  nombre: string;
  descripcion?: string;
  productos: Producto[];
}

export interface CartItem {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  foto_url?: string;
  disponible: boolean;
}

export interface PedidoData {
  cliente_nombre: string;
  cliente_email?: string;
  cliente_telefono: string;
  tipo_pedido: 'RecogerEnTienda' | 'EntregaDomicilio';
  direccion_entrega?: string;
  instrucciones_entrega?: string;
  hora_programada?: string;
  notas_especiales?: string;
  items: Array<{
    id: number;
    cantidad: number;
    precio: number;
  }>;
}

export interface TenantInfo {
  id: number;
  nombre_empresa: string;
  subdominio: string;
}

export interface CatalogResponse {
  tenant: TenantInfo;
  categories: CategoriaMenu[];
}

export interface OrderResponse {
  order: {
    id: number;
    numero_pedido: string;
    total: number;
    estado: string;
  };
}

// Creado para manejar logica del Menu Principal del dashboard 
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  disponible: boolean;
  visible_en_web: boolean;
  foto_url: string | null;
  categoria?: string;
}

export interface Category {
  id: string;
  name: string;
  items: MenuItem[];
}

export interface RecetaItemUI {
  insumoId: number;
  nombre: string;
  cantidad: number;
  unidad: string;
}

export type TipoCategoria = 'COMIDA' | 'BEBIDA';

// --- ✨ NUEVOS TIPOS PARA EL MÓDULO DE PEDIDOS ---

// ✨ MOVIDO DESDE useDashboardApi.ts
export interface GetOrdenesFilters {
  estado?: OrdenEstado;
  fechaInicio?: string; // String en formato ISO (ej: "2025-11-12T00:00:00Z")
  fechaFin?: string;
}

// El estado de la orden (debe coincidir con tu Enum de Prisma)
export type OrdenEstado = 'Abierta' | 'Cerrada' | 'Pagada' | 'Cancelada';

// El detalle de un producto dentro de una orden
export interface ApiOrdenDetalle {
  id: number;
  cantidad: number;
  precio_unitario: string; // Prisma devuelve Decimal como string
  notas: string | null;
  productos: {
    nombre: string;
  };
}

// La orden completa (como la devuelve la API)
export interface ApiOrden {
  id: number;
  estado: OrdenEstado;
  subtotal: string;
  total: string;
  created_at: string; // Prisma devuelve DateTime como string (ISO)
  mesas: {
    nombre_o_numero: string;
  };
  empleados: {
    nombre: string | null;
    email: string;
  };
  ordendetalles: ApiOrdenDetalle[];
}

// Para crear una nueva orden (desde la app de Mesas)
export interface CreateOrdenItem {
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  notas?: string | null;
}

export interface CreateOrdenData {
  mesa_id: number;
  items: CreateOrdenItem[];
}

// --- AGREGAR ESTADOS DE RESERVA ---
export type reservas_estado = 'Pendiente' | 'Confirmada' | 'Cancelada' | 'Completada';
export type mesas_estado = 'Libre' | 'Ocupada' | 'Reservada';

export interface ApiMesa {
    id: number;
    nombre_o_numero: string;
    capacidad: number;
    estado: mesas_estado;
    ordenActiva?: any; // Añadido para compatibilidad con getMesasConOrdenes
}

export interface ApiReservation {
    id: number;
    cliente_nombre: string;
    cliente_email: string;
    cliente_telefono: string;
    fecha_hora: string; // ISO string
    cantidad_personas: number;
    estado: reservas_estado;
    mesa_id: number | null;
    mesas: { nombre_o_numero: string } | null;
}

export interface CreateReservationData {
  cliente_nombre: string;
  cliente_email?: string;
  cliente_telefono: string;
  fecha_hora: string; // ISO string o formato de fecha válido
  cantidad_personas: number;
  notas?: string;
}

//export * from '../hooks/useDashboardApi';