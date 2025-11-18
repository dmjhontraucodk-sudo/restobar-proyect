"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webOrdersService = exports.webpedidos_tipo = exports.webpedidos_estado = void 0;
// src/services/web-orders.service.ts - VERSIÓN CORREGIDA PARA ERRORES DE TIPOS
const prisma_1 = require("../lib/prisma");
// Definir enums manualmente hasta que Prisma los genere
var webpedidos_estado;
(function (webpedidos_estado) {
    webpedidos_estado["Pendiente"] = "Pendiente";
    webpedidos_estado["Confirmado"] = "Confirmado";
    webpedidos_estado["EnPreparacion"] = "EnPreparacion";
    webpedidos_estado["ListoParaRecoger"] = "ListoParaRecoger";
    webpedidos_estado["EnCamino"] = "EnCamino";
    webpedidos_estado["Entregado"] = "Entregado";
    webpedidos_estado["Cancelado"] = "Cancelado";
})(webpedidos_estado || (exports.webpedidos_estado = webpedidos_estado = {}));
var webpedidos_tipo;
(function (webpedidos_tipo) {
    webpedidos_tipo["RecogerEnTienda"] = "RecogerEnTienda";
    webpedidos_tipo["EntregaDomicilio"] = "EntregaDomicilio";
})(webpedidos_tipo || (exports.webpedidos_tipo = webpedidos_tipo = {}));
exports.webOrdersService = {
    // ==================== OBTENER PEDIDOS ====================
    /**
     * Obtener todos los pedidos web de un tenant con filtros opcionales
     */
    async getWebOrdersByTenant(tenantId, filters) {
        const where = { tenant_id: tenantId };
        if (filters?.estado) {
            where.estado = filters.estado;
        }
        return await prisma_1.prisma.webpedidos.findMany({
            where,
            include: {
                webpedidos_detalles: {
                    include: {
                        productos: {
                            select: {
                                id: true,
                                nombre: true,
                                precio: true,
                                foto_url: true,
                                descripcion: true
                            }
                        }
                    }
                },
                clientes: true,
                ordenes: {
                    include: {
                        pagos: true
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });
    },
    /**
     * Obtener un pedido web específico por ID
     */
    async getWebOrderById(tenantId, orderId) {
        return await prisma_1.prisma.webpedidos.findFirst({
            where: {
                id: orderId,
                tenant_id: tenantId
            },
            include: {
                webpedidos_detalles: {
                    include: {
                        productos: {
                            select: {
                                id: true,
                                nombre: true,
                                descripcion: true,
                                precio: true,
                                foto_url: true
                            }
                        }
                    }
                },
                clientes: true,
                ordenes: {
                    include: {
                        pagos: true,
                        empleados: {
                            select: {
                                id: true,
                                nombre: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });
    },
    // ==================== CREAR PEDIDO ====================
    /**
     * Crear un nuevo pedido desde la web pública
     */
    async createWebOrder(tenantId, orderData) {
        const { cliente_nombre, cliente_email, cliente_telefono, tipo_pedido, direccion_entrega, instrucciones_entrega, hora_programada, notas_especiales, notas, items } = orderData;
        // Validar que haya items
        if (!items || items.length === 0) {
            throw new Error('El pedido debe contener al menos un producto');
        }
        // Validar productos y calcular totales
        const productIds = items.map(item => item.id);
        const productos = await prisma_1.prisma.productos.findMany({
            where: {
                id: { in: productIds },
                tenant_id: tenantId,
                disponible: true
            }
        });
        if (productos.length !== items.length) {
            throw new Error('Algunos productos no están disponibles');
        }
        // Calcular subtotal
        const subtotal = items.reduce((sum, item) => {
            return sum + (Number(item.precio) * Number(item.cantidad));
        }, 0);
        // Calcular costo de envío
        const config = await this.getOrderConfig(tenantId);
        let costoEnvio = 0;
        if (tipo_pedido === 'EntregaDomicilio') {
            costoEnvio = Number(config.costo_envio_estandar);
            // Envío gratis si supera cierto monto
            if (subtotal >= 50) {
                costoEnvio = 0;
            }
        }
        const total = subtotal + costoEnvio;
        // Verificar monto mínimo
        if (Number(config.monto_minimo_pedido) > 0 && subtotal < Number(config.monto_minimo_pedido)) {
            throw new Error(`El pedido mínimo es de $${config.monto_minimo_pedido}`);
        }
        // Generar número de pedido único
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        const numeroPedido = `RB-${timestamp}-${random}`;
        // Crear pedido en la base de datos
        return await prisma_1.prisma.webpedidos.create({
            data: {
                tenant_id: tenantId,
                cliente_nombre,
                cliente_email: cliente_email || null,
                cliente_telefono,
                tipo_pedido,
                numero_pedido: numeroPedido,
                subtotal,
                total,
                costo_envio: costoEnvio,
                direccion_entrega: tipo_pedido === 'EntregaDomicilio' ? direccion_entrega || null : null,
                instrucciones_entrega: instrucciones_entrega || null,
                hora_programada: hora_programada ? new Date(hora_programada) : null,
                notas_especiales: notas_especiales || null,
                notas: notas || null,
                estado: webpedidos_estado.Pendiente,
                webpedidos_detalles: {
                    create: items.map((item) => ({
                        tenant_id: tenantId,
                        producto_id: item.id,
                        cantidad: item.cantidad,
                        precio_unitario: item.precio,
                        subtotal: Number(item.precio) * Number(item.cantidad)
                    }))
                }
            },
            include: {
                webpedidos_detalles: {
                    include: {
                        productos: {
                            select: {
                                id: true,
                                nombre: true,
                                precio: true,
                                foto_url: true
                            }
                        }
                    }
                }
            }
        });
    },
    // ==================== ACTUALIZAR PEDIDO ====================
    /**
     * Cambiar el estado de un pedido
     */
    async updateOrderStatus(tenantId, orderId, newStatus) {
        // Validar que el estado sea válido
        if (!this.isValidOrderStatus(newStatus)) {
            throw new Error(`Estado inválido: ${newStatus}`);
        }
        // Verificar que el pedido existe y pertenece al tenant
        const existingOrder = await prisma_1.prisma.webpedidos.findFirst({
            where: {
                id: orderId,
                tenant_id: tenantId
            }
        });
        if (!existingOrder) {
            throw new Error('Pedido no encontrado');
        }
        // Actualizar estado
        return await prisma_1.prisma.webpedidos.update({
            where: {
                id: orderId
            },
            data: {
                estado: newStatus,
                updated_at: new Date()
            },
            include: {
                webpedidos_detalles: {
                    include: {
                        productos: {
                            select: {
                                id: true,
                                nombre: true,
                                precio: true,
                                foto_url: true
                            }
                        }
                    }
                }
            }
        });
    },
    // ==================== CONVERSIÓN A ORDEN POS ====================
    /**
     * Convertir un pedido web a una orden del sistema POS
     */
    async convertToPosOrder(tenantId, webOrderId, empleadoId) {
        // Obtener el pedido web completo
        const webOrder = await this.getWebOrderById(tenantId, webOrderId);
        if (!webOrder) {
            throw new Error('Pedido web no encontrado');
        }
        // Verificar que el pedido no haya sido convertido ya
        if (webOrder.ordenes && webOrder.ordenes.length > 0) {
            throw new Error('Este pedido ya fue convertido a una orden POS');
        }
        // Crear la orden en el sistema POS
        const posOrder = await prisma_1.prisma.ordenes.create({
            data: {
                tenant_id: tenantId,
                mesa_id: 1, // Mesa virtual para pedidos web
                empleado_id: empleadoId,
                estado: 'Abierta',
                subtotal: webOrder.subtotal,
                total: webOrder.total,
                webpedido_id: webOrderId,
                ordendetalles: {
                    create: webOrder.webpedidos_detalles.map((detalle) => ({
                        tenant_id: tenantId,
                        producto_id: detalle.producto_id,
                        cantidad: detalle.cantidad,
                        precio_unitario: detalle.precio_unitario
                    }))
                }
            },
            include: {
                ordendetalles: {
                    include: {
                        productos: true
                    }
                }
            }
        });
        // Actualizar estado del pedido web
        await this.updateOrderStatus(tenantId, webOrderId, webpedidos_estado.Confirmado);
        return posOrder;
    },
    // ==================== CONFIGURACIÓN ====================
    /**
     * Obtener la configuración de pedidos del tenant
     */
    async getOrderConfig(tenantId) {
        let config = await prisma_1.prisma.tenant_config_pedidos.findUnique({
            where: { tenant_id: tenantId }
        });
        // Crear configuración por defecto si no existe
        if (!config) {
            config = await prisma_1.prisma.tenant_config_pedidos.create({
                data: {
                    tenant_id: tenantId,
                    dias_limite_reserva: 2,
                    notif_pedido_confirmado: true,
                    notif_pedido_cancelado: true,
                    notif_pedido_listo: true,
                    email_asunto_confirmado: 'Confirmación de tu pedido',
                    email_asunto_cancelado: 'Actualización sobre tu pedido',
                    email_asunto_listo: '¡Tu pedido está listo!',
                    costo_envio_estandar: 0,
                    monto_minimo_pedido: 0,
                    tiempo_preparacion_promedio: 30,
                    horario_apertura: '08:00',
                    horario_cierre: '22:00'
                }
            });
        }
        return config;
    },
    /**
     * Actualizar la configuración de pedidos
     */
    async updateOrderConfig(tenantId, configData) {
        const existingConfig = await prisma_1.prisma.tenant_config_pedidos.findUnique({
            where: { tenant_id: tenantId }
        });
        if (existingConfig) {
            return await prisma_1.prisma.tenant_config_pedidos.update({
                where: { tenant_id: tenantId },
                data: configData
            });
        }
        else {
            return await prisma_1.prisma.tenant_config_pedidos.create({
                data: {
                    tenant_id: tenantId,
                    ...configData
                }
            });
        }
    },
    // ==================== UTILIDADES ====================
    /**
     * Calcular el costo de envío para un pedido
     */
    async calculateShippingCost(tenantId, subtotal, address) {
        const config = await this.getOrderConfig(tenantId);
        let costoEnvio = Number(config.costo_envio_estandar);
        // Envío gratis si supera cierto monto (configurable)
        if (subtotal >= 50) {
            costoEnvio = 0;
        }
        return costoEnvio;
    },
    /**
     * Validar un pedido antes de crearlo
     */
    async validateOrder(tenantId, items) {
        // Validar que haya items
        if (!items || items.length === 0) {
            throw new Error('El pedido debe contener al menos un producto');
        }
        // Obtener configuración
        const config = await this.getOrderConfig(tenantId);
        // Verificar disponibilidad de productos
        const productIds = items.map(item => item.id);
        const productos = await prisma_1.prisma.productos.findMany({
            where: {
                id: { in: productIds },
                tenant_id: tenantId,
                disponible: true
            }
        });
        if (productos.length !== items.length) {
            const availableIds = productos.map((p) => p.id);
            const unavailableIds = productIds.filter(id => !availableIds.includes(id));
            throw new Error(`Productos no disponibles: ${unavailableIds.join(', ')}`);
        }
        // Calcular subtotal con precios reales de la BD
        const subtotal = items.reduce((sum, item) => {
            const producto = productos.find((p) => p.id === item.id);
            const precio = producto ? Number(producto.precio) : 0;
            return sum + (precio * item.cantidad);
        }, 0);
        // Verificar monto mínimo
        if (Number(config.monto_minimo_pedido) > 0 && subtotal < Number(config.monto_minimo_pedido)) {
            throw new Error(`El pedido mínimo es de $${config.monto_minimo_pedido}`);
        }
        return {
            valid: true,
            subtotal,
            productos
        };
    },
    /**
     * Verificar si un estado es válido
     */
    isValidOrderStatus(status) {
        return Object.values(webpedidos_estado).includes(status);
    },
    /**
     * Verificar si un tipo de pedido es válido
     */
    isValidOrderType(type) {
        return Object.values(webpedidos_tipo).includes(type);
    },
    // ==================== ESTADÍSTICAS ====================
    /**
     * Obtener estadísticas generales de pedidos
     */
    async getOrderStats(tenantId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const [totalPedidos, pedidosHoy, pedidosPendientes, pedidosEnPreparacion, ventasHoy] = await Promise.all([
            // Total de pedidos históricos
            prisma_1.prisma.webpedidos.count({
                where: { tenant_id: tenantId }
            }),
            // Pedidos de hoy
            prisma_1.prisma.webpedidos.count({
                where: {
                    tenant_id: tenantId,
                    created_at: {
                        gte: today,
                        lt: tomorrow
                    }
                }
            }),
            // Pedidos pendientes
            prisma_1.prisma.webpedidos.count({
                where: {
                    tenant_id: tenantId,
                    estado: webpedidos_estado.Pendiente
                }
            }),
            // Pedidos en preparación
            prisma_1.prisma.webpedidos.count({
                where: {
                    tenant_id: tenantId,
                    estado: webpedidos_estado.EnPreparacion
                }
            }),
            // Ventas totales de hoy
            prisma_1.prisma.webpedidos.aggregate({
                where: {
                    tenant_id: tenantId,
                    created_at: {
                        gte: today,
                        lt: tomorrow
                    },
                    estado: {
                        notIn: [webpedidos_estado.Cancelado]
                    }
                },
                _sum: {
                    total: true
                }
            })
        ]);
        return {
            totalPedidos,
            pedidosHoy,
            pedidosPendientes,
            pedidosEnPreparacion,
            ventasHoy: Number(ventasHoy._sum.total || 0)
        };
    },
    /**
     * Obtener estadísticas por estado
     */
    async getOrderStatsByStatus(tenantId) {
        const stats = await prisma_1.prisma.webpedidos.groupBy({
            by: ['estado'],
            where: { tenant_id: tenantId },
            _count: {
                id: true
            },
            _sum: {
                total: true
            }
        });
        return stats.map((stat) => ({
            estado: stat.estado,
            cantidad: stat._count.id,
            totalVentas: Number(stat._sum.total || 0)
        }));
    },
    /**
     * Obtener pedidos recientes (últimos 10)
     */
    async getRecentOrders(tenantId, limit = 10) {
        return await prisma_1.prisma.webpedidos.findMany({
            where: { tenant_id: tenantId },
            include: {
                webpedidos_detalles: {
                    include: {
                        productos: {
                            select: {
                                id: true,
                                nombre: true,
                                precio: true
                            }
                        }
                    }
                }
            },
            orderBy: { created_at: 'desc' },
            take: limit
        });
    }
};
