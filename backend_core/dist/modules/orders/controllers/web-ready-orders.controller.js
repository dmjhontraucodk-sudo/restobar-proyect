"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webReadyOrdersController = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const web_ready_orders_service_1 = require("../services/web-ready-orders.service");
const updateStatusSchema = zod_1.z.object({
    nuevo_estado: zod_1.z.nativeEnum(client_1.webpedidos_estado),
    razon_cancelacion: zod_1.z.string().optional(),
});
exports.webReadyOrdersController = {
    async getReadyOrders(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso no autorizado' });
            }
            const orders = await web_ready_orders_service_1.webReadyOrdersService.getReadyOrders(tenantId);
            res.json({
                success: true,
                orders,
                count: orders.length
            });
        }
        catch (error) {
            console.error('Error en getReadyOrders:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Error interno del servidor al obtener pedidos web listos'
            });
        }
    },
    async updateStatus(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const orderId = parseInt(req.params.id);
            if (!tenantId || isNaN(orderId)) {
                return res.status(400).json({ error: 'Datos de pedido o sesión inválidos.' });
            }
            const validation = updateStatusSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Datos de estado inválidos.',
                    details: validation.error.issues
                });
            }
            const nuevoEstado = validation.data.nuevo_estado;
            const updatedOrder = await web_ready_orders_service_1.webReadyOrdersService.updateReadyOrderStatus(tenantId, orderId, nuevoEstado);
            res.json({
                success: true,
                message: `Estado del pedido actualizado a ${nuevoEstado}`,
                order: updatedOrder
            });
        }
        catch (error) {
            console.error('Error en updateReadyOrderStatus:', error);
            res.status(400).json({
                success: false,
                error: error.message || 'Error al actualizar el estado del pedido.'
            });
        }
    },
};
