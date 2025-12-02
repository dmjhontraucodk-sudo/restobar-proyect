"use strict";
// backend_core/src/services/ordenes.service.ts (CORREGIDO)
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordenesService = void 0;
const prisma_1 = require("../lib/prisma");
exports.ordenesService = {
    /**
     * Añade nuevos ítems a una orden abierta existente y recalcula los totales.
     */
    // 2. Usamos el tipo localmente definido
    async addItemsToOrder(tenantId, empleadoId, ordenId, data) {
        return await prisma_1.prisma.$transaction(async (tx) => {
            // 1. Obtener la orden actual y verificar estado
            const ordenExistente = await tx.ordenes.findUnique({
                where: { id: ordenId, tenant_id: tenantId },
                select: { id: true, estado: true, subtotal: true, total: true, descuento: true }
            });
            if (!ordenExistente || ordenExistente.estado !== 'Abierta') {
                throw new Error('La orden no existe o no está en estado Abierta.');
            }
            // 2. Insertar los nuevos detalles
            const detallesData = data.items.map(item => ({
                tenant_id: tenantId,
                orden_id: ordenId,
                producto_id: item.producto_id,
                cantidad: item.cantidad,
                // Usamos parseFloat ya que Decimal de Prisma espera un tipo numérico preciso o string
                precio_unitario: item.precio_unitario,
                notas: item.notas || null,
            }));
            await tx.ordendetalles.createMany({
                data: detallesData,
            });
            // 3. Recalcular el nuevo subtotal
            const nuevoSubtotalItems = data.items.reduce((acc, item) => acc + (item.precio_unitario * item.cantidad), 0);
            // Convertir a número antes de sumar
            const subtotalAnterior = Number(ordenExistente.subtotal || 0);
            const descuentoActual = Number(ordenExistente.descuento || 0);
            const nuevoSubtotal = subtotalAnterior + nuevoSubtotalItems;
            const nuevoTotal = nuevoSubtotal - descuentoActual;
            // 4. Actualizar la orden con los nuevos totales
            const ordenActualizada = await tx.ordenes.update({
                where: { id: ordenId },
                data: {
                    // Actualizar los campos Decimal de Prisma
                    subtotal: nuevoSubtotal,
                    total: nuevoTotal,
                },
                include: {
                    mesas: { select: { nombre_o_numero: true } },
                    empleados: { select: { nombre: true, email: true } },
                    ordendetalles: {
                        include: { productos: { select: { nombre: true } } }
                    }
                }
            });
            // 3. Eliminamos el "as unknown as ApiOrden" y usamos la interfaz de retorno local.
            return ordenActualizada;
        });
    },
};
