"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reservationsService = exports.reservas_estado = void 0;
// src/services/reservations.service.ts
const prisma_service_1 = require("@shared/database/prisma.service");
// Estado de la Reserva (Basado en tu schema.prisma)
var reservas_estado;
(function (reservas_estado) {
    reservas_estado["Pendiente"] = "Pendiente";
    reservas_estado["Confirmada"] = "Confirmada";
    reservas_estado["Cancelada"] = "Cancelada";
    reservas_estado["Completada"] = "Completada";
})(reservas_estado || (exports.reservas_estado = reservas_estado = {}));
exports.reservationsService = {
    async createReservation(tenantId, data, mesaId) {
        const { cliente_nombre, cliente_email, cliente_telefono, fecha_hora, cantidad_personas, notas } = data;
        // Crear la reserva en estado Pendiente
        return await prisma_service_1.prisma.reservas.create({
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
    async getReservationsByTenant(tenantId, filters) {
        const where = { tenant_id: tenantId };
        if (filters?.estado) {
            where.estado = filters.estado;
        }
        return await prisma_service_1.prisma.reservas.findMany({
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
    async updateReservationStatus(tenantId, reservationId, newStatus, mesaId) {
        const existing = await prisma_service_1.prisma.reservas.findFirst({
            where: { id: reservationId, tenant_id: tenantId }
        });
        if (!existing) {
            throw new Error('Reserva no encontrada o no pertenece a este tenant.');
        }
        const dataToUpdate = { estado: newStatus };
        if (newStatus === reservas_estado.Confirmada) {
            if (!mesaId)
                throw new Error('Se requiere asignar una mesa para confirmar.');
            dataToUpdate.mesa_id = mesaId;
            // Lógica adicional: Marcar mesa como Reservada (si ya no lo está)
            await prisma_service_1.prisma.mesas.updateMany({
                where: { id: mesaId, tenant_id: tenantId },
                data: { estado: 'Reservada' }
            });
        }
        else if (existing.mesa_id && (newStatus === reservas_estado.Cancelada || newStatus === reservas_estado.Completada)) {
            // Lógica adicional: Liberar la mesa si la reserva fue cancelada o completada
            await prisma_service_1.prisma.mesas.updateMany({
                where: { id: existing.mesa_id, tenant_id: tenantId },
                data: { estado: 'Libre' }
            });
            dataToUpdate.mesa_id = null;
        }
        return await prisma_service_1.prisma.reservas.update({
            where: { id: reservationId },
            data: dataToUpdate,
            include: { mesas: true }
        });
    },
};
