// src/types/prisma.ts
export interface CategoriaMenu {
  id: number;
  nombre: string;
  descripcion?: string;
  slug?: string;
  orden: number;
  visible_en_web: boolean;
  productos: Producto[];
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  foto_url?: string;
  disponible: boolean;
  visible_en_web: boolean;
  
  // Filtros
  es_vegetariano: boolean;
  es_vegano: boolean;
  sin_gluten: boolean;
  es_picante: boolean;
  es_recomendado: boolean;
  es_nuevo: boolean;
  
  categoria_id: number;
  categoria: CategoriaMenu;
}

export interface WebPedido {
  id: number;
  numero_pedido: string;
  cliente_nombre: string;
  cliente_email?: string;
  cliente_telefono: string;
  tipo_pedido: 'RecogerEnTienda' | 'EntregaDomicilio';
  estado: 'Pendiente' | 'Confirmado' | 'EnPreparacion' | 'ListoParaRecoger' | 'EnCamino' | 'Entregado' | 'Cancelado';
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

export interface TenantInfo {
  id: number;
  nombre_empresa: string;
  subdominio: string;
  isActive: boolean;
}

// Para el catálogo público
export interface CatalogResponse {
  tenant: TenantInfo;
  categories: CategoriaMenu[];
}