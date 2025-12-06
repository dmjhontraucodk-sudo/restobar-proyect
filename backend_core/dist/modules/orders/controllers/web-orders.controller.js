"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webOrdersController = void 0;
const web_orders_service_1 = require("../services/web-orders.service");
const email_service_1 = require("@core/email/email.service");
const cierre_pos_service_1 = require("@modules/finance/services/cierre-pos.service");
// Comenta o elimina esta línea:
// import { notificationService } from '@core/notifications/notification.service';
const client_1 = require("@prisma/client");
function toNumber(value) {
    if (typeof value === 'number')
        return value;
    return value.toNumber();
}
exports.webOrdersController = {
    async getWebOrders(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const { estado } = req.query;
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso no autorizado' });
            }
            const filters = {};
            if (estado && typeof estado === 'string' && web_orders_service_1.webOrdersService.isValidOrderStatus(estado)) {
                filters.estado = estado;
            }
            const orders = await web_orders_service_1.webOrdersService.getWebOrdersByTenant(tenantId, filters);
            return res.json({
                success: true,
                orders,
                count: orders.length
            });
        }
        catch (error) {
            console.error('Error en getWebOrders:', error);
            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor al obtener pedidos'
            });
        }
    },
    async getWebOrderDetail(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const orderId = parseInt(req.params.id);
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso no autorizado' });
            }
            const order = await web_orders_service_1.webOrdersService.getWebOrderById(tenantId, orderId);
            if (!order) {
                return res.status(404).json({ error: 'Pedido no encontrado' });
            }
            return res.json({
                success: true,
                order
            });
        }
        catch (error) {
            console.error('Error en getWebOrderDetail:', error);
            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor al obtener el pedido'
            });
        }
    },
    async updateOrderStatus(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = req.user?.id;
            const orderId = parseInt(req.params.id);
            const { nuevo_estado, razon_cancelacion } = req.body;
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso no autorizado' });
            if (!empleadoId)
                return res.status(401).json({ error: 'Usuario no identificado' });
            if (!nuevo_estado)
                return res.status(400).json({ error: 'Nuevo estado requerido' });
            if (!web_orders_service_1.webOrdersService.isValidOrderStatus(nuevo_estado)) {
                return res.status(400).json({
                    error: 'Estado inválido',
                    estados_validos: Object.values(web_orders_service_1.webpedidos_estado)
                });
            }
            if (nuevo_estado === web_orders_service_1.webpedidos_estado.Entregado) {
                const cajaAbierta = await cierre_pos_service_1.cierrePosService.verificarCajaAbierta(tenantId, empleadoId);
                if (!cajaAbierta) {
                    return res.status(400).json({
                        success: false,
                        error: 'No se puede marcar como Entregado',
                        message: 'Debe haber una caja abierta para finalizar pedidos web.',
                        codigo: 'CAJA_NO_ABIERTA',
                        accion_requerida: 'Abrir Caja'
                    });
                }
                try {
                    const pedidoParaCaja = await web_orders_service_1.webOrdersService.getWebOrderById(tenantId, orderId);
                    if (!pedidoParaCaja)
                        return res.status(404).json({ error: 'Pedido no encontrado' });
                    const metodoPago = client_1.pagos_metodo_pago.Efectivo;
                    const montoTotal = toNumber(pedidoParaCaja.total);
                    await cierre_pos_service_1.cierrePosService.registrarVentaEnCaja({
                        tenantId,
                        empleadoId,
                        ordenId: orderId,
                        monto: montoTotal,
                        metodoPago: metodoPago,
                        tipoDocumento: 'WebPedido'
                    });
                }
                catch (cajaError) {
                    return res.status(500).json({
                        success: false,
                        error: 'Error al registrar la venta en caja',
                        details: cajaError.message
                    });
                }
                try {
                    await web_orders_service_1.webOrdersService.processInventoryDeduction(tenantId, orderId, empleadoId);
                }
                catch (invError) {
                    return res.status(500).json({
                        success: false,
                        error: 'Error al actualizar el inventario',
                        details: invError.message
                    });
                }
            }
            const updatedOrder = await web_orders_service_1.webOrdersService.updateOrderStatus(tenantId, orderId, nuevo_estado);
            const tenantConfig = await web_orders_service_1.webOrdersService.getOrderConfig(tenantId);
            if (updatedOrder.cliente_email) {
                try {
                    switch (nuevo_estado) {
                        case web_orders_service_1.webpedidos_estado.Confirmado:
                            if (tenantConfig.notif_pedido_confirmado) {
                                await email_service_1.emailService.sendOrderConfirmation(updatedOrder, tenantConfig);
                            }
                            break;
                        case web_orders_service_1.webpedidos_estado.Cancelado:
                            if (tenantConfig.notif_pedido_cancelado) {
                                await email_service_1.emailService.sendOrderCancellation(updatedOrder, tenantConfig, razon_cancelacion);
                            }
                            break;
                        case web_orders_service_1.webpedidos_estado.ListoParaRecoger:
                            if (tenantConfig.notif_pedido_listo) {
                                await email_service_1.emailService.sendOrderReady(updatedOrder, tenantConfig);
                            }
                            break;
                    }
                }
                catch (emailError) {
                    console.error('⚠️ Error al enviar email (no crítico):', emailError);
                }
            }
            return res.json({
                success: true,
                message: `Estado del pedido actualizado a ${nuevo_estado}`,
                order: updatedOrder
            });
        }
        catch (error) {
            console.error('❌ Error en updateOrderStatus:', error);
            return res.status(500).json({
                success: false,
                error: error.message || 'Error interno del servidor al actualizar el estado'
            });
        }
    },
    async convertToPosOrder(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = req.user?.id;
            const orderId = parseInt(req.params.id);
            if (!tenantId || !empleadoId) {
                return res.status(403).json({ error: 'Acceso no autorizado' });
            }
            const posOrder = await web_orders_service_1.webOrdersService.convertToPosOrder(tenantId, orderId, empleadoId);
            return res.json({
                success: true,
                message: 'Pedido convertido a orden POS exitosamente',
                posOrder
            });
        }
        catch (error) {
            console.error('Error en convertToPosOrder:', error);
            return res.status(500).json({
                success: false,
                error: error.message || 'Error interno del servidor al convertir el pedido'
            });
        }
    },
    async getOrderConfig(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso no autorizado' });
            }
            const config = await web_orders_service_1.webOrdersService.getOrderConfig(tenantId);
            return res.json({
                success: true,
                config
            });
        }
        catch (error) {
            console.error('Error en getOrderConfig:', error);
            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor al obtener configuración'
            });
        }
    },
    async updateOrderConfig(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const configData = req.body;
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso no autorizado' });
            }
            const updatedConfig = await web_orders_service_1.webOrdersService.updateOrderConfig(tenantId, configData);
            return res.json({
                success: true,
                message: 'Configuración actualizada exitosamente',
                config: updatedConfig
            });
        }
        catch (error) {
            console.error('Error en updateOrderConfig:', error);
            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor al actualizar configuración'
            });
        }
    },
    async getOrderStats(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso no autorizado' });
            }
            const stats = await web_orders_service_1.webOrdersService.getOrderStats(tenantId);
            return res.json({
                success: true,
                stats
            });
        }
        catch (error) {
            console.error('Error en getOrderStats:', error);
            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor al obtener estadísticas'
            });
        }
    }
};
