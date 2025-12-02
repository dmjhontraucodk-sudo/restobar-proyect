"use strict";
// backend_core/src/services/pedidos-web-flow.service.ts (MODIFICADO)
Object.defineProperty(exports, "__esModule", { value: true });
exports.pedidosWebFlowService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const ordenes_pos_service_1 = require("./ordenes-pos.service"); // Importamos el nuevo servicio POS
// ====================================================================
exports.pedidosWebFlowService = {
    /**
     * Mapea un pedido web a la estructura unificada (KitchenOrderDto).
     */
    mapWebPedidoToDto(pedido) {
        return {
            // ✅ ID UNIFICADO: Prefijo 'W-' para Web
            id: `W-${pedido.id}`,
            numero_orden: pedido.numero_pedido,
            origen: 'WEB',
            estado: pedido.estado,
            cliente_mesa_nombre: pedido.cliente_nombre,
            items: pedido.webpedidos_detalles.map((detalle) => ({
                id_detalle: detalle.id,
                producto_nombre: detalle.productos.nombre,
                cantidad: detalle.cantidad,
                // El modelo webpedidos_detalles no tiene 'notas', se usa null.
                notas: pedido.notas_especiales,
            })),
            created_at: pedido.created_at,
            notas_especiales: pedido.notas_especiales,
        };
    },
    /**
     * Obtener y UNIFICAR pedidos (Web y POS) para la vista de cocina.
     */
    async obtenerPedidosParaCocina(tenantId) {
        // 1. OBTENER PEDIDOS WEB
        const webPedidos = await prisma_1.prisma.webpedidos.findMany({
            where: {
                tenant_id: tenantId,
                estado: {
                    // ✅ CAMBIO CLAVE: Excluimos ListoParaRecoger para que salte a Pedidos
                    notIn: [
                        client_1.webpedidos_estado.Entregado,
                        client_1.webpedidos_estado.Cancelado,
                        client_1.webpedidos_estado.ListoParaRecoger, // ✨ AÑADIDO: Mover a Pedidos
                        client_1.webpedidos_estado.EnCamino // ✨ OPCIONAL: Si ya salió a reparto
                    ]
                }
            },
            include: {
                webpedidos_detalles: {
                    where: {
                        productos: {
                            // Solo incluimos productos que NO tienen un producto de inventario asociado,
                            // asumiendo que estos son los que requieren PREPARACIÓN.
                            producto_inventario_id: null // ⬅️ FILTRO USANDO LA LÓGICA DE INVENTARIO
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
        // 2. OBTENER ÓRDENES POS (Mesa)
        const posOrdenes = [];
        // 3. MAPEO
        const webDtos = webPedidosFiltrados.map(this.mapWebPedidoToDto);
        const posDtos = posOrdenes.map(ordenes_pos_service_1.ordenesPosService.mapOrdenToDto);
        // 4. UNIFICACIÓN Y ORDENACIÓN
        const todosLosPedidos = [...webDtos, ...posDtos];
        // Lógica de ordenación: Primero por estado (Pendiente, EnPreparacion, Listo), luego por antigüedad
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
            return a.created_at.getTime() - b.created_at.getTime(); // Más antiguos primero
        });
        return todosLosPedidos;
    },
    /**
     * Actualiza el estado de un pedido web (MANTENIDO)
     */
    async actualizarEstadoPedido(tenantId, pedidoId, nuevoEstado) {
        // ... Lógica de actualización de webpedidos (sin cambios) ...
        const pedido = await prisma_1.prisma.webpedidos.findFirst({
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
            throw new Error('Pedido web no encontrado o no pertenece a este tenant');
        }
        // Aquí iría la lógica de transición de estados... (asumimos que la lógica es correcta)
        const pedidoActualizado = await prisma_1.prisma.webpedidos.update({
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
    // ... (otras funciones como crearWebPedido) ...
    // Note: Las funciones no relacionadas con la Cocina no se muestran para brevedad.
    async crearWebPedido(tenantId, datos) {
        // ... (Lógica de creación de pedido web) ...
        // Mantener la implementación original aquí.
        const numeroPedido = `WEB-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
        const nuevoPedido = await prisma_1.prisma.$transaction(async (tx) => {
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
