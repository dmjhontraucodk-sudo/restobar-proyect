"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cierrePosController = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const cierre_pos_service_1 = require("../services/cierre-pos.service");
const closeOrderPosSchema = zod_1.z.object({
    estado: zod_1.z.nativeEnum(client_1.ordenes_estado),
    monto_pago: zod_1.z.number().min(0),
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
            if (!tenantId || !empleadoId || isNaN(ordenId)) {
                return res.status(400).json({ error: 'Datos de orden o sesión inválidos.' });
            }
            const validation = closeOrderPosSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
            }
            const data = validation.data;
            const metodoPagoDB = mapMetodoPago(data.metodo_pago);
            const ordenCerrada = await cierre_pos_service_1.cierrePosService.closeOrder(tenantId, empleadoId, ordenId, {
                estado: data.estado,
                monto_pago: data.monto_pago,
                metodo_pago: metodoPagoDB,
                descuento_monto: data.descuento_monto,
                cliente_nombre: data.cliente_nombre,
                cliente_telefono: data.cliente_telefono,
            });
            res.json({ success: true, message: 'Orden cerrada', orden: ordenCerrada });
        }
        catch (error) {
            console.error('Error en closeOrder:', error);
            res.status(400).json({ error: error.message || 'Error al cerrar cuenta' });
        }
    }
};
