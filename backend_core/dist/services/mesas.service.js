"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mesasService = void 0;
// backend_core/src/services/mesas.service.ts
const prisma_1 = require("../lib/prisma");
exports.mesasService = {
    // --- OBTENER ---
    async getAllMesas(tenantId) {
        return prisma_1.prisma.mesas.findMany({
            where: { tenant_id: tenantId },
            orderBy: { nombre_o_numero: 'asc' },
        });
    },
    async getMesaById(tenantId, mesaId) {
        return prisma_1.prisma.mesas.findUnique({
            where: { id: mesaId, tenant_id: tenantId },
        });
    },
    // --- CREAR ---
    async createMesa(tenantId, data) {
        const existing = await prisma_1.prisma.mesas.findFirst({
            where: { tenant_id: tenantId, nombre_o_numero: data.nombre_o_numero }
        });
        if (existing) {
            throw new Error(`Ya existe una mesa con el nombre/número "${data.nombre_o_numero}".`);
        }
        return prisma_1.prisma.mesas.create({
            data: {
                nombre_o_numero: data.nombre_o_numero,
                capacidad: data.capacidad,
                estado: data.estado || 'Libre',
                tenant_id: tenantId,
            },
        });
    },
    // --- ACTUALIZAR ---
    async updateMesa(tenantId, mesaId, data) {
        return prisma_1.prisma.mesas.update({
            where: { id: mesaId, tenant_id: tenantId },
            data: data,
        }).catch((err) => {
            if (err.code === 'P2025') {
                throw new Error('Mesa no encontrada.');
            }
            throw err;
        });
    },
    // --- ELIMINAR ---
    async deleteMesa(tenantId, mesaId) {
        const mesa = await prisma_1.prisma.mesas.findUnique({
            where: { id: mesaId, tenant_id: tenantId }
        });
        if (!mesa) {
            throw new Error('Mesa no encontrada.');
        }
        if (mesa.estado === 'Ocupada' || mesa.estado === 'Reservada') {
            throw new Error('No se puede eliminar una mesa que está actualmente en uso o reservada.');
        }
        return prisma_1.prisma.mesas.delete({
            where: { id: mesaId, tenant_id: tenantId },
        });
    },
    // --- CAMBIAR ESTADO ---
    async updateMesaState(tenantId, mesaId, newState) {
        return prisma_1.prisma.mesas.update({
            where: { id: mesaId, tenant_id: tenantId },
            data: { estado: newState },
        });
    },
    async getAvailableMesas(tenantId) {
        // Solo traer mesas en estado "Libre"
        return await prisma_1.prisma.mesas.findMany({
            where: {
                tenant_id: tenantId,
                estado: 'Libre'
            },
            orderBy: { capacidad: 'asc' },
        });
    }
};
