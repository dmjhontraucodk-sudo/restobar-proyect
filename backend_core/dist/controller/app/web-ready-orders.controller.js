"use strict";
// backend_core/src/controller/app/web-ready-orders.controller.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.webReadyOrdersController = void 0;
const web_ready_orders_service_1 = require("../../services/web-ready-orders.service");
const zod_1 = require("zod");
const client_1 = require("@prisma/client"); // Importamos el ENUM de Prisma
// Esquema Zod para validar la actualización de estado
const updateStatusSchema = zod_1.z.object({
    // Usamos z.nativeEnum(PrismaEnum) para que Zod valide directamente contra el enum de Prisma
    nuevo_estado: zod_1.z.nativeEnum(client_1.webpedidos_estado).refine(val => 
    // Solo permitimos los estados relevantes para esta gestión: Entregado, Cancelado, EnCamino
    val === client_1.webpedidos_estado.Entregado ||
        val === client_1.webpedidos_estado.Cancelado ||
        val === client_1.webpedidos_estado.EnCamino, {
        message: "Estado inválido. Solo se permite 'Entregado', 'Cancelado' o 'EnCamino'.",
    }),
    razon_cancelacion: zod_1.z.string().optional(),
});
exports.webReadyOrdersController = {
    // ... getReadyOrders se mantiene igual ...
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
    /**
     * Cambia el estado de un pedido web (Entregado, Cancelado, EnCamino).
     */
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
            // Usamos el tipo validado por Zod, que garantiza que es uno de los tres estados.
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
