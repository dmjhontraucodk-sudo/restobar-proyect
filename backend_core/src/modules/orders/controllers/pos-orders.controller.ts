import { Response } from 'express';
import { prisma } from '@shared/database/prisma.service';
import { z } from 'zod';
import { ordenes_estado } from '@prisma/client'; // SOLO ordenes_estado
import { ordenesService } from '../services/pos-orders.service';
import { AuthRequest } from '@shared/middleware/auth.middleware';
import { RequestWithTenant } from '@shared/middleware/tenant.middleware';

type OrderRequest = AuthRequest & RequestWithTenant;

const ordenItemSchema = z.object({
  producto_id: z.number().int().positive(),
  cantidad: z.number().int().positive(),
  precio_unitario: z.number().positive(),
  notas: z.string().optional().nullable(),
}).strict();

const createOrdenSchema = z.object({
  mesa_id: z.number().int().positive(),
  items: z.array(ordenItemSchema).min(1, "La orden debe tener al menos un item."),
}).strict();

const updateOrderItemsSchema = z.object({
    items: z.array(ordenItemSchema).min(1, "Debe añadir al menos un item."),
}).strict();

// El esquema __updateEstadoSchema está comentado, así que no necesitas pagos_metodo_pago
// const __updateEstadoSchema = z.object({
//   estado: z.nativeEnum(ordenes_estado),
//   __metodo_pago: z.nativeEnum(pagos_metodo_pago).optional(), // Si necesitas esto, entonces sí necesitas la importación
// }).strict();

export const posOrdersController = {
    
    async getOrdenes(req: OrderRequest, res: Response): Promise<any> {
        try {
            const tenantId = req.user?.tenant_id;

            if (!tenantId || tenantId !== req.tenant?.id) {
                console.log('DEBUG: Acceso prohibido por tenantId.');
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            
            console.log('DEBUG: Validando query params:', req.query);
            const querySchema = z.object({
                estado: z.nativeEnum(ordenes_estado).optional(),
                fechaInicio: z.string().datetime().optional(),
                fechaFin: z.string().datetime().optional(),
            });
            
            const validation = querySchema.safeParse(req.query);
            if (!validation.success) {
                console.log('DEBUG: Query params inválidos:', validation.error.issues);
                return res.status(400).json({ error: 'Parámetros de filtro inválidos', details: validation.error.issues });
            }
            
            const { estado, fechaInicio, fechaFin } = validation.data;
            
            const whereClause: any = {
                tenant_id: tenantId,
            };

            if (estado) {
                whereClause.estado = estado;
            }

            if (estado !== 'Abierta' && (fechaInicio || fechaFin)) {
                whereClause.created_at = {};
                if (fechaInicio) whereClause.created_at.gte = new Date(fechaInicio);
                if (fechaFin) whereClause.created_at.lte = new Date(fechaFin);
            }
            console.log('DEBUG: Cláusula WHERE para Prisma:', whereClause);

            const ordenes = await prisma.ordenes.findMany({
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
            console.log(`DEBUG: Órdenes encontradas: ${ordenes.length}`);

            return res.status(200).json(ordenes);

        } catch (error: any) {
            console.error('DEBUG: Error en getOrdenes (catch block):', error);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
    },

    async createOrden(req: OrderRequest, res: Response): Promise<any> {
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

            const nuevaOrden = await prisma.$transaction(async (tx) => {
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

        } catch (error: any) {
            console.error('Error en createOrden:', error);
            return res.status(500).json({ error: 'Error interno del servidor al crear la orden.' });
        }
    },

    async addItemsToOrden(req: OrderRequest, res: Response): Promise<any> {
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

            const ordenActualizada = await ordenesService.addItemsToOrder(
                tenantId,
                empleadoId,
                ordenId,
                validation.data
            );

            return res.status(200).json(ordenActualizada);

        } catch (error: any) {
            console.error('Error en addItemsToOrden:', error);
            return res.status(400).json({ error: error.message || 'Error al añadir ítems a la orden.' });
        }
    },

    async updateOrdenEstado(req: OrderRequest, res: Response): Promise<any> {
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

            await prisma.ordenes.update({
                where: { id: ordenId, tenant_id: tenantId },
                data: { estado }
            });

            return res.status(200).json({ message: `Orden actualizada a ${estado}` });

        } catch (error: any) {
            console.error('❌ [ERROR] en updateOrdenEstado:', error);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
    },

    async getMesasConOrdenes(req: OrderRequest, res: Response): Promise<any> {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }

            const mesas = await prisma.mesas.findMany({
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

        } catch (error: any) {
            console.error('Error en getMesasConOrdenes:', error);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
    }
};