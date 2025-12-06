"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webReadyOrdersService = void 0;
const prisma_service_1 = require("@shared/database/prisma.service");
const client_1 = require("@prisma/client"); // Eliminadas importaciones no usadas
const mapWebPedidoToOutput = (pedido) => ({
    ...pedido,
    subtotal: pedido.subtotal.toFixed(2),
    total: pedido.total.toFixed(2),
    costo_envio: pedido.costo_envio.toFixed(2),
    created_at: pedido.created_at.toISOString(),
    updated_at: pedido.updated_at?.toISOString() || null,
    hora_programada: pedido.hora_programada?.toISOString() || null,
    webpedidos_detalles: pedido.webpedidos_detalles.map((detalle) => ({
        ...detalle,
        precio_unitario: detalle.precio_unitario.toFixed(2),
        subtotal: detalle.subtotal.toFixed(2),
        productos: {
            id: detalle.productos.id,
            nombre: detalle.productos.nombre,
        }
    }))
});
exports.webReadyOrdersService = {
    async getReadyOrders(tenantId) {
        const estadosListos = [
            client_1.webpedidos_estado.ListoParaRecoger,
            client_1.webpedidos_estado.EnCamino,
        ];
        const webPedidos = await prisma_service_1.prisma.webpedidos.findMany({
            where: {
                tenant_id: tenantId,
                estado: {
                    in: estadosListos,
                },
            },
            include: {
                webpedidos_detalles: {
                    include: {
                        productos: {
                            select: { id: true, nombre: true }
                        }
                    }
                }
            },
            orderBy: {
                created_at: 'asc',
            }
        });
        return webPedidos.map(mapWebPedidoToOutput);
    },
    async updateReadyOrderStatus(tenantId, orderId, newStatus) {
        const updatedOrder = await prisma_service_1.prisma.webpedidos.update({
            where: { id: orderId, tenant_id: tenantId },
            data: {
                estado: newStatus,
                updated_at: new Date(),
            },
            include: {
                webpedidos_detalles: {
                    include: {
                        productos: {
                            select: { id: true, nombre: true }
                        }
                    }
                }
            }
        });
        return mapWebPedidoToOutput(updatedOrder);
    },
};
