// src/types/index.ts - ACTUALIZADO CON INVENTARIO DINÁMICO (Compatible con erasableSyntaxOnly)

// ========== TIPOS EXISTENTES (SIN CAMBIOS) ==========

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
  subtotal: number;
  total: number;
  costo_envio: number;
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

export interface GetOrdenesFilters {
  estado?: OrdenEstado;
  fechaInicio?: string;
  fechaFin?: string;
}

export type OrdenEstado = 'Abierta' | 'Cerrada' | 'Pagada' | 'Cancelada';

export interface ApiOrdenDetalle {
  id: number;
  cantidad: number;
  precio_unitario: string;
  notas: string | null;
  productos: {
    nombre: string;
  };
}

export interface ApiOrden {
  id: number;
  estado: OrdenEstado;
  subtotal: string;
  total: string;
  created_at: string;
  mesas: {
    nombre_o_numero: string;
  };
  empleados: {
    nombre: string | null;
    email: string;
  };
  ordendetalles: ApiOrdenDetalle[];
}

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

export type reservas_estado = 'Pendiente' | 'Confirmada' | 'Cancelada' | 'Completada';
export type mesas_estado = 'Libre' | 'Ocupada' | 'Reservada';

export interface ApiMesa {
  id: number;
  nombre_o_numero: string;
  capacidad: number;
  estado: mesas_estado;
  ordenActiva?: any;
}

export interface ApiReservation {
  id: number;
  cliente_nombre: string;
  cliente_email: string;
  cliente_telefono: string;
  fecha_hora: string;
  cantidad_personas: number;
  estado: reservas_estado;
  mesa_id: number | null;
  mesas: { nombre_o_numero: string } | null;
}

export interface CreateReservationData {
   cliente_nombre: string;
   cliente_email?: string;
   cliente_telefono: string;
   fecha_hora: string; 
   cantidad_personas: number;
   notas?: string;
   mesa_id?: number | null;
}

// ========== ✨ TIPOS PARA WEBPEDIDOS (REEMPLAZANDO ENUMS) ✨ ==========

export type webpedidos_tipo = 'RecogerEnTienda' | 'EntregaDomicilio';

export type webpedidos_estado = 
  | 'Pendiente'
  | 'Confirmado'
  | 'EnPreparacion'
  | 'ListoParaRecoger'
  | 'EnCamino'
  | 'Entregado'
  | 'Cancelado';

// ✅ CONSTANTES PARA USO EN EL CÓDIGO (equivalente a enum values)
export const WEBPEDIDOS_TIPO = {
  RecogerEnTienda: 'RecogerEnTienda' as webpedidos_tipo,
  EntregaDomicilio: 'EntregaDomicilio' as webpedidos_tipo,
} as const;

export const WEBPEDIDOS_ESTADO = {
  Pendiente: 'Pendiente' as webpedidos_estado,
  Confirmado: 'Confirmado' as webpedidos_estado,
  EnPreparacion: 'EnPreparacion' as webpedidos_estado,
  ListoParaRecoger: 'ListoParaRecoger' as webpedidos_estado,
  EnCamino: 'EnCamino' as webpedidos_estado,
  Entregado: 'Entregado' as webpedidos_estado,
  Cancelado: 'Cancelado' as webpedidos_estado,
} as const;

// ========== ✨ INTERFACES PARA WEBPEDIDOS (API) ✨ ==========

export interface ApiWebPedidoDetalle {
  id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  productos: {
    id: number;
    nombre: string;
  };
}

export interface ApiWebPedido {
  id: number;
  numero_pedido: string;
  cliente_nombre: string;
  cliente_email: string | null;
  cliente_telefono: string;
  tipo_pedido: webpedidos_tipo;
  estado: webpedidos_estado;
  subtotal: number;
  total: number;
  costo_envio: number;
  direccion_entrega: string | null;
  instrucciones_entrega: string | null;
  hora_programada: string | null;
  notas_especiales: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string | null;
  webpedidos_detalles: ApiWebPedidoDetalle[];
}

// ========== ✨ NUEVOS TIPOS - INVENTARIO DINÁMICO ✨ ==========

// --- CATEGORÍAS DE INVENTARIO (Dinámicas) ---
export interface CategoriaInventario {
  id: number;
  tenant_id: number;
  nombre: string;
  descripcion: string | null;
  color: string | null;
  icono: string | null;
  orden: number | null;
  activa: boolean;
  created_at: string;
}

export interface CreateCategoriaInventarioData {
  nombre: string;
  descripcion?: string;
  color?: string;
  icono?: string;
  orden?: number;
}

export interface UpdateCategoriaInventarioData {
  nombre?: string;
  descripcion?: string;
  color?: string;
  icono?: string;
  orden?: number;
  activa?: boolean;
}

// --- TIPOS DE GASTO (Dinámicos) ---
export interface TipoGasto {
  id: number;
  tenant_id: number;
  nombre: string;
  descripcion: string | null;
  afecta_inventario: boolean;
  color: string | null;
  icono: string | null;
  orden: number | null;
  activo: boolean;
  created_at: string;
}

export interface CreateTipoGastoData {
  nombre: string;
  descripcion?: string;
  afecta_inventario?: boolean;
  color?: string;
  icono?: string;
  orden?: number;
}

// --- UNIDADES DE MEDIDA (Dinámicas) ---
export interface UnidadMedida {
  id: number;
  tenant_id: number;
  nombre: string;
  abreviatura: string;
  tipo: string | null;
  activa: boolean;
  created_at: string;
}

export interface CreateUnidadMedidaData {
  nombre: string;
  abreviatura: string;
  tipo?: string;
}

// --- PRODUCTOS DE INVENTARIO (Antes "Insumos") ---
export interface ProductoInventario {
  id: number;
  tenant_id: number;
  categoria_inventario_id: number | null;
  unidad_medida_id: number | null;
  nombre: string;
  codigo_barras: string | null;
  stock_actual: number;
  costo_unitario: number;
  stock_minimo: number;
  stock_maximo: number | null;
  ultimo_conteo: string | null;
  stock_anterior: number;
  activo: boolean;
  created_at: string;
  categorias_inventario?: {
    nombre: string;
    color: string | null;
    icono: string | null;
  };
  unidades_medida?: {
    nombre: string;
    abreviatura: string;
  };
}

export interface CreateProductoInventarioData {
  nombre: string;
  categoria_inventario_id?: number;
  unidad_medida_id?: number;
  codigo_barras?: string;
  stock_actual?: number;
  costo_unitario?: number;
  stock_minimo?: number;
  stock_maximo?: number;
}

export interface UpdateProductoInventarioData {
  nombre?: string;
  categoria_inventario_id?: number;
  unidad_medida_id?: number;
  codigo_barras?: string;
  stock_actual?: number;
  costo_unitario?: number;
  stock_minimo?: number;
  stock_maximo?: number;
  activo?: boolean;
}

// --- COMPRAS/GASTOS ---
export interface CompraDetalle {
  id: number;
  cantidad: number;
  costo_unitario: number;
  productos_inventario: {
    nombre: string;
    unidades_medida: {
      abreviatura: string;
    } | null;
  };
}

export interface Compra {
  id: number;
  tenant_id: number;
  tipo_gasto_id: number;
  proveedor_id: number | null;
  fecha: string;
  total: number;
  numero_documento: string | null;
  descripcion: string | null;
  estado_compra: string;
  created_at: string;
  tipos_gasto: {
    nombre: string;
    afecta_inventario: boolean;
    color: string | null;
    icono: string | null;
  };
  proveedores?: {
    nombre_empresa: string;
  };
  compras_detalles: CompraDetalle[];
}

export interface CreateCompraDetalleData {
  producto_inventario_id: number;
  cantidad: number;
  costo_unitario: number;
}

export interface CreateCompraData {
  tipo_gasto_id: number;
  fecha: string;
  total: number;
  descripcion?: string;
  numero_documento?: string;
  proveedor_id?: number;
  items?: CreateCompraDetalleData[];
}

export interface GetComprasFilters {
  tipo_gasto_id?: number;
  fechaInicio?: string;
  fechaFin?: string;
}

// --- PROVEEDORES ---
export interface Proveedor {
  id: number;
  tenant_id: number;
  nombre_empresa: string;
  contacto_nombre: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  ruc: string | null;
  activo: boolean;
  created_at: string;
}

// ========== TIPOS DE PRISMA (EXTENDIDOS) ==========

export interface WebPedido {
  id: number;
  numero_pedido: string;
  cliente_nombre: string;
  cliente_email?: string;
  cliente_telefono: string;
  tipo_pedido: webpedidos_tipo;
  estado: webpedidos_estado;
  subtotal: number;
  total: number;
  costo_envio: number;
  direccion_entrega?: string;
  instrucciones_entrega?: string;
  hora_programada?: Date;
  notas_especiales?: string;
  created_at: Date;
}

export interface WebPedidoDetalle {
  id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  producto: Producto;
}