"use strict";
// backend_core/src/controller/app/cierre-pos.controller.ts - SIMPLIFICADO
Object.defineProperty(exports, "__esModule", { value: true });
exports.cierrePosController = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const cierre_pos_service_1 = require("../../services/cierre-pos.service");
// Esquema Zod para validar la data de cierre
const closeOrderPosSchema = zod_1.z.object({
    estado: zod_1.z.nativeEnum(client_1.ordenes_estado),
    monto_pago: zod_1.z.number().min(0, "El monto pagado debe ser válido."),
    metodo_pago: zod_1.z.string(),
    descuento_monto: zod_1.z.number().min(0).default(0).optional(),
    cliente_nombre: zod_1.z.string().optional(),
    cliente_telefono: zod_1.z.string().optional(),
}).refine(data => {
    return data.estado === client_1.ordenes_estado.Pagada || data.estado === client_1.ordenes_estado.Cerrada;
}, {
    message: "El estado final debe ser Pagada o Cerrada.",
    path: ["estado"],
}).strict();
// Función de mapeo para métodos de pago
const mapMetodoPago = (metodo) => {
    switch (metodo.toUpperCase()) {
        case 'EFECTIVO': return client_1.pagos_metodo_pago.Efectivo;
        case 'TARJETA': return client_1.pagos_metodo_pago.Tarjeta;
        case 'TRANSFERENCIA': return client_1.pagos_metodo_pago.Transferencia;
        case 'QR':
        case 'OTRO':
        default:
            return client_1.pagos_metodo_pago.Otro;
    }
};
exports.cierrePosController = {
    async closeOrder(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = req.user?.id;
            const ordenId = parseInt(req.params.id);
            console.log(`🔥 [POS CONTROLLER] Intentando cerrar orden #${ordenId}`);
            if (!tenantId || !empleadoId || isNaN(ordenId)) {
                return res.status(400).json({ error: 'Datos de orden o sesión inválidos.' });
            }
            // Validar datos del body
            const validation = closeOrderPosSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Datos de cierre inválidos.',
                    details: validation.error.issues
                });
            }
            const data = validation.data;
            const metodoPagoDB = mapMetodoPago(data.metodo_pago);
            const cierreData = {
                estado: data.estado,
                monto_pago: data.monto_pago,
                metodo_pago: metodoPagoDB,
                descuento_monto: data.descuento_monto,
                cliente_nombre: data.cliente_nombre,
                cliente_telefono: data.cliente_telefono,
            };
            // ✅ LLAMAR AL SERVICIO CENTRALIZADO
            const ordenCerrada = await cierre_pos_service_1.cierrePosService.closeOrder(tenantId, empleadoId, ordenId, cierreData);
            return res.status(200).json({
                success: true,
                message: 'Orden cerrada, caja actualizada e inventario descontado.',
                orden: ordenCerrada
            });
        }
        catch (error) {
            console.error('❌ Error en cierrePosController.closeOrder:', error);
            return res.status(400).json({
                error: error.message || 'Error al procesar el cierre de cuenta.'
            });
        }
    }
};
