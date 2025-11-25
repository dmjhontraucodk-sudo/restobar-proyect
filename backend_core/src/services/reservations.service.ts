// src/services/reservations.service.ts
import { prisma } from '../lib/prisma';

// Estado de la Reserva (Basado en tu schema.prisma)
export enum reservas_estado {
 Pendiente = 'Pendiente',
 Confirmada = 'Confirmada',
 Cancelada = 'Cancelada',
 Completada = 'Completada',
}

export interface CreateReservationData {
 cliente_nombre: string;
 cliente_email?: string;
 cliente_telefono: string;
 fecha_hora: string; // ISO string o formato de fecha válido
 cantidad_personas: number;
 notas?: string;
 // ✅ NOTA: mesa_id NO va aquí porque se pasa como parámetro separado
}

export const reservationsService = {
  
  async createReservation(
    tenantId: number, 
    data: CreateReservationData,
    mesaId?: number | null 
  ) {
    const { cliente_nombre, cliente_email, cliente_telefono, fecha_hora, cantidad_personas, notas } = data;
    
    // Crear la reserva en estado Pendiente
    return await prisma.reservas.create({
      data: {
        tenant_id: tenantId,
        cliente_nombre,
        cliente_email,
        cliente_telefono,
        fecha_hora: new Date(fecha_hora),
        cantidad_personas,
        notas,
        mesa_id: mesaId, // ✅ NUEVO: Asignar mesa_id si se proporciona
        estado: reservas_estado.Pendiente,
      }
    });
  },

  /**
  * 2. Obtener todas las reservas de un tenant (para el Dashboard).
  */
  async getReservationsByTenant(tenantId: number, filters?: { estado?: reservas_estado }) {
    const where: any = { tenant_id: tenantId };
    if (filters?.estado) {
      where.estado = filters.estado;
    }

    return await prisma.reservas.findMany({
      where,
      include: {
        mesas: {
          select: { nombre_o_numero: true }
        }
      },
      orderBy: { fecha_hora: 'asc' }
    });
  },
  
  /**
  * 3. Actualizar el estado de una reserva (Confirmar/Cancelar).
  */
  async updateReservationStatus(tenantId: number, reservationId: number, newStatus: reservas_estado, mesaId?: number | null) {
    const existing = await prisma.reservas.findFirst({
      where: { id: reservationId, tenant_id: tenantId }
    });

    if (!existing) {
      throw new Error('Reserva no encontrada o no pertenece a este tenant.');
    }

    const dataToUpdate: any = { estado: newStatus };

    if (newStatus === reservas_estado.Confirmada) {
      if (!mesaId) throw new Error('Se requiere asignar una mesa para confirmar.');
      dataToUpdate.mesa_id = mesaId;
      
      // Lógica adicional: Marcar mesa como Reservada (si ya no lo está)
      await prisma.mesas.updateMany({
        where: { id: mesaId, tenant_id: tenantId },
        data: { estado: 'Reservada' }
      });

    } else if (existing.mesa_id && (newStatus === reservas_estado.Cancelada || newStatus === reservas_estado.Completada)) {
      // Lógica adicional: Liberar la mesa si la reserva fue cancelada o completada
      await prisma.mesas.updateMany({
        where: { id: existing.mesa_id, tenant_id: tenantId },
        data: { estado: 'Libre' }
      });
      dataToUpdate.mesa_id = null;
    }

    return await prisma.reservas.update({
      where: { id: reservationId },
      data: dataToUpdate,
      include: { mesas: true }
    });
  },
};
