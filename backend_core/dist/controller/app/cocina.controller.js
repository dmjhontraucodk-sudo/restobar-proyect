"use strict";
// backend_core/src/controller/app/cocina.controller.ts (MODIFICADO)
Object.defineProperty(exports, "__esModule", { value: true });
exports.cocinaController = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const pedidos_web_flow_service_1 = require("../../services/pedidos-web-flow.service");
const ordenes_pos_service_1 = require("../../services/ordenes-pos.service"); // Importamos el nuevo servicio POS
// Esquema Zod para actualizar el estado (Debe ser un string que coincida con webpedidos_estado)
const updateEstadoSchema = zod_1.z.object({
    estado: zod_1.z.nativeEnum(client_1.webpedidos_estado),
});
exports.cocinaController = {
    /**
    * GET /api/dashboard/cocina/pedidos - Obtiene los pedidos para la interfaz de Cocina (UNIFICADO).
    */
    async getPedidosCocina(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            // ✅ El servicio ahora devuelve la lista unificada (Web + POS)
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
            const tenantId = req.user?.tenant_id;
            // ✅ El ID es ahora un string con prefijo (ej: "W-123" o "P-456")
            const idUnificado = req.params.id;
            if (!tenantId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            // 1. Extraer el ID real y el tipo
            const [tipo, idStr] = idUnificado.split('-');
            const idNumerico = parseInt(idStr);
            if (isNaN(idNumerico) || !['W', 'P'].includes(tipo)) {
                return res.status(400).json({ error: 'ID de pedido unificado inválido.' });
            }
            // 2. Validación del estado con Zod (usando webpedidos_estado, pero se pasa como string)
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
                updatedPedido = await ordenes_pos_service_1.ordenesPosService.actualizarEstadoOrdenPos(tenantId, idNumerico, estado // Pasamos el estado de webpedidos_estado, el servicio POS lo mapea si es necesario
                );
            }
            return res.status(200).json(updatedPedido);
        }
        catch (error) {
            // ... (Manejo de errores) ...
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
