// src/types/index.ts - VERSIÓN COMPLETAMENTE CORREGIDA Y FINAL

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
  tipo_documento?: string;
  documento_identidad?: string;
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
  producto_inventario_id?: number | null;
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
  producto_id: number;
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
  descuento: string;
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
    producto_inventario_id: number | null;
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
  
  // ✅ Campos para Delivery
  motorizado_id?: number | null;
  hora_salida_delivery?: string | null;
  hora_entrega_delivery?: string | null;
  motorizado?: {
      id: number;
      nombre: string | null;
  } | null;

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
  proveedor_id?: number;
  estado_compra?: string;
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

// ========== ✨ TIPOS PARA CIERRE DE INVENTARIO ✨ ==========

export type TipoCierre = 'Diario' | 'Semanal' | 'Mensual';
export type EstadoCierre = 'Borrador' | 'Finalizado';
export type TipoDiferencia = 'Venta' | 'Merma' | 'Robo' | 'Error' | 'Donación';

// Detalle de un producto en el cierre
export interface CierreInventarioDetalle {
  id: number;
  cierre_id: number;
  producto_inventario_id: number;
  stock_sistema: number;
  stock_fisico: number;
  diferencia: number;
  tipo_diferencia: TipoDiferencia | null;
  valor_diferencia: number;
  notas: string | null;
  created_at: string;
  productos_inventario: {
    nombre: string;
    costo_unitario: number;
    unidades_medida: {
      abreviatura: string;
    } | null;
    categorias_inventario: {
      nombre: string;
      color: string | null;
    } | null;
  };
}

// Cierre completo con detalles
export interface CierreInventario {
  id: number;
  tenant_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_cierre: TipoCierre;
  estado: EstadoCierre;
  total_diferencias: number;
  observaciones: string | null;
  realizado_por_id: number;
  created_at: string;
  updated_at: string;
  empleados: {
    nombre: string | null;
    email: string;
  };
  detalles: CierreInventarioDetalle[];
}

// Para crear un detalle de cierre
export interface CreateCierreDetalleData {
  producto_inventario_id: number;
  stock_fisico: number;
  tipo_diferencia?: TipoDiferencia;
  notas?: string;
}

// Para crear un nuevo cierre
export interface CreateCierreInventarioData {
  fecha_inicio: string;
  fecha_fin: string;
  tipo_cierre: TipoCierre;
  observaciones?: string;
  detalles: CreateCierreDetalleData[];
}

// Para actualizar un cierre (mientras está en borrador)
export interface UpdateCierreInventarioData {
  observaciones?: string;
  detalles?: CreateCierreDetalleData[];
}

// Filtros para listar cierres
export interface GetCierresFilters {
  estado?: EstadoCierre;
  tipo_cierre?: TipoCierre;
  fechaInicio?: string;
  fechaFin?: string;
}

// Estadísticas de cierre
export interface CierreEstadisticas {
  total_productos_contados: number;
  total_diferencias_positivas: number;
  total_diferencias_negativas: number;
  valor_total_mermas: number;
  productos_con_mayor_diferencia: Array<{
    producto: string;
    diferencia: number;
    valor: number;
  }>;
  diferencias_por_tipo: Array<{
    tipo: TipoDiferencia;
    cantidad: number;
    valor: number;
  }>;
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

// ========== TIPOS ACTUALIZADOS PARA GESTIÓN DE EMPLEADOS CON SALARIO ==========

export interface ApiRol {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean; // ✅ NUEVO CAMPO
}

export interface ApiEmpleado {
  id: number;
  tenant_id: number;
  rol_id: number;
  email: string;
  nombre: string | null;
  documento_identidad: string | null;
  telefono: string | null;
  requiere_login: boolean;
  es_propietario: boolean;
  is_active: boolean;
  debe_cambiar_pass: boolean;
  salario: string | null; // ✅ Decimal en string
  fecha_ingreso: string | null; // ✅ NUEVO CAMPO
  created_at: string;
  updated_at: string;
  roles: ApiRol;
}

export interface CreateEmpleadoData {
  nombre: string;
  email: string;
  rol_id: number;
  documento_identidad?: string;
  telefono?: string;
  requiere_login: boolean;
  password?: string;
  salario?: number | string; // ✅ NUEVO
  fecha_ingreso?: string; // ✅ NUEVO
}

export interface UpdateEmpleadoData {
  nombre?: string;
  email?: string;
  rol_id?: number;
  documento_identidad?: string;
  telefono?: string;
  is_active?: boolean;
  salario?: number | string; // ✅ NUEVO
  fecha_ingreso?: string; // ✅ NUEVO
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  password_temporal: string;
}

// ========== NUEVOS TIPOS PARA ROLES ==========

export interface CreateRolData {
  nombre: string;
  descripcion?: string;
}

export interface UpdateRolData {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}

// ========== NUEVOS TIPOS PARA NÓMINA ==========

export interface EmpleadoNomina {
  id: number;
  nombre: string | null;
  email: string;
  rol: string;
  salario: number;
  fecha_ingreso: string | null;
  is_active: boolean;
}

export interface EstadisticasNomina {
  total_empleados_con_salario: number;
  total_nomina_mensual: number;
  salario_promedio: number;
  salario_maximo: number;
  salario_minimo: number;
  por_rol: Array<{
    rol: string;
    cantidad: number;
    total_salarios: number;
    promedio: number;
  }>;
}

export interface NominaResponse {
  empleados: EmpleadoNomina[];
  estadisticas: EstadisticasNomina;
}

export interface CalcularPagoResponse {
    empleado_id: number;
    empleado_nombre: string;
    sueldo_base: number;
    total_descuentos: number;
    total_pagar: number;
    descuentos_detalle: Array<{
        id: number;
        motivo: string;
        monto: number;
    }>;
    ultimo_pago: string | null;
    ya_pagado_mes_actual: boolean;
}

export interface PagarNominaData {
  metodo_pago: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Otro';
}

export interface PagarNominaResponse {
  success: boolean;
  message: string;
  montoPagado: number;
}
// ========== ✨ TIPOS PARA GASTOS OPERATIVOS ✨ ==========

export interface GastoOperativo {
  id: number;
  tenant_id: number;
  tipo_gasto_id: number;
  proveedor_id: number | null;
  fecha: string;
  monto: number;  // ✅ DIFERENTE de 'total'
  numero_documento: string | null;
  descripcion: string | null;
  metodo_pago: string | null;
  aprobado_por_id: number | null;
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
  empleados?: {
    nombre: string | null;
    email: string;
  };
}

export interface CreateGastoOperativoData {
  tipo_gasto_id: number;
  fecha: string;
  monto: number;  // ✅ DIFERENTE de 'total'
  numero_documento?: string;
  descripcion?: string;
  metodo_pago?: string;
  proveedor_id?: number;
}

export interface GetGastosFilters {
  tipo_gasto_id?: number;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface Caja {
  id: number;
  fecha_apertura: string;
  fecha_cierre?: string;
  monto_inicial: number;
  monto_esperado: number;
  monto_real?: number;
  diferencia?: number;
  estado: 'Abierta' | 'Cerrada';
  observaciones?: string;
}

export interface CajaMovimiento {
  id: number;
  tipo: 'INGRESO' | 'EGRESO';
  concepto: string;
  monto: number;
  metodo_pago: string;
  fecha_hora: string;
}

export interface EstadoCajaResponse {
  caja: Caja & { movimientos: CajaMovimiento[] };
  resumen: {
    inicial: number;
    ingresos: number;
    egresos: number;
    saldo_teorico: number;
  };
}

export interface AbrirCajaData {
  monto_inicial: number;
  observaciones?: string;
}

export interface RegistrarMovimientoData {
  tipo: 'INGRESO' | 'EGRESO';
  concepto: string;
  monto: number;
  metodo_pago: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Otro';
  notas?: string;
}

export interface CerrarCajaData {
  monto_real: number;
  observaciones?: string;
}

export interface InsumoOption {
  id: number;
  nombre: string;
  stock_actual: number;
  unidad_medida?: { abreviatura: string };
}

export interface CajaHistorialItem {
  id: number;
  fecha_apertura: string;
  fecha_cierre: string;
  monto_inicial: number;
  monto_esperado: number;
  monto_real: number;
  diferencia: number;
  empleados: { nombre: string | null };
  _count: { movimientos: number };
}
// ==========PEDIDO=========

export type PedidoOrigen = 'WEB' | string;

export interface KitchenItemDto {
    id_detalle: number; 
    producto_nombre: string;
    cantidad: number;
    notas: string | null; 
}


export interface KitchenOrderUnificada {
    id: string; 

    numero_orden: string; 
    origen: PedidoOrigen; 
  
    estado: webpedidos_estado; 
    cliente_mesa_nombre: string; 
    items: KitchenItemDto[];
    created_at: string; 
    notas_especiales: string | null;
}

//Tipos de Respuesta Dashboard
interface TopProductoData {
    nombre: string;
    cantidad: number;
    categoria: 'COMIDA' | 'BEBIDA';
}

interface MesasEstadoData {
    estado: mesas_estado; // Usa el enum de Prisma
    cantidad: number;
}

interface VentasPorHoraData {
    hora: string; // Ej: '08:00'
    total: number;
}

interface VentasPorDiaData {
    dia: string; // Ej: 'Mon', 'Tue', etc.
    total: number;
}

export interface DashboardOverview {
    // Kpis
    ventasHoy: number;
    pedidosHoy: number;
    ocupacionPorcentaje: number;
    ticketPromedio: number;
    
    // Mesas
    estadoMesas: MesasEstadoData[]; // Ej: [{ estado: 'Libre', cantidad: 3 }, ...]
    totalMesas: number;

    // Gráficos de Venta
    ventasPorHora: VentasPorHoraData[];
    tendenciaVentas: VentasPorDiaData[];
    ventasPorCategoria: Array<{ 
        nombre: string; 
        porcentaje: number; 
        total: number 
    }>;

    // Top Productos
    topPlatos: TopProductoData[];
    topBebidas: TopProductoData[];
}

export interface DashboardOverview {
    // Kpis
    ventasHoy: number;
    pedidosHoy: number;
    ocupacionPorcentaje: number;
    ticketPromedio: number;
    
    // Mesas
    estadoMesas: MesasEstadoData[]; // Ej: [{ estado: 'Libre', cantidad: 3 }, ...]
    totalMesas: number;

    // Gráficos de Venta
    ventasPorHora: VentasPorHoraData[];
    tendenciaVentas: VentasPorDiaData[];
    ventasPorCategoria: Array<{ 
        nombre: string; 
        porcentaje: number; 
        total: number 
    }>;

    // Top Productos
    topPlatos: TopProductoData[];
    topBebidas: TopProductoData[];
}

// === 1. Tipos de Ventas y Órdenes ===
export interface SalesTrendData {
    dia: string; // YYYY-MM-DD
    total: number;
}

export interface SalesReport {
    totalVentas: number;
    totalDescuentos: number;
    ordenesPOS: number;
    webPedidos: number;
    ventaPromedio: number;
    tendencia: SalesTrendData[];
}

// === 2. Tipos de Inventario y Costos ===
export interface InventoryReport {
    lowStockCount: number;
    inventoryValue: number;
    totalMermas: number;
    totalCompras: number; // Compras en el rango de fecha
}

// === 3. Tipos de Finanzas, Gastos y Caja ===
export interface PaymentMethodData {
    metodo: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Otro';
    total: number;
}

export interface ExpenseByCategoryData {
    nombre: string;
    total: number;
}

export interface FinanceReport {

    totalIngresos: number;

    totalGastos: number;

    margenBruto: number;

    ingresosPorMetodo: PaymentMethodData[];

    gastosPorTipo: ExpenseByCategoryData[];

    totalSobrante: number;

    totalDesfalco: number;

    cierresConDiferencia: number;

}



// ==========PEDIDO=========


// ========== ✨ TIPOS PARA MÉTODOS DE PAGO ✨ ==========

export type pagos_metodo_pago = 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Otro';

// ✅ CONSTANTES PARA USO EN EL CÓDIGO (equivalente a enum values)
export const PAGOS_METODO_PAGO_VALUES = {
  Efectivo: 'Efectivo' as pagos_metodo_pago,
  Tarjeta: 'Tarjeta' as pagos_metodo_pago,
  Transferencia: 'Transferencia' as pagos_metodo_pago,
  Otro: 'Otro' as pagos_metodo_pago,
} as const;

// ========== ✨ INTERFAZ CLIENTE (ACTUALIZADA) ✨ ==========
export interface Client {
  id: number;
  tenant_id: number;
  nombre: string;
  email: string | null;
  telefono: string | null;
  puntos_lealtad: number;
  // ✅ NUEVO: Propiedad de lealtad (opcional)
  loyalty?: {
    puntos: number;
    valor_en_soles: number;
    puede_canjear: boolean;
    config: { 
        puntos_por_sol: number;
        equivalencia: number;
        minimo_canje: number;
    }
  } | null;
}

// ========== ✨ INTERFAZ PARA ACTUALIZAR ORDEN POS (ACTUALIZADA) ✨ ==========
export interface UpdateOrderPosData {
    estado: 'Pagada' | 'Cerrada';
    monto_pago: number;
    metodo_pago: pagos_metodo_pago;
    descuento_monto?: number;
    cliente_nombre?: string;
    cliente_telefono?: string;
    tipo_documento?: string;
    documento_identidad?: string;
    puntos_canjeados?: number; // ✅ NUEVO: Puntos canjeados
}