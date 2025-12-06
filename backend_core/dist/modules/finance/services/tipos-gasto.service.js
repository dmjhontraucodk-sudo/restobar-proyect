"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tiposGastoService = void 0;
const prisma_service_1 = require("@shared/database/prisma.service");
exports.tiposGastoService = {
    async getAll(tenantId) {
        return await prisma_service_1.prisma.tipos_gasto.findMany({
            where: { tenant_id: tenantId },
            orderBy: { nombre: 'asc' }
        });
    },
    async getById(tenantId, id) {
        return await prisma_service_1.prisma.tipos_gasto.findFirst({
            where: { id, tenant_id: tenantId }
        });
    },
    async create(tenantId, data) {
        // Validar nombre único para el tenant
        const existing = await prisma_service_1.prisma.tipos_gasto.findFirst({
            where: {
                tenant_id: tenantId,
                nombre: data.nombre
            }
        });
        if (existing) {
            throw new Error(`Ya existe un tipo de gasto con el nombre "${data.nombre}" para este restaurante.`);
        }
        return await prisma_service_1.prisma.tipos_gasto.create({
            data: {
                ...data,
                tenant_id: tenantId
            }
        });
    },
    async update(tenantId, id, data) {
        const existing = await this.getById(tenantId, id);
        if (!existing) {
            throw new Error('Tipo de gasto no encontrado.');
        }
        // Validar nombre único si se cambia
        if (data.nombre && data.nombre !== existing.nombre) {
            const nameConflict = await prisma_service_1.prisma.tipos_gasto.findFirst({
                where: {
                    tenant_id: tenantId,
                    nombre: data.nombre,
                    id: { not: id }
                }
            });
            if (nameConflict) {
                throw new Error(`Ya existe un tipo de gasto con el nombre "${data.nombre}" para este restaurante.`);
            }
        }
        return await prisma_service_1.prisma.tipos_gasto.update({
            where: { id },
            data
        });
    },
    async delete(tenantId, id) {
        const existing = await this.getById(tenantId, id);
        if (!existing) {
            throw new Error('Tipo de gasto no encontrado.');
        }
        // Opcional: Verificar si hay gastos o compras asociadas antes de eliminar
        const gastosCount = await prisma_service_1.prisma.gastos.count({ where: { tipo_gasto_id: id } });
        const comprasCount = await prisma_service_1.prisma.compras.count({ where: { tipo_gasto_id: id } });
        if (gastosCount > 0 || comprasCount > 0) {
            throw new Error('No se puede eliminar el tipo de gasto porque tiene gastos o compras asociadas.');
        }
        return await prisma_service_1.prisma.tipos_gasto.delete({
            where: { id }
        });
    }
};
