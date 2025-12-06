"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordenesPosService = void 0;
const prisma_service_1 = require("@shared/database/prisma.service");
const client_1 = require("@prisma/client");
exports.ordenesPosService = {
    async getOrdenesActivasParaCocina(tenantId) {
        const ordenes = await prisma_service_1.prisma.ordenes.findMany({
            where: {
                tenant_id: tenantId,
                estado: { notIn: [client_1.ordenes_estado.Cerrada, client_1.ordenes_estado.Pagada, client_1.ordenes_estado.Cancelada] }
            },
            include: {
                mesas: { select: { nombre_o_numero: true } },
                ordendetalles: {
                    where: {
                        productos: {
                            producto_inventario_id: null
                        }
                    },
                    include: {
                        productos: { select: { nombre: true } }
                    }
                }
            }
        });
        return ordenes
            .filter(o => o.ordendetalles.length > 0);
    },
    mapOrdenToDto(orden) {
        const estadoOrden = orden.estado || client_1.ordenes_estado.Abierta;
        let estadoCocina;
        switch (estadoOrden) {
            case client_1.ordenes_estado.Abierta:
                estadoCocina = 'Pendiente';
                break;
            default:
                estadoCocina = 'Pendiente';
        }
        return {
            id: `P-${orden.id}`,
            numero_orden: `M-${orden.mesas.nombre_o_numero}`,
            origen: `MESA-${orden.mesas.nombre_o_numero}`,
            estado: estadoCocina,
            cliente_mesa_nombre: `Mesa ${orden.mesas.nombre_o_numero}`,
            items: orden.ordendetalles.map(detalle => ({
                id_detalle: detalle.id,
                producto_nombre: detalle.productos.nombre,
                cantidad: detalle.cantidad,
                notas: detalle.notas,
            })),
            created_at: orden.created_at,
            notas_especiales: null,
        };
    },
    async actualizarEstadoOrdenPos(tenantId, ordenId, nuevoEstado) {
        if (nuevoEstado === 'EnPreparacion') {
            const orden = await prisma_service_1.prisma.ordenes.findUnique({
                where: { id: ordenId, tenant_id: tenantId },
                include: { ordendetalles: true }
            });
            if (!orden)
                throw new Error('Orden POS no encontrada.');
            console.log(`⚠️ Lógica de inventario: Descontando stock para Orden POS #${ordenId}...`);
            const estadoDB = client_1.ordenes_estado.Abierta;
            await prisma_service_1.prisma.ordenes.update({
                where: { id: ordenId },
                data: {
                    estado: estadoDB,
                }
            });
            return { id: ordenId, estado: estadoDB };
        }
        const orden = await prisma_service_1.prisma.ordenes.findUnique({ where: { id: ordenId } });
        if (!orden)
            throw new Error('Orden POS no encontrada después de actualización.');
        return { id: ordenId, estado: orden.estado };
    }
};
