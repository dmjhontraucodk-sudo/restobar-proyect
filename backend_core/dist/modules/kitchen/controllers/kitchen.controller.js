"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kitchenController = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const pedidos_web_flow_service_1 = require("@modules/orders/services/pedidos-web-flow.service");
const ordenes_pos_service_1 = require("@modules/orders/services/ordenes-pos.service");
// Esquema Zod para actualizar el estado
const updateEstadoSchema = zod_1.z.object({
    estado: zod_1.z.nativeEnum(client_1.webpedidos_estado),
});
exports.kitchenController = {
    /**
    * GET /api/dashboard/cocina/pedidos - Obtiene los pedidos para la interfaz de Cocina (UNIFICADO).
    */
    async getPedidosCocina(req, res) {
        try {
            const request = req;
            const tenantId = request.user?.tenant_id;
            if (!tenantId || tenantId !== request.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            // El servicio devuelve la lista unificada (Web + POS)
            const pedidos = await pedidos_web_flow_service_1.pedidosWebFlowService.obtenerPedidosParaCocina(tenantId);
            return res.status(200).json(pedidos);
        }
        catch (error) {
            console.error('Error en getPedidosCocina:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    },
    /**
    * PATCH /api/dashboard/cocina/pedidos/:id/estado - Actualiza el estado de un pedido (acción del cocinero).
    */
    async updateEstadoPedido(req, res) {
        try {
            const request = req;
            const tenantId = request.user?.tenant_id;
            const idUnificado = req.params.id;
            if (!tenantId || tenantId !== request.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            // 1. Extraer el ID real y el tipo
            const [tipo, idStr] = idUnificado.split('-');
            const idNumerico = parseInt(idStr);
            if (isNaN(idNumerico) || !['W', 'P'].includes(tipo)) {
                return res.status(400).json({ error: 'ID de pedido unificado inválido.' });
            }
            // 2. Validación del estado con Zod
            const validation = updateEstadoSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Datos de estado inválidos',
                    details: validation.error.issues
                });
            }
            const { estado } = validation.data;
            let updatedPedido;
            // 3. Llamar al servicio correcto
            if (tipo === 'W') {
                updatedPedido = await pedidos_web_flow_service_1.pedidosWebFlowService.actualizarEstadoPedido(tenantId, idNumerico, estado);
            }
            else if (tipo === 'P') {
                updatedPedido = await ordenes_pos_service_1.ordenesPosService.actualizarEstadoOrdenPos(tenantId, idNumerico, estado);
            }
            return res.status(200).json(updatedPedido);
        }
        catch (error) {
            console.error('Error en updateEstadoPedido:', error);
            if (error.message.includes('no encontrado') || error.message.includes('not found')) {
                return res.status(404).json({ error: error.message });
            }
            if (error.message.includes('no pertenece') || error.message.includes('Acceso no autorizado')) {
                return res.status(403).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
    },
};
