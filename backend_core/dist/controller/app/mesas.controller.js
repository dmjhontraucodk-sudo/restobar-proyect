"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mesasController = void 0;
const prisma_1 = require("../../lib/prisma");
const mesas_service_1 = require("../../services/mesas.service");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
// Esquemas de validación con Zod
const createMesaSchema = zod_1.z.object({
    nombre_o_numero: zod_1.z.string().min(1, "El nombre o número es requerido."),
    capacidad: zod_1.z.number().int().positive("La capacidad debe ser un número positivo.").nullable().optional().transform(e => e === undefined ? null : e),
}).strict();
const updateMesaSchema = zod_1.z.object({
    nombre_o_numero: zod_1.z.string().min(1).optional(),
    capacidad: zod_1.z.number().int().positive().nullable().optional().transform(e => e === undefined ? null : e),
    estado: zod_1.z.nativeEnum(client_1.mesas_estado).nullable().optional().transform(e => e === undefined ? null : e),
}).strict();
exports.mesasController = {
    /**
     * GET /api/dashboard/mesas - Obtiene todas las mesas de un tenant
     */
    async getAllMesas(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            const mesas = await prisma_1.prisma.mesas.findMany({
                where: {
                    tenant_id: tenantId,
                },
                select: {
                    id: true,
                    nombre_o_numero: true,
                    capacidad: true,
                    estado: true,
                },
                orderBy: {
                    nombre_o_numero: 'asc',
                }
            });
            return res.status(200).json(mesas || []);
        }
        catch (error) {
            console.error('Error en mesasController.getAllMesas:', error);
            return res.status(500).json({
                error: 'Error interno del servidor al cargar las mesas.',
                details: error.message
            });
        }
    },
    // POST /api/dashboard/mesas
    async createMesa(req, res, next) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            const validation = createMesaSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
            }
            const mesa = await mesas_service_1.mesasService.createMesa(tenantId, validation.data);
            res.status(201).json(mesa);
        }
        catch (error) {
            next(error);
        }
    },
    // PATCH /api/dashboard/mesas/:id
    async updateMesa(req, res, next) {
        try {
            const tenantId = req.user?.tenant_id;
            const mesaId = parseInt(req.params.id, 10);
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            if (isNaN(mesaId)) {
                return res.status(400).json({ error: 'ID de mesa inválido.' });
            }
            const validation = updateMesaSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
            }
            if (Object.keys(validation.data).length === 0) {
                return res.status(400).json({ error: 'No se proporcionaron datos para actualizar.' });
            }
            const updatedMesa = await mesas_service_1.mesasService.updateMesa(tenantId, mesaId, validation.data);
            res.json(updatedMesa);
        }
        catch (error) {
            next(error);
        }
    },
    // DELETE /api/dashboard/mesas/:id
    async deleteMesa(req, res, next) {
        try {
            const tenantId = req.user?.tenant_id;
            const mesaId = parseInt(req.params.id, 10);
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            if (isNaN(mesaId)) {
                return res.status(400).json({ error: 'ID de mesa inválido.' });
            }
            const deletedMesa = await mesas_service_1.mesasService.deleteMesa(tenantId, mesaId);
            res.json({ message: 'Mesa eliminada correctamente', mesa: deletedMesa });
        }
        catch (error) {
            next(error);
        }
    }
};
