// frontend/src/types/tenant-config.types.ts - SIMPLIFICADO

export interface TenantConfig {
  id: number;
  tenant_id: number;
  
  // ========== 🏢 INFORMACIÓN DEL NEGOCIO ==========
  nombre_negocio: string | null;
  logo_url: string | null;
  eslogan: string | null;
  tipo_negocio: string | null;
  ruc: string | null;
  direccion: string | null;
  telefono_principal: string | null;
  telefono_secundario: string | null;
  email_negocio: string | null;
  whatsapp_business: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  horario_apertura: string | null;
  horario_cierre: string | null;
  
  // ========== 💵 MÉTODOS DE PAGO ==========
  acepta_efectivo: boolean;
  acepta_tarjeta: boolean;
  acepta_yape: boolean;
  acepta_plin: boolean;
  acepta_transferencia: boolean;
  yape_numero: string | null;
  yape_qr_url: string | null;
  plin_numero: string | null;
  plin_qr_url: string | null;
  banco_nombre: string | null;
  banco_cuenta: string | null;
  banco_cci: string | null;
  banco_titular: string | null;
  
  // ========== 🧾 TICKETS Y COMPROBANTES ==========
  ticket_formato: string;
  ticket_mostrar_logo: boolean;
  ticket_pie_mensaje: string | null;
  ticket_copias: number;
  ticket_incluir_qr: boolean;
  ticket_mostrar_metodo: boolean;
  
  // ========== 🍽️ OPERACIONES (SIMPLIFICADO) ==========
  tiempo_preparacion: number;
  alertar_agotados: boolean;
  
  // ========== 🌐 PEDIDOS WEB Y DELIVERY ==========
  pedidos_online_activos: boolean;
  costo_delivery: number;
  monto_minimo_pedido: number;
  tiempo_prep_web: number;
  pedidos_web_inicio: string | null;
  pedidos_web_fin: string | null;
  mensaje_bienvenida_web: string | null;
  reservas_activas: boolean;
  dias_limite_reserva: number;
  
  // ========== 📦 INVENTARIO (SIMPLIFICADO) ==========
  alertas_stock_bajo: boolean;
  nivel_alerta_stock: number;
  
  // ========== 💰 CAJA (SIMPLIFICADO) ==========
  fondo_caja_inicial: number;
  alerta_diferencia_monto: number;
  alerta_diferencia_pct: number;
  requiere_obs_cierre: boolean;
  
  // ========== 🔔 NOTIFICACIONES ==========
  email_nuevos_pedidos: string | null;
  whatsapp_pedidos_listos: string | null;
  notif_stock_critico: boolean;
  email_stock_critico: string | null;
  resumen_diario_activo: boolean;
  resumen_diario_hora: string | null;
  
  // ========== TIMESTAMPS ==========
  created_at: string;
  updated_at: string;
}

export interface UpdateTenantConfigData {
  // Información del Negocio
  nombre_negocio?: string;
  logo_url?: string;
  eslogan?: string;
  tipo_negocio?: string;
  ruc?: string;
  direccion?: string;
  telefono_principal?: string;
  telefono_secundario?: string;
  email_negocio?: string;
  whatsapp_business?: string;
  facebook_url?: string;
  instagram_url?: string;
  horario_apertura?: string;
  horario_cierre?: string;
  
  // Métodos de Pago
  acepta_efectivo?: boolean;
  acepta_tarjeta?: boolean;
  acepta_yape?: boolean;
  acepta_plin?: boolean;
  acepta_transferencia?: boolean;
  yape_numero?: string;
  yape_qr_url?: string;
  plin_numero?: string;
  plin_qr_url?: string;
  banco_nombre?: string;
  banco_cuenta?: string;
  banco_cci?: string;
  banco_titular?: string;
  
  // Tickets y Comprobantes
  ticket_formato?: string;
  ticket_mostrar_logo?: boolean;
  ticket_pie_mensaje?: string;
  ticket_copias?: number;
  ticket_incluir_qr?: boolean;
  ticket_mostrar_metodo?: boolean;
  
  // Operaciones (SIMPLIFICADO)
  tiempo_preparacion?: number;
  alertar_agotados?: boolean;
  
  // Pedidos Web
  pedidos_online_activos?: boolean;
  costo_delivery?: number;
  monto_minimo_pedido?: number;
  tiempo_prep_web?: number;
  pedidos_web_inicio?: string;
  pedidos_web_fin?: string;
  mensaje_bienvenida_web?: string;
  reservas_activas?: boolean;
  dias_limite_reserva?: number;
  
  // Inventario (SIMPLIFICADO)
  alertas_stock_bajo?: boolean;
  nivel_alerta_stock?: number;
  
  // Caja (SIMPLIFICADO)
  fondo_caja_inicial?: number;
  alerta_diferencia_monto?: number;
  alerta_diferencia_pct?: number;
  requiere_obs_cierre?: boolean;
  
  // Notificaciones
  email_nuevos_pedidos?: string;
  whatsapp_pedidos_listos?: string;
  notif_stock_critico?: boolean;
  email_stock_critico?: string;
  resumen_diario_activo?: boolean;
  resumen_diario_hora?: string;
}