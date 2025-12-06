"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.posOrdersController = void 0;
const prisma_service_1 = require("@shared/database/prisma.service");
const zod_1 = require("zod");
const client_1 = require("@prisma/client"); // SOLO ordenes_estado
const pos_orders_service_1 = require("../services/pos-orders.service");
const ordenItemSchema = zod_1.z.object({
    producto_id: zod_1.z.number().int().positive(),
    cantidad: zod_1.z.number().int().positive(),
    precio_unitario: zod_1.z.number().positive(),
    notas: zod_1.z.string().optional().nullable(),
}).strict();
const createOrdenSchema = zod_1.z.object({
    mesa_id: zod_1.z.number().int().positive(),
    items: zod_1.z.array(ordenItemSchema).min(1, "La orden debe tener al menos un item."),
}).strict();
const updateOrderItemsSchema = zod_1.z.object({
    items: zod_1.z.array(ordenItemSchema).min(1, "Debe añadir al menos un item."),
}).strict();
// El esquema __updateEstadoSchema está comentado, así que no necesitas pagos_metodo_pago
// const __updateEstadoSchema = z.object({
//   estado: z.nativeEnum(ordenes_estado),
//   __metodo_pago: z.nativeEnum(pagos_metodo_pago).optional(), // Si necesitas esto, entonces sí necesitas la importación
// }).strict();
exports.posOrdersController = {
    async getOrdenes(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            const querySchema = zod_1.z.object({
                estado: zod_1.z.nativeEnum(client_1.ordenes_estado).optional(),
                fechaInicio: zod_1.z.string().datetime().optional(),
                fechaFin: zod_1.z.string().datetime().optional(),
            });
            const validation = querySchema.safeParse(req.query);
            if (!validation.success) {
                return res.status(400).json({ error: 'Parámetros de filtro inválidos', details: validation.error.issues });
            }
            const { estado, fechaInicio, fechaFin } = validation.data;
            const whereClause = {
                tenant_id: tenantId,
            };
            if (estado) {
                whereClause.estado = estado;
            }
            if (estado !== 'Abierta' && (fechaInicio || fechaFin)) {
                whereClause.created_at = {};
                if (fechaInicio)
                    whereClause.created_at.gte = new Date(fechaInicio);
                if (fechaFin)
                    whereClause.created_at.lte = new Date(fechaFin);
            }
            const ordenes = await prisma_service_1.prisma.ordenes.findMany({
                where: whereClause,
                include: {
                    mesas: { select: { nombre_o_numero: true } },
                    empleados: { select: { nombre: true, email: true } },
                    ordendetalles: {
                        include: {
                            productos: { select: { nombre: true } }
                        }
                    }
                },
                orderBy: { created_at: 'desc' }
            });
            return res.status(200).json(ordenes);
        }
        catch (error) {
            console.error('Error en getOrdenes:', error);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
    },
    async createOrden(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = req.user?.id;
            if (!tenantId || !empleadoId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            const validation = createOrdenSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
            }
            const { mesa_id, items } = validation.data;
            const subtotal = items.reduce((acc, item) => acc + (item.precio_unitario * item.cantidad), 0);
            const total = subtotal;
            const nuevaOrden = await prisma_service_1.prisma.$transaction(async (tx) => {
                const orden = await tx.ordenes.create({
                    data: {
                        tenant_id: tenantId,
                        mesa_id: mesa_id,
                        empleado_id: empleadoId,
                        estado: 'Abierta',
                        subtotal: subtotal,
                        total: total,
                    }
                });
                const detallesData = items.map(item => ({
                    tenant_id: tenantId,
                    orden_id: orden.id,
                    producto_id: item.producto_id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario,
                    notas: item.notas,
                }));
                await tx.ordendetalles.createMany({ data: detallesData });
                await tx.mesas.updateMany({
                    where: { id: mesa_id, tenant_id: tenantId },
                    data: { estado: 'Ocupada' }
                });
                return orden;
            });
            return res.status(201).json(nuevaOrden);
        }
        catch (error) {
            console.error('Error en createOrden:', error);
            return res.status(500).json({ error: 'Error interno del servidor al crear la orden.' });
        }
    },
    async addItemsToOrden(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = req.user?.id;
            const ordenId = parseInt(req.params.id);
            if (!tenantId || !empleadoId || isNaN(ordenId)) {
                return res.status(400).json({ error: 'Datos de orden o sesión inválidos.' });
            }
            const validation = updateOrderItemsSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
            }
            const ordenActualizada = await pos_orders_service_1.ordenesService.addItemsToOrder(tenantId, empleadoId, ordenId, validation.data);
            return res.status(200).json(ordenActualizada);
        }
        catch (error) {
            console.error('Error en addItemsToOrden:', error);
            return res.status(400).json({ error: error.message || 'Error al añadir ítems a la orden.' });
        }
    },
    async updateOrdenEstado(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const usuarioId = req.user?.id;
            if (!tenantId || !usuarioId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            const ordenId = parseInt(req.params.id);
            const { estado, __metodo_pago: _metodo_pago } = req.body; // _metodo_pago no se usa
            if (estado === 'Pagada') {
                return res.status(400).json({ error: "Para cerrar la orden y pagar, use el endpoint de cierre." });
            }
            await prisma_service_1.prisma.ordenes.update({
                where: { id: ordenId, tenant_id: tenantId },
                data: { estado }
            });
            return res.status(200).json({ message: `Orden actualizada a ${estado}` });
        }
        catch (error) {
            console.error('❌ [ERROR] en updateOrdenEstado:', error);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
    },
    async getMesasConOrdenes(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            const mesas = await prisma_service_1.prisma.mesas.findMany({
                where: { tenant_id: tenantId },
                include: {
                    ordenes: {
                        where: { estado: 'Abierta' },
                        include: {
                            ordendetalles: {
                                include: {
                                    productos: { select: { nombre: true } }
                                }
                            }
                        },
                        orderBy: { created_at: 'desc' }
                    }
                },
                orderBy: { nombre_o_numero: 'asc' }
            });
            const resultado = mesas.map(mesa => ({
                ...mesa,
                ordenActiva: mesa.ordenes.length > 0 ? mesa.ordenes[0] : null,
                ordenes: undefined,
            }));
            return res.status(200).json(resultado);
        }
        catch (error) {
            console.error('Error en getMesasConOrdenes:', error);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
    }
};
