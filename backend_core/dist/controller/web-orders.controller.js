"use strict";
// src/controller/web-orders.controller.ts
// ✅ VERSIÓN FINAL CON VALIDACIONES Y MANEJO CORRECTO DE DECIMAL
Object.defineProperty(exports, "__esModule", { value: true });
exports.webOrdersController = void 0;
const web_orders_service_1 = require("../services/web-orders.service");
const email_service_1 = require("../services/email.service");
const cierre_pos_service_1 = require("../services/cierre-pos.service");
const tenant_config_service_1 = require("../services/tenant-config.service");
const notification_service_1 = require("../services/notification.service");
const client_1 = require("@prisma/client");
// ========== HELPER: Convertir Decimal a number ==========
function toNumber(value) {
    if (typeof value === 'number')
        return value;
    return value.toNumber();
}
exports.webOrdersController = {
    // Obtener todos los pedidos web del tenant (ADMIN)
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
            res.json({
                success: true,
                orders,
                count: orders.length
            });
        }
        catch (error) {
            console.error('Error en getWebOrders:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor al obtener pedidos'
            });
        }
    },
    // Obtener detalle de pedido específico (ADMIN)
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
            res.json({
                success: true,
                order
            });
        }
        catch (error) {
            console.error('Error en getWebOrderDetail:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor al obtener el pedido'
            });
        }
    },
    // Crear pedido desde la web pública (PÚBLICO) - ✅ CON VALIDACIONES
    async createWebOrder(req, res) {
        try {
            const tenant = req.tenant;
            if (!tenant) {
                return res.status(404).json({ error: 'Tenant no encontrado' });
            }
            const tenantId = tenant.id;
            const { cliente_nombre, cliente_email, cliente_telefono, tipo_pedido, direccion_entrega, instrucciones_entrega, hora_programada, notas_especiales, notas, items } = req.body;
            console.log(`\n🌐 [WEB-PEDIDO] Nuevo pedido web para tenant: ${tenant.subdominio}`);
            // ========== VALIDACIONES BÁSICAS ==========
            if (!cliente_nombre || !cliente_telefono || !items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({
                    error: 'Datos incompletos: nombre, teléfono y al menos un producto son requeridos'
                });
            }
            if (tipo_pedido === 'EntregaDomicilio' && !direccion_entrega) {
                return res.status(400).json({
                    error: 'Dirección de entrega requerida para entrega a domicilio'
                });
            }
            // ========== 🔒 VALIDACIÓN 1: PEDIDOS ONLINE ACTIVOS ==========
            const activo = await tenant_config_service_1.tenantConfigService.verificarPedidosOnlineActivos(tenantId);
            if (!activo) {
                console.log(`❌ [WEB-PEDIDO] Pedidos online desactivados`);
                return res.status(403).json({
                    success: false,
                    error: 'PEDIDOS_WEB_DESACTIVADOS',
                    message: 'Los pedidos online están temporalmente desactivados. Por favor, intenta más tarde.'
                });
            }
            // ========== 🕐 VALIDACIÓN 2: HORARIO DE ATENCIÓN ==========
            const horarioCheck = await tenant_config_service_1.tenantConfigService.verificarHorarioPedidosWeb(tenantId);
            if (!horarioCheck.dentroDeHorario) {
                console.log(`❌ [WEB-PEDIDO] Fuera de horario: ${horarioCheck.horaActual}`);
                return res.status(403).json({
                    success: false,
                    error: 'FUERA_DE_HORARIO',
                    message: `Horario de atención: ${horarioCheck.horario.inicio} - ${horarioCheck.horario.fin}`,
                    horario: horarioCheck.horario,
                    hora_actual: horarioCheck.horaActual
                });
            }
            // ========== 💰 CALCULAR SUBTOTAL Y VALIDAR MONTO MÍNIMO ==========
            const config = await tenant_config_service_1.tenantConfigService.getPedidosWebConfig(tenantId);
            // Calcular subtotal de los items
            let subtotal = 0;
            for (const item of items) {
                const precio = Number(item.precio) || 0;
                const cantidad = Number(item.cantidad) || 0;
                subtotal += precio * cantidad;
            }
            const montoMinimo = toNumber(config.monto_minimo_pedido);
            if (subtotal < montoMinimo) {
                console.log(`❌ [WEB-PEDIDO] Monto insuficiente: S/${subtotal} < S/${montoMinimo}`);
                return res.status(400).json({
                    success: false,
                    error: 'MONTO_MINIMO_NO_ALCANZADO',
                    message: `El monto mínimo de pedido es S/ ${montoMinimo.toFixed(2)}`,
                    monto_minimo: montoMinimo,
                    monto_actual: subtotal,
                    faltante: montoMinimo - subtotal
                });
            }
            // ========== 🚚 CÁLCULO DE COSTO DE DELIVERY ==========
            const costoEnvio = tipo_pedido === 'EntregaDomicilio'
                ? toNumber(config.costo_delivery)
                : 0;
            const total = subtotal + costoEnvio;
            console.log(`✅ [WEB-PEDIDO] Validaciones pasadas. Creando pedido...`);
            console.log(`   - Subtotal: S/ ${subtotal.toFixed(2)}`);
            console.log(`   - Envío: S/ ${costoEnvio.toFixed(2)}`);
            console.log(`   - Total: S/ ${total.toFixed(2)}`);
            // ========== ⏱️ CALCULAR TIEMPO ESTIMADO ==========
            const tiempoEstimado = await tenant_config_service_1.tenantConfigService.calcularTiempoEstimado(tenantId, true);
            // ========== 📝 CREAR PEDIDO ==========
            const newOrder = await web_orders_service_1.webOrdersService.createWebOrder(tenant.id, {
                cliente_nombre,
                cliente_email,
                cliente_telefono,
                tipo_pedido,
                direccion_entrega,
                instrucciones_entrega,
                hora_programada,
                notas_especiales,
                notas,
                items
            });
            console.log(`✅ [WEB-PEDIDO] Pedido creado: #${newOrder.numero_pedido}`);
            // ========== 📧 NOTIFICAR POR EMAIL - NUEVO PEDIDO ==========
            const configNotif = await tenant_config_service_1.tenantConfigService.getNotificacionesConfig(tenantId);
            if (configNotif.email_nuevos_pedidos) {
                try {
                    await notification_service_1.notificationService.notificarNuevoPedidoWeb(tenantId, {
                        numero_pedido: newOrder.numero_pedido,
                        cliente_nombre: newOrder.cliente_nombre,
                        total: toNumber(newOrder.total),
                        tipo_pedido: newOrder.tipo_pedido
                    });
                    console.log(`📧 [WEB-PEDIDO] Email enviado a: ${configNotif.email_nuevos_pedidos}`);
                }
                catch (emailError) {
                    console.error('⚠️ Error al enviar email de nuevo pedido (no crítico):', emailError);
                }
            }
            // Obtener configuración para email de confirmación al cliente
            const tenantConfig = await web_orders_service_1.webOrdersService.getOrderConfig(tenant.id);
            // Enviar email de confirmación si está habilitado
            if (tenantConfig.notif_pedido_confirmado && cliente_email) {
                try {
                    await email_service_1.emailService.sendOrderConfirmation(newOrder, tenantConfig);
                    console.log(`📧 [WEB-PEDIDO] Email de confirmación enviado al cliente`);
                }
                catch (emailError) {
                    console.error('Error al enviar email de confirmación:', emailError);
                }
            }
            res.status(201).json({
                success: true,
                message: 'Pedido creado exitosamente',
                order: newOrder,
                tiempo_estimado: {
                    minutos: tiempoEstimado.minutos,
                    hora_estimada: tiempoEstimado.horaEstimada
                }
            });
        }
        catch (error) {
            console.error('Error en createWebOrder:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Error interno del servidor al crear el pedido'
            });
        }
    },
    // ✅ Cambiar estado del pedido (ADMIN) - CON VALIDACIÓN DE CAJA
    async updateOrderStatus(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = req.user?.id;
            const orderId = parseInt(req.params.id);
            const { nuevo_estado, razon_cancelacion } = req.body;
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso no autorizado' });
            }
            if (!empleadoId) {
                return res.status(401).json({ error: 'Usuario no identificado' });
            }
            console.log(`📡 [WEB-ORDER] Cambio de estado para Pedido #${orderId}: ${nuevo_estado}`);
            if (!nuevo_estado) {
                return res.status(400).json({ error: 'Nuevo estado requerido' });
            }
            if (!web_orders_service_1.webOrdersService.isValidOrderStatus(nuevo_estado)) {
                return res.status(400).json({
                    error: 'Estado inválido',
                    estados_validos: Object.values(web_orders_service_1.webpedidos_estado)
                });
            }
            // ========== 🔒 VALIDACIÓN CRÍTICA: CAJA ABIERTA SOLO PARA "Entregado" ==========
            if (nuevo_estado === web_orders_service_1.webpedidos_estado.Entregado) {
                console.log(`🔍 [WEB-ORDER] Estado "Entregado" detectado. Verificando caja abierta...`);
                const cajaAbierta = await cierre_pos_service_1.cierrePosService.verificarCajaAbierta(tenantId, empleadoId);
                if (!cajaAbierta) {
                    console.error(`❌ [WEB-ORDER] NO hay caja abierta. BLOQUEANDO entrega del pedido #${orderId}`);
                    return res.status(400).json({
                        success: false,
                        error: 'No se puede marcar como Entregado',
                        message: 'Debe haber una caja abierta para finalizar pedidos web.',
                        codigo: 'CAJA_NO_ABIERTA',
                        accion_requerida: 'Abrir Caja'
                    });
                }
                console.log(`✅ [WEB-ORDER] Caja #${cajaAbierta.id} está abierta. Procediendo...`);
                // ========== 💰 REGISTRAR VENTA EN CAJA ==========
                console.log(`💰 [WEB-ORDER] Registrando venta en caja para pedido #${orderId}...`);
                try {
                    const pedidoParaCaja = await web_orders_service_1.webOrdersService.getWebOrderById(tenantId, orderId);
                    if (!pedidoParaCaja) {
                        return res.status(404).json({ error: 'Pedido no encontrado' });
                    }
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
                    console.log(`✅ [WEB-ORDER] Venta registrada en caja: S/ ${montoTotal.toFixed(2)}`);
                }
                catch (cajaError) {
                    console.error('❌ [WEB-ORDER] Error al registrar venta en caja:', cajaError);
                    return res.status(500).json({
                        success: false,
                        error: 'Error al registrar la venta en caja',
                        details: cajaError.message
                    });
                }
                // ========== 📦 DESCONTAR INVENTARIO ==========
                console.log(`📦 [WEB-ORDER] Descontando inventario para pedido #${orderId}...`);
                try {
                    await web_orders_service_1.webOrdersService.processInventoryDeduction(tenantId, orderId, empleadoId);
                    console.log(`✅ [WEB-ORDER] Inventario descontado correctamente`);
                }
                catch (invError) {
                    console.error('❌ [WEB-ORDER] Error al descontar inventario:', invError);
                    return res.status(500).json({
                        success: false,
                        error: 'Error al actualizar el inventario',
                        details: invError.message
                    });
                }
            }
            else {
                console.log(`ℹ️ [WEB-ORDER] Estado "${nuevo_estado}" no requiere validación de caja.`);
            }
            // ========== 📝 ACTUALIZAR ESTADO DEL PEDIDO ==========
            const updatedOrder = await web_orders_service_1.webOrdersService.updateOrderStatus(tenantId, orderId, nuevo_estado);
            console.log(`✅ [WEB-ORDER] Estado actualizado a: ${nuevo_estado}`);
            // ========== 📧 NOTIFICACIONES POR EMAIL ==========
            const tenantConfig = await web_orders_service_1.webOrdersService.getOrderConfig(tenantId);
            if (updatedOrder.cliente_email) {
                try {
                    switch (nuevo_estado) {
                        case web_orders_service_1.webpedidos_estado.Confirmado:
                            if (tenantConfig.notif_pedido_confirmado) {
                                await email_service_1.emailService.sendOrderConfirmation(updatedOrder, tenantConfig);
                                console.log(`📧 [WEB-ORDER] Email de confirmación enviado`);
                            }
                            break;
                        case web_orders_service_1.webpedidos_estado.Cancelado:
                            if (tenantConfig.notif_pedido_cancelado) {
                                await email_service_1.emailService.sendOrderCancellation(updatedOrder, tenantConfig, razon_cancelacion);
                                console.log(`📧 [WEB-ORDER] Email de cancelación enviado`);
                            }
                            break;
                        case web_orders_service_1.webpedidos_estado.ListoParaRecoger:
                            if (tenantConfig.notif_pedido_listo) {
                                await email_service_1.emailService.sendOrderReady(updatedOrder, tenantConfig);
                                console.log(`📧 [WEB-ORDER] Email de pedido listo enviado`);
                            }
                            break;
                    }
                }
                catch (emailError) {
                    console.error('⚠️ [WEB-ORDER] Error al enviar email (no crítico):', emailError);
                }
            }
            res.json({
                success: true,
                message: `Estado del pedido actualizado a ${nuevo_estado}`,
                order: updatedOrder
            });
        }
        catch (error) {
            console.error('❌ [WEB-ORDER] Error en updateOrderStatus:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Error interno del servidor al actualizar el estado'
            });
        }
    },
    // Convertir pedido web a orden POS (ADMIN)
    async convertToPosOrder(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = req.user?.id;
            const orderId = parseInt(req.params.id);
            if (!tenantId || !empleadoId) {
                return res.status(403).json({ error: 'Acceso no autorizado' });
            }
            const posOrder = await web_orders_service_1.webOrdersService.convertToPosOrder(tenantId, orderId, empleadoId);
            res.json({
                success: true,
                message: 'Pedido convertido a orden POS exitosamente',
                posOrder
            });
        }
        catch (error) {
            console.error('Error en convertToPosOrder:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Error interno del servidor al convertir el pedido'
            });
        }
    },
    // Obtener configuración de pedidos (ADMIN)
    async getOrderConfig(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso no autorizado' });
            }
            const config = await web_orders_service_1.webOrdersService.getOrderConfig(tenantId);
            res.json({
                success: true,
                config
            });
        }
        catch (error) {
            console.error('Error en getOrderConfig:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor al obtener configuración'
            });
        }
    },
    // Actualizar configuración de pedidos (ADMIN)
    async updateOrderConfig(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const configData = req.body;
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso no autorizado' });
            }
            const updatedConfig = await web_orders_service_1.webOrdersService.updateOrderConfig(tenantId, configData);
            res.json({
                success: true,
                message: 'Configuración actualizada exitosamente',
                config: updatedConfig
            });
        }
        catch (error) {
            console.error('Error en updateOrderConfig:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor al actualizar configuración'
            });
        }
    },
    // Obtener estadísticas de pedidos (ADMIN)
    async getOrderStats(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso no autorizado' });
            }
            const stats = await web_orders_service_1.webOrdersService.getOrderStats(tenantId);
            res.json({
                success: true,
                stats
            });
        }
        catch (error) {
            console.error('Error en getOrderStats:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor al obtener estadísticas'
            });
        }
    },
    // 🆕 Obtener configuración pública para el catálogo web (PÚBLICO)
    async getPublicConfig(req, res) {
        try {
            const tenant = req.tenant;
            if (!tenant) {
                return res.status(404).json({ error: 'Tenant no encontrado' });
            }
            const config = await tenant_config_service_1.tenantConfigService.getPedidosWebConfig(tenant.id);
            const horarioCheck = await tenant_config_service_1.tenantConfigService.verificarHorarioPedidosWeb(tenant.id);
            res.json({
                success: true,
                config: {
                    pedidos_activos: config.pedidos_online_activos,
                    horario: horarioCheck.horario,
                    dentro_de_horario: horarioCheck.dentroDeHorario,
                    monto_minimo: toNumber(config.monto_minimo_pedido),
                    costo_delivery: toNumber(config.costo_delivery),
                    tiempo_preparacion: config.tiempo_prep_web,
                    mensaje_bienvenida: config.mensaje_bienvenida_web,
                    reservas_activas: config.reservas_activas,
                    dias_limite_reserva: config.dias_limite_reserva
                }
            });
        }
        catch (error) {
            console.error('Error en getPublicConfig:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener configuración'
            });
        }
    }
};
