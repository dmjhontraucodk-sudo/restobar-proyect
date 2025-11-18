// backend_core/src/services/pedidos-web-flow.service.ts

import { prisma } from '../lib/prisma';
import { webpedidos_estado } from '@prisma/client';

export const pedidosWebFlowService = {
    
    /**
     * ✅ RECOMENDACIÓN: Implementar validación de tenant en actualizarEstadoPedido
     */
    async actualizarEstadoPedido(
        tenantId: number, 
        pedidoId: number, 
        nuevoEstado: webpedidos_estado
    ) {
        // ✅ IMPORTANTE: Verificar que el pedido pertenece al tenant
        const pedido = await prisma.webpedidos.findFirst({
            where: {
                id: pedidoId,
                tenant_id: tenantId // ✅ Validación de seguridad
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
            throw new Error('Pedido no encontrado o no pertenece a este tenant');
        }

        // Validar transiciones de estado permitidas (opcional pero recomendado)
        const transicionesValidas: Record<webpedidos_estado, webpedidos_estado[]> = {
            [webpedidos_estado.Pendiente]: [webpedidos_estado.EnPreparacion, webpedidos_estado.Cancelado],
            [webpedidos_estado.Confirmado]: [webpedidos_estado.EnPreparacion, webpedidos_estado.Cancelado],
            [webpedidos_estado.EnPreparacion]: [webpedidos_estado.ListoParaRecoger, webpedidos_estado.Cancelado],
            [webpedidos_estado.ListoParaRecoger]: [webpedidos_estado.EnCamino, webpedidos_estado.Entregado],
            [webpedidos_estado.EnCamino]: [webpedidos_estado.Entregado],
            [webpedidos_estado.Entregado]: [], // Estado final
            [webpedidos_estado.Cancelado]: [], // Estado final
        };

        const estadosPermitidos = transicionesValidas[pedido.estado] || [];
        
        if (!estadosPermitidos.includes(nuevoEstado)) {
            throw new Error(
                `No se puede cambiar de ${pedido.estado} a ${nuevoEstado}. ` +
                `Estados permitidos: ${estadosPermitidos.join(', ')}`
            );
        }

        // Actualizar el estado
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

    /**
     * Obtener pedidos para la vista de cocina
     */
    async obtenerPedidosParaCocina(tenantId: number) {
        // Obtener solo pedidos activos (no entregados ni cancelados)
        const pedidos = await prisma.webpedidos.findMany({
            where: {
                tenant_id: tenantId,
                estado: {
                    notIn: [webpedidos_estado.Entregado, webpedidos_estado.Cancelado]
                }
            },
            include: {
                webpedidos_detalles: {
                    include: {
                        productos: {
                            select: {
                                nombre: true
                            }
                        }
                    }
                }
            },
            orderBy: [
                { estado: 'asc' }, // Primero pendientes, luego en preparación, etc.
                { created_at: 'asc' } // Más antiguos primero
            ]
        });

        return pedidos;
    },

    /**
     * Crear un nuevo pedido web
     */
    async crearWebPedido(tenantId: number, datos: any) {
        // Generar número de pedido único
        const numeroPedido = `WEB-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

        // Crear pedido con transacción para garantizar consistencia
        const nuevoPedido = await prisma.$transaction(async (tx) => {
            // Crear el pedido
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

            // Crear los detalles del pedido
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


/* 
📝 NOTAS ADICIONALES:

1. **Validación de Estados**: Implementa las transiciones de estado permitidas
   para evitar cambios inválidos (ej: de Entregado a Pendiente).

2. **Logging y Auditoría**: Considera agregar logs de todos los cambios de estado
   para trazabilidad.

3. **Notificaciones**: Cuando cambies el estado, considera enviar notificaciones
   al cliente (email, SMS, etc.).

4. **Websockets**: Para una experiencia en tiempo real, considera usar WebSockets
   en lugar de polling cada 10 segundos.

5. **Rate Limiting**: Implementa rate limiting en los endpoints de actualización
   para prevenir abuso.
*/