// src/types/notifications.types.ts (NUEVO)
export type NotificationType = 'orden' | 'pedido_web' | 'inventario' | 'sistema' | 'reserva';

export interface SystemNotification {
  id: number;
  tipo: NotificationType;
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  relacionado_id?: number;
}