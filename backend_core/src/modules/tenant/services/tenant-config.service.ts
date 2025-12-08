import { prisma } from '@shared/database/prisma.service';

// ========== INTERFACES ==========

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
  
  // Operaciones
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
  
  // Inventario
  alertas_stock_bajo?: boolean;
  nivel_alerta_stock?: number;
  
  // Caja
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

// ========== SERVICE PRINCIPAL ==========

export const tenantConfigService = {
  
  // ============================================================
  // FUNCIONES ANTIGUAS (MANTIENEN COMPATIBILIDAD)
  // ============================================================
  
  /**
   * ✅ FUNCIÓN ANTIGUA - NO TOCAR
   * Obtiene configuración de pedidos web (tabla vieja)
   */
  async getOrderConfig(tenantId: number) {
    let config = await prisma.tenant_config_pedidos.findUnique({
      where: { tenant_id: tenantId }
    });

    if (!config) {
      // Crear configuración por defecto si no existe
      config = await prisma.tenant_config_pedidos.create({
        data: {
          tenant_id: tenantId,
          dias_limite_reserva: 2,
          notif_pedido_confirmado: true,
          notif_pedido_cancelado: true,
          notif_pedido_listo: true,
          email_asunto_confirmado: 'Confirmación de tu pedido',
          email_asunto_cancelado: 'Actualización sobre tu pedido',
          email_asunto_listo: '¡Tu pedido está listo!'
        }
      });
    }

    return config;
  },

  /**
   * ✅ FUNCIÓN ANTIGUA - NO TOCAR
   * Actualiza configuración de pedidos web (tabla vieja)
   */
  async updateOrderConfig(tenantId: number, configData: any) {
    return await prisma.tenant_config_pedidos.upsert({
      where: { tenant_id: tenantId },
      update: configData,
      create: {
        tenant_id: tenantId,
        ...configData
      }
    });
  },

  // ============================================================
  // FUNCIONES NUEVAS (PARA tenant_config)
  // ============================================================
  
  /**
   * 🆕 Obtener configuración completa del tenant
   */
  async getConfig(tenantId: number) {
    let config = await prisma.tenant_config.findUnique({
      where: { tenant_id: tenantId }
    });

    // Si no existe, crear con valores por defecto
    if (!config) {
      config = await this.createDefaultConfig(tenantId);
    }

    // Obtener configuración de lealtad
    let lealtad = await prisma.programa_lealtad.findUnique({
      where: { tenant_id: tenantId }
    });

    if (!lealtad) {
        lealtad = await prisma.programa_lealtad.create({
            data: {
                tenant_id: tenantId,
                activo: false,
                puntos_por_sol: 0.1, // 1 punto por cada 10 soles
                monto_minimo_canje: 50, // Mínimo 50 puntos para canjear
                equivalencia_sol_por_punto: 0.05 // 1 punto = 0.05 soles
            }
        });
    }

    return {
        ...config,
        programa_lealtad: lealtad
    };
  },

  /**
   * 🆕 Crear configuración por defecto
   */
  async createDefaultConfig(tenantId: number) {
    return await prisma.tenant_config.create({
      data: {
        tenant_id: tenantId,
        nombre_negocio: 'Mi Restaurante',
        tipo_negocio: 'Restaurante',
        acepta_efectivo: true,
        ticket_formato: '80mm',
        tiempo_preparacion: 30,
        alertar_agotados: false,
        pedidos_online_activos: false,
        costo_delivery: 0,
        monto_minimo_pedido: 0,
        tiempo_prep_web: 30,
        pedidos_web_inicio: '08:00',
        pedidos_web_fin: '22:00',
        reservas_activas: false,
        dias_limite_reserva: 7,
        alertas_stock_bajo: false,
        nivel_alerta_stock: 10,
        fondo_caja_inicial: 100,
        alerta_diferencia_monto: 50,
        alerta_diferencia_pct: 5,
        requiere_obs_cierre: false,
        notif_stock_critico: false,
        resumen_diario_activo: false,
        resumen_diario_hora: '20:00'
      }
    });
  },

  /**
   * 🆕 Actualizar configuración (parcial)
   */
  async updateConfig(tenantId: number, data: any) { // Cambiado tipo a any para flexibilidad
    const { programa_lealtad, ...configData } = data;

    // Actualizar configuración principal
    const existingConfig = await prisma.tenant_config.findUnique({
      where: { tenant_id: tenantId }
    });

    if (!existingConfig) {
      await prisma.tenant_config.create({
        data: {
          tenant_id: tenantId,
          ...configData
        }
      });
    } else {
      await prisma.tenant_config.update({
        where: { tenant_id: tenantId },
        data: configData
      });
    }

    // Actualizar programa de lealtad si viene en los datos
    if (programa_lealtad) {
        await prisma.programa_lealtad.upsert({
            where: { tenant_id: tenantId },
            update: programa_lealtad,
            create: {
                tenant_id: tenantId,
                ...programa_lealtad
            }
        });
    }

    return this.getConfig(tenantId);
  },

  /**
   * 🆕 Actualizar sección específica
   */
  async updateSection(tenantId: number, _section: string, data: any) { // Cambiado: section → _section
    return await this.updateConfig(tenantId, data);
  },

  // ============================================================
  // 🆕 FUNCIONES PARA VALIDACIONES DE PEDIDOS WEB
  // ============================================================

  /**
   * 🆕 Verificar si los pedidos online están activos
   */
  async verificarPedidosOnlineActivos(tenantId: number): Promise<boolean> {
    const config = await this.getConfig(tenantId);
    return config.pedidos_online_activos;
  },

  /**
   * 🆕 Verificar si está dentro del horario de pedidos web
   */
  async verificarHorarioPedidosWeb(tenantId: number): Promise<{
    dentroDeHorario: boolean;
    horario: { inicio: string; fin: string };
    horaActual: string;
  }> {
    const config = await this.getConfig(tenantId);
    
    const horaActual = new Date().toLocaleTimeString('es-PE', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    
    const horaInicio = config.pedidos_web_inicio || '00:00';
    const horaFin = config.pedidos_web_fin || '23:59';
    
    const dentroDeHorario = horaActual >= horaInicio && horaActual <= horaFin;
    
    return {
      dentroDeHorario,
      horario: { inicio: horaInicio, fin: horaFin },
      horaActual
    };
  },

  /**
   * 🆕 Calcular el tiempo estimado de preparación para un pedido
   */
  async calcularTiempoEstimado(tenantId: number, esWeb: boolean = false): Promise<{
    minutos: number;
    horaEstimada: Date;
  }> {
    const config = await this.getConfig(tenantId);
    const minutos = esWeb ? config.tiempo_prep_web : config.tiempo_preparacion;
    
    const horaEstimada = new Date();
    horaEstimada.setMinutes(horaEstimada.getMinutes() + minutos);
    
    return {
      minutos,
      horaEstimada
    };
  },

  /**
   * 🆕 Obtener solo configuración de operaciones
   */
  async getOperacionesConfig(tenantId: number) {
    const config = await this.getConfig(tenantId);
    return {
      tiempo_preparacion: config.tiempo_preparacion,
      alertar_agotados: config.alertar_agotados,
    };
  },

  /**
   * 🆕 Obtener solo configuración de pedidos web
   */
  async getPedidosWebConfig(tenantId: number) {
    const config = await this.getConfig(tenantId);
    return {
      pedidos_online_activos: config.pedidos_online_activos,
      costo_delivery: config.costo_delivery,
      monto_minimo_pedido: config.monto_minimo_pedido,
      tiempo_prep_web: config.tiempo_prep_web,
      pedidos_web_inicio: config.pedidos_web_inicio,
      pedidos_web_fin: config.pedidos_web_fin,
      mensaje_bienvenida_web: config.mensaje_bienvenida_web,
      reservas_activas: config.reservas_activas,
      dias_limite_reserva: config.dias_limite_reserva,
    };
  },

  /**
   * 🆕 Obtener solo configuración de inventario
   */
  async getInventarioConfig(tenantId: number) {
    const config = await this.getConfig(tenantId);
    return {
      alertas_stock_bajo: config.alertas_stock_bajo,
      nivel_alerta_stock: config.nivel_alerta_stock,
    };
  },

  /**
   * 🆕 Obtener solo configuración de caja
   */
  async getCajaConfig(tenantId: number) {
    const config = await this.getConfig(tenantId);
    return {
      fondo_caja_inicial: config.fondo_caja_inicial,
      alerta_diferencia_monto: config.alerta_diferencia_monto,
      alerta_diferencia_pct: config.alerta_diferencia_pct,
      requiere_obs_cierre: config.requiere_obs_cierre,
    };
  },

  /**
   * 🆕 Obtener solo configuración de notificaciones
   */
  async getNotificacionesConfig(tenantId: number) {
    const config = await this.getConfig(tenantId);
    return {
      email_nuevos_pedidos: config.email_nuevos_pedidos,
      whatsapp_pedidos_listos: config.whatsapp_pedidos_listos,
      notif_stock_critico: config.notif_stock_critico,
      email_stock_critico: config.email_stock_critico,
      resumen_diario_activo: config.resumen_diario_activo,
      resumen_diario_hora: config.resumen_diario_hora,
    };
  },

  // ============================================================
  // FUNCIONES DE VALIDACIÓN
  // ============================================================

  /**
   * 🆕 Validar horarios
   */
  validateHorarios(inicio: string, fin: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (!timeRegex.test(inicio) || !timeRegex.test(fin)) {
      return false;
    }

    const [inicioHora, inicioMin] = inicio.split(':').map(Number);
    const [finHora, finMin] = fin.split(':').map(Number);
    
    const inicioMinutos = inicioHora * 60 + inicioMin;
    const finMinutos = finHora * 60 + finMin;
    
    return finMinutos > inicioMinutos;
  },

  /**
   * 🆕 Validar datos de configuración
   */
  validateConfig(data: UpdateTenantConfigData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar horarios de apertura
    if (data.horario_apertura && data.horario_cierre) {
      if (!this.validateHorarios(data.horario_apertura, data.horario_cierre)) {
        errors.push('Los horarios de apertura/cierre no son válidos');
      }
    }

    // Validar horarios de pedidos web
    if (data.pedidos_web_inicio && data.pedidos_web_fin) {
      if (!this.validateHorarios(data.pedidos_web_inicio, data.pedidos_web_fin)) {
        errors.push('Los horarios de pedidos web no son válidos');
      }
    }

    // Validar montos
    if (data.costo_delivery !== undefined && data.costo_delivery < 0) {
      errors.push('El costo de delivery no puede ser negativo');
    }

    if (data.monto_minimo_pedido !== undefined && data.monto_minimo_pedido < 0) {
      errors.push('El monto mínimo no puede ser negativo');
    }

    if (data.fondo_caja_inicial !== undefined && data.fondo_caja_inicial < 0) {
      errors.push('El fondo de caja no puede ser negativo');
    }

    // Validar tiempos
    if (data.tiempo_preparacion !== undefined && (data.tiempo_preparacion < 5 || data.tiempo_preparacion > 240)) {
      errors.push('El tiempo de preparación debe estar entre 5 y 240 minutos');
    }

    // Validar formato de ticket
    if (data.ticket_formato && !['58mm', '80mm'].includes(data.ticket_formato)) {
      errors.push('El formato de ticket debe ser 58mm o 80mm');
    }

    // Validar emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.email_negocio && !emailRegex.test(data.email_negocio)) {
      errors.push('El email del negocio no es válido');
    }

    if (data.email_nuevos_pedidos && !emailRegex.test(data.email_nuevos_pedidos)) {
      errors.push('El email de notificaciones no es válido');
    }

    if (data.email_stock_critico && !emailRegex.test(data.email_stock_critico)) {
      errors.push('El email de alertas de stock no es válido');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * 🆕 Resetear configuración a valores por defecto
   */
  async resetToDefaults(tenantId: number) {
    return await prisma.tenant_config.update({
      where: { tenant_id: tenantId },
      data: {
        nombre_negocio: 'Mi Restaurante',
        logo_url: null,
        eslogan: null,
        tipo_negocio: 'Restaurante',
        acepta_efectivo: true,
        acepta_tarjeta: false,
        acepta_yape: false,
        acepta_plin: false,
        acepta_transferencia: false,
        ticket_formato: '80mm',
        ticket_mostrar_logo: true,
        ticket_copias: 1,
        tiempo_preparacion: 30,
        alertar_agotados: false,
        pedidos_online_activos: false,
        costo_delivery: 0,
        monto_minimo_pedido: 0,
        tiempo_prep_web: 30,
        pedidos_web_inicio: '08:00',
        pedidos_web_fin: '22:00',
        horario_apertura: '08:00',
        horario_cierre: '22:00',
        alertas_stock_bajo: false,
        nivel_alerta_stock: 10,
        fondo_caja_inicial: 100,
        alerta_diferencia_monto: 50,
        alerta_diferencia_pct: 5,
        requiere_obs_cierre: false,
        notif_stock_critico: false,
        resumen_diario_activo: false,
        resumen_diario_hora: '20:00'
      }
    });
  }
};