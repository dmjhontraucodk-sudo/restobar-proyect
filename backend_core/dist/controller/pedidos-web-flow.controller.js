"use strict";
// src/controller/pedidos-web-flow.controller.ts
// ✅ CORREGIDO con manejo correcto de Decimal
Object.defineProperty(exports, "__esModule", { value: true });
exports.pedidosWebFlowController = void 0;
const pedidos_web_flow_service_1 = require("../services/pedidos-web-flow.service");
const tenant_config_service_1 = require("../services/tenant-config.service");
const notification_service_1 = require("../services/notification.service");
// ========== HELPER: Convertir Decimal a number ==========
function toNumber(value) {
    if (typeof value === 'number')
        return value;
    return value.toNumber();
}
exports.pedidosWebFlowController = {
    /**
     * Crear pedido web desde la página pública
     * CON VALIDACIONES DE CONFIGURACIÓN
     */
    async createWebOrder(req, res) {
        try {
            const tenant = req.tenant;
            if (!tenant) {
                return res.status(404).json({
                    success: false,
                    error: 'Tenant no encontrado'
                });
            }
            const tenantId = tenant.id;
            const { cliente_nombre, cliente_email, cliente_telefono, tipo_pedido, direccion_entrega, instrucciones_entrega, notas_especiales, items, subtotal } = req.body;
            console.log(`\n🌐 [WEB-PEDIDO] Nuevo pedido web para tenant: ${tenant.subdominio}`);
            // ========== VALIDACIONES BÁSICAS ==========
            if (!cliente_nombre || !cliente_telefono || !items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos incompletos: nombre, teléfono y productos son requeridos'
                });
            }
            if (tipo_pedido === 'EntregaDomicilio' && !direccion_entrega) {
                return res.status(400).json({
                    success: false,
                    error: 'Dirección de entrega requerida para delivery'
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
            // ========== 💰 VALIDACIÓN 3: MONTO MÍNIMO ==========
            const config = await tenant_config_service_1.tenantConfigService.getPedidosWebConfig(tenantId);
            const montoMinimo = toNumber(config.monto_minimo_pedido); // ⭐ Convertir Decimal
            // Asegurarse de que subtotal es un número
            const subtotalNumero = Number(subtotal) || 0;
            if (subtotalNumero < montoMinimo) {
                console.log(`❌ [WEB-PEDIDO] Monto insuficiente: S/${subtotalNumero} < S/${montoMinimo}`);
                return res.status(400).json({
                    success: false,
                    error: 'MONTO_MINIMO_NO_ALCANZADO',
                    message: `El monto mínimo de pedido es S/ ${montoMinimo.toFixed(2)}`,
                    monto_minimo: montoMinimo,
                    monto_actual: subtotalNumero,
                    faltante: montoMinimo - subtotalNumero
                });
            }
            // ========== 🚚 CÁLCULO DE COSTO DE DELIVERY ==========
            const costoEnvio = tipo_pedido === 'EntregaDomicilio'
                ? toNumber(config.costo_delivery) // ⭐ Convertir Decimal
                : 0;
            const total = subtotalNumero + costoEnvio;
            console.log(`✅ [WEB-PEDIDO] Validaciones pasadas. Creando pedido...`);
            console.log(`   - Subtotal: S/ ${subtotalNumero.toFixed(2)}`);
            console.log(`   - Envío: S/ ${costoEnvio.toFixed(2)}`);
            console.log(`   - Total: S/ ${total.toFixed(2)}`);
            // ========== ⏱️ CALCULAR TIEMPO ESTIMADO ==========
            const tiempoEstimado = await tenant_config_service_1.tenantConfigService.calcularTiempoEstimado(tenantId, true);
            // ========== 📝 CREAR PEDIDO ==========
            const newOrder = await pedidos_web_flow_service_1.pedidosWebFlowService.crearWebPedido(tenantId, {
                cliente_nombre,
                cliente_email,
                cliente_telefono,
                tipo_pedido,
                direccion_entrega,
                instrucciones_entrega,
                notas_especiales,
                items,
                subtotal: subtotalNumero,
                costo_envio: costoEnvio,
                total
            });
            console.log(`✅ [WEB-PEDIDO] Pedido creado: #${newOrder.numero_pedido}`);
            // ========== 📧 NOTIFICAR POR EMAIL (si está configurado) ==========
            const configNotif = await tenant_config_service_1.tenantConfigService.getNotificacionesConfig(tenantId);
            if (configNotif.email_nuevos_pedidos) {
                try {
                    await notification_service_1.notificationService.notificarNuevoPedidoWeb(tenantId, {
                        numero_pedido: newOrder.numero_pedido,
                        cliente_nombre: newOrder.cliente_nombre,
                        total: toNumber(newOrder.total), // ⭐ Convertir Decimal
                        tipo_pedido: newOrder.tipo_pedido
                    });
                    console.log(`📧 [WEB-PEDIDO] Email de notificación enviado a: ${configNotif.email_nuevos_pedidos}`);
                }
                catch (emailError) {
                    console.error('⚠️ Error al enviar email (no crítico):', emailError);
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
            console.error('❌ [WEB-PEDIDO] Error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Error interno del servidor al crear el pedido'
            });
        }
    },
    /**
     * Obtener configuración pública para el catálogo web
     */
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
                    monto_minimo: toNumber(config.monto_minimo_pedido), // ⭐ Convertir Decimal
                    costo_delivery: toNumber(config.costo_delivery), // ⭐ Convertir Decimal
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
