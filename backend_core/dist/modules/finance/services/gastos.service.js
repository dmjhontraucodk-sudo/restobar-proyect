"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gastosService = void 0;
const prisma_service_1 = require("@shared/database/prisma.service");
exports.gastosService = {
    async getAll(tenantId) {
        return await prisma_service_1.prisma.gastos.findMany({
            where: { tenant_id: tenantId },
            include: {
                tipos_gasto: { select: { id: true, nombre: true, color: true, icono: true, afecta_inventario: true } },
                proveedores: { select: { id: true, nombre_empresa: true } },
                empleados: { select: { id: true, nombre: true, email: true } },
                descuentos_aplicados: true
            },
            orderBy: { fecha: 'desc' }
        });
    },
    async getById(__tenantId, id) {
        return await prisma_service_1.prisma.gastos.findFirst({
            where: { id, tenant_id: __tenantId }, // Cambiado: tenantId → __tenantId
            include: {
                tipos_gasto: true,
                proveedores: true,
                empleados: { select: { id: true, nombre: true, email: true } },
                descuentos_aplicados: { include: { empleados: { select: { nombre: true } } } }
            }
        });
    },
    async create(__tenantId, userId, data) {
        const { tipo_gasto_id, proveedor_id, fecha, monto, numero_documento, descripcion, metodo_pago, descuentos_ids } = data;
        return await prisma_service_1.prisma.$transaction(async (tx) => {
            const gasto = await tx.gastos.create({
                data: {
                    tenant_id: __tenantId, // Cambiado: tenantId → __tenantId
                    tipo_gasto_id,
                    proveedor_id: proveedor_id || null,
                    fecha: new Date(fecha),
                    monto,
                    numero_documento: numero_documento || null,
                    descripcion: descripcion || null,
                    metodo_pago: metodo_pago || null,
                    aprobado_por_id: userId,
                },
                include: {
                    tipos_gasto: true,
                    proveedores: true,
                    empleados: { select: { nombre: true, email: true } }
                }
            });
            if (descuentos_ids && Array.isArray(descuentos_ids) && descuentos_ids.length > 0) {
                await tx.descuentos_empleados.updateMany({
                    where: { id: { in: descuentos_ids }, tenant_id: __tenantId }, // Cambiado: tenantId → __tenantId
                    data: { estado: 'Aplicado', gasto_id: gasto.id }
                });
            }
            return gasto;
        });
    },
    async update(__tenantId, id, data) {
        return await prisma_service_1.prisma.gastos.update({
            where: { id },
            data: {
                ...data,
                fecha: data.fecha ? new Date(data.fecha) : undefined
            },
            include: { tipos_gasto: true }
        });
    },
    async delete(__tenantId, id) {
        return await prisma_service_1.prisma.$transaction([
            prisma_service_1.prisma.descuentos_empleados.updateMany({
                where: { gasto_id: id },
                data: { estado: 'Pendiente', gasto_id: null }
            }),
            prisma_service_1.prisma.gastos.delete({
                where: { id }
            })
        ]);
    },
    // Agrego el método getEstadisticas que se llama desde el controlador
    async getEstadisticas(tenantId, filters) {
        const where = { tenant_id: tenantId };
        if (filters.fechaInicio) {
            where.fecha = { gte: new Date(filters.fechaInicio) };
        }
        if (filters.fechaFin) {
            if (!where.fecha)
                where.fecha = {};
            where.fecha.lte = new Date(filters.fechaFin);
        }
        const gastos = await prisma_service_1.prisma.gastos.findMany({
            where,
            include: { tipos_gasto: true }
        });
        // Cálculos básicos de estadísticas
        const totalGastos = gastos.reduce((sum, g) => sum + Number(g.monto), 0);
        const gastosPorCategoria = gastos.reduce((acc, g) => {
            const categoria = g.tipos_gasto.nombre;
            if (!acc[categoria]) {
                acc[categoria] = { total: 0, cantidad: 0 };
            }
            acc[categoria].total += Number(g.monto);
            acc[categoria].cantidad += 1;
            return acc;
        }, {});
        return {
            totalGastos,
            gastosPorCategoria: Object.entries(gastosPorCategoria).map(([categoria, datos]) => ({
                categoria,
                total: datos.total,
                cantidad: datos.cantidad
            })),
            totalRegistros: gastos.length
        };
    }
};
