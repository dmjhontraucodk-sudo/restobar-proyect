import { z } from 'zod';

const telefonoPeruano = /^[9]\d{8}$/;
const rucPeruano = /^\d{11}$/;

export const tenantConfigSchema = z.object({
  nombre_negocio: z.string().min(3, { message: 'El nombre del negocio es requerido' }).optional(),
  logo_url: z.string().url({ message: 'URL de logo inválida' }).optional().or(z.literal('')),
  eslogan: z.string().optional(),
  tipo_negocio: z.string().optional(),
  ruc: z.string().regex(rucPeruano, { message: 'El RUC debe tener 11 dígitos' }).optional().or(z.literal('')),
  direccion: z.string().optional(),
  telefono_principal: z.string().regex(telefonoPeruano, { message: 'El teléfono debe empezar con 9 y tener 9 dígitos' }).optional().or(z.literal('')),
  telefono_secundario: z.string().regex(telefonoPeruano, { message: 'El teléfono debe empezar con 9 y tener 9 dígitos' }).optional().or(z.literal('')),
  email_negocio: z.string().email({ message: 'Email de negocio inválido' }).optional().or(z.literal('')),
  whatsapp_business: z.string().regex(telefonoPeruano, { message: 'El teléfono debe empezar con 9 y tener 9 dígitos' }).optional().or(z.literal('')),
  facebook_url: z.string().url({ message: 'URL de Facebook inválida' }).optional().or(z.literal('')),
  instagram_url: z.string().url({ message: 'URL de Instagram inválida' }).optional().or(z.literal('')),
  horario_apertura: z.string().optional(),
  horario_cierre: z.string().optional(),
  
  acepta_efectivo: z.boolean().optional(),
  acepta_tarjeta: z.boolean().optional(),
  acepta_yape: z.boolean().optional(),
  acepta_plin: z.boolean().optional(),
  acepta_transferencia: z.boolean().optional(),
  yape_numero: z.string().regex(telefonoPeruano, { message: 'El número de Yape debe empezar con 9 y tener 9 dígitos' }).optional().or(z.literal('')),
  yape_qr_url: z.string().url({ message: 'URL de QR Yape inválida' }).optional().or(z.literal('')),
  plin_numero: z.string().regex(telefonoPeruano, { message: 'El número de Plin debe empezar con 9 y tener 9 dígitos' }).optional().or(z.literal('')),
  plin_qr_url: z.string().url({ message: 'URL de QR Plin inválida' }).optional().or(z.literal('')),
  banco_nombre: z.string().optional(),
  banco_cuenta: z.string().optional(),
  banco_cci: z.string().optional(),
  banco_titular: z.string().optional(),
  
  ticket_formato: z.string().optional(),
  ticket_mostrar_logo: z.boolean().optional(),
  ticket_pie_mensaje: z.string().optional(),
  ticket_copias: z.number().optional(),
  ticket_incluir_qr: z.boolean().optional(),
  ticket_mostrar_metodo: z.boolean().optional(),
  
  tiempo_preparacion: z.number().optional(),
  alertar_agotados: z.boolean().optional(),
  
  pedidos_online_activos: z.boolean().optional(),
  costo_delivery: z.number().optional(),
  monto_minimo_pedido: z.number().optional(),
  tiempo_prep_web: z.number().optional(),
  pedidos_web_inicio: z.string().optional(),
  pedidos_web_fin: z.string().optional(),
  mensaje_bienvenida_web: z.string().optional(),
  reservas_activas: z.boolean().optional(),
  dias_limite_reserva: z.number().optional(),
  
  alertas_stock_bajo: z.boolean().optional(),
  nivel_alerta_stock: z.number().optional(),
  
  fondo_caja_inicial: z.number().optional(),
  alerta_diferencia_monto: z.number().optional(),
  alerta_diferencia_pct: z.number().optional(),
  requiere_obs_cierre: z.boolean().optional(),
  
  email_nuevos_pedidos: z.string().email({ message: 'Email de nuevos pedidos inválido' }).optional().or(z.literal('')),
  whatsapp_pedidos_listos: z.string().optional(),
  notif_stock_critico: z.boolean().optional(),
  email_stock_critico: z.string().email({ message: 'Email de stock crítico inválido' }).optional().or(z.literal('')),
  resumen_diario_activo: z.boolean().optional(),
  resumen_diario_hora: z.string().optional(),
});

export type TenantConfigSchema = z.infer<typeof tenantConfigSchema>;
