"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pedidosWebFlowService = void 0;
const prisma_service_1 = require("@shared/database/prisma.service");
const client_1 = require("@prisma/client");
const ordenes_pos_service_1 = require("./ordenes-pos.service"); // Eliminado: OrdenesQuery
exports.pedidosWebFlowService = {
    mapWebPedidoToDto(pedido) {
        return {
            id: `W-${pedido.id}`,
            numero_orden: pedido.numero_pedido,
            origen: 'WEB',
            estado: pedido.estado,
            cliente_mesa_nombre: pedido.cliente_nombre,
            items: pedido.webpedidos_detalles.map((detalle) => ({
                id_detalle: detalle.id,
                producto_nombre: detalle.productos.nombre,
                cantidad: detalle.cantidad,
                notas: pedido.notas_especiales,
            })),
            created_at: pedido.created_at,
            notas_especiales: pedido.notas_especiales,
        };
    },
    async obtenerPedidosParaCocina(tenantId) {
        const webPedidos = await prisma_service_1.prisma.webpedidos.findMany({
            where: {
                tenant_id: tenantId,
                estado: {
                    notIn: [
                        client_1.webpedidos_estado.Entregado,
                        client_1.webpedidos_estado.Cancelado,
                        client_1.webpedidos_estado.ListoParaRecoger,
                        client_1.webpedidos_estado.EnCamino
                    ]
                }
            },
            include: {
                webpedidos_detalles: {
                    where: {
                        productos: {
                            producto_inventario_id: null
                        }
                    },
                    include: {
                        productos: {
                            select: { nombre: true }
                        }
                    }
                }
            },
        });
        const webPedidosFiltrados = webPedidos.filter(pedido => pedido.webpedidos_detalles.length > 0);
        const posOrdenes = await ordenes_pos_service_1.ordenesPosService.getOrdenesActivasParaCocina(tenantId);
        const webDtos = webPedidosFiltrados.map(this.mapWebPedidoToDto);
        const posDtos = posOrdenes.map(ordenes_pos_service_1.ordenesPosService.mapOrdenToDto);
        const todosLosPedidos = [...webDtos, ...posDtos];
        todosLosPedidos.sort((a, b) => {
            const estadoOrder = {
                'Pendiente': 1,
                'EnPreparacion': 2,
                'ListoParaRecoger': 3,
                'EnCamino': 4,
            };
            const aOrder = estadoOrder[a.estado] || 5;
            const bOrder = estadoOrder[b.estado] || 5;
            if (aOrder !== bOrder) {
                return aOrder - bOrder;
            }
            return a.created_at.getTime() - b.created_at.getTime();
        });
        return todosLosPedidos;
    },
    async actualizarEstadoPedido(tenantId, pedidoId, nuevoEstado) {
        const pedido = await prisma_service_1.prisma.webpedidos.findFirst({
            where: {
                id: pedidoId,
                tenant_id: tenantId
            },
            include: {
                webpedidos_detalles: {
                    include: {
                        productos: true
                    }
                }
            }
        });
        if (!pedido) {
            throw new Error('Pedido web no encontrado o no pertenece a este tenant');
        }
        const pedidoActualizado = await prisma_service_1.prisma.webpedidos.update({
            where: { id: pedidoId },
            data: {
                estado: nuevoEstado,
                updated_at: new Date()
            },
            include: {
                webpedidos_detalles: {
                    include: {
                        productos: true
                    }
                }
            }
        });
        return pedidoActualizado;
    },
    async crearWebPedido(tenantId, datos) {
        const numeroPedido = `WEB-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
        const nuevoPedido = await prisma_service_1.prisma.$transaction(async (tx) => {
            const pedido = await tx.webpedidos.create({
                data: {
                    tenant_id: tenantId,
                    numero_pedido: numeroPedido,
                    cliente_nombre: datos.cliente_nombre,
                    cliente_email: datos.cliente_email || null,
                    cliente_telefono: datos.cliente_telefono,
                    tipo_pedido: datos.tipo_pedido,
                    direccion_entrega: datos.direccion_entrega || null,
                    instrucciones_entrega: datos.instrucciones_entrega || null,
                    notas_especiales: datos.notas_especiales || null,
                    subtotal: datos.subtotal,
                    total: datos.total,
                    costo_envio: datos.costo_envio || 0,
                    estado: client_1.webpedidos_estado.Pendiente,
                }
            });
            await tx.webpedidos_detalles.createMany({
                data: datos.items.map((item) => ({
                    tenant_id: tenantId,
                    webpedido_id: pedido.id,
                    producto_id: item.id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio,
                    subtotal: item.cantidad * item.precio
                }))
            });
            return pedido;
        });
        return nuevoPedido;
    }
};
