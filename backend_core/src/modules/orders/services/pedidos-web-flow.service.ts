import { prisma } from '@shared/database/prisma.service';
import { webpedidos_estado, webpedidos as WebPedidoPrisma } from '@prisma/client';
import { ordenesPosService } from './ordenes-pos.service'; // Eliminado: OrdenesQuery

export type PedidoOrigen = 'WEB' | string;

export interface KitchenItemDto {
    id_detalle: number; 
    producto_nombre: string;
    cantidad: number;
    notas: string | null; 
}

export interface KitchenOrderDto {
    id: string; 
    numero_orden: string; 
    origen: PedidoOrigen; 
    estado: string; 
    cliente_mesa_nombre: string; 
    items: KitchenItemDto[];
    created_at: Date;
    notas_especiales: string | null;
}

export const pedidosWebFlowService = {

    mapWebPedidoToDto(pedido: any): KitchenOrderDto {
        return {
            id: `W-${pedido.id}`,
            numero_orden: pedido.numero_pedido,
            origen: 'WEB',
            estado: pedido.estado,
            cliente_mesa_nombre: pedido.cliente_nombre,
            items: pedido.webpedidos_detalles.map((detalle: any) => ({
                id_detalle: detalle.id,
                producto_nombre: detalle.productos.nombre,
                cantidad: detalle.cantidad,
                notas: pedido.notas_especiales, 
            })),
            created_at: pedido.created_at,
            notas_especiales: pedido.notas_especiales,
        };
    },

    async obtenerPedidosParaCocina(tenantId: number): Promise<KitchenOrderDto[]> {
        
        const webPedidos = await prisma.webpedidos.findMany({
            where: {
                tenant_id: tenantId,
                estado: {
                    notIn: [
                        webpedidos_estado.Entregado, 
                        webpedidos_estado.Cancelado, 
                        webpedidos_estado.ListoParaRecoger,
                        webpedidos_estado.EnCamino
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
                                                }            },
        });
        
        const webPedidosFiltrados = webPedidos.filter(
            pedido => pedido.webpedidos_detalles.length > 0
        );
        
        const posOrdenes = await ordenesPosService.getOrdenesActivasParaCocina(tenantId);

        const webDtos = webPedidosFiltrados.map(this.mapWebPedidoToDto);
        const posDtos = posOrdenes.map(ordenesPosService.mapOrdenToDto);

        const todosLosPedidos = [...webDtos, ...posDtos];
        
        todosLosPedidos.sort((a, b) => {
            const estadoOrder: Record<string, number> = {
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

    async actualizarEstadoPedido(
        tenantId: number, 
        pedidoId: number, 
        nuevoEstado: webpedidos_estado
    ): Promise<any> {
        const pedido = await prisma.webpedidos.findFirst({
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
        
        const pedidoActualizado = await prisma.webpedidos.update({
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

    async crearWebPedido(tenantId: number, datos: any): Promise<WebPedidoPrisma> {
        const numeroPedido = `WEB-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

        const nuevoPedido = await prisma.$transaction(async (tx) => {
            
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
                    estado: webpedidos_estado.Pendiente,
                }
            });

            await tx.webpedidos_detalles.createMany({
                data: datos.items.map((item: any) => ({
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