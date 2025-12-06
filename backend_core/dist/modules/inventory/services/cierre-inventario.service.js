"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cierreInventarioService = void 0;
const prisma_service_1 = require("@shared/database/prisma.service");
const client_1 = require("@prisma/client");
exports.cierreInventarioService = {
    async getAll(tenantId, filters) {
        const where = { tenant_id: tenantId };
        if (filters.estado)
            where.estado = filters.estado;
        if (filters.tipo_cierre)
            where.tipo_cierre = filters.tipo_cierre;
        if (filters.fechaInicio || filters.fechaFin) {
            where.fecha_inicio = {};
            if (filters.fechaInicio)
                where.fecha_inicio.gte = filters.fechaInicio;
            if (filters.fechaFin)
                where.fecha_inicio.lte = filters.fechaFin;
        }
        return await prisma_service_1.prisma.cierres_inventario.findMany({
            where,
            include: {
                empleados: { select: { nombre: true, email: true } },
                detalles: {
                    include: {
                        productos_inventario: { select: { nombre: true } }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });
    },
    async getById(tenantId, id) {
        return await prisma_service_1.prisma.cierres_inventario.findFirst({
            where: { id, tenant_id: tenantId },
            include: {
                empleados: { select: { nombre: true, email: true } },
                detalles: {
                    include: {
                        productos_inventario: {
                            select: {
                                nombre: true,
                                costo_unitario: true,
                                unidades_medida: { select: { abreviatura: true } },
                                categorias_inventario: { select: { nombre: true, color: true } }
                            }
                        }
                    },
                    orderBy: { productos_inventario: { nombre: 'asc' } }
                }
            }
        });
    },
    async create(tenantId, userId, data) {
        const { fecha_inicio, fecha_fin, tipo_cierre, observaciones, detalles } = data;
        let totalDiferencias = new client_1.Prisma.Decimal(0);
        const detallesConDatos = [];
        for (const detalle of detalles) {
            const producto = await prisma_service_1.prisma.productos_inventario.findUnique({
                where: { id: detalle.producto_inventario_id }
            });
            if (!producto)
                throw new Error(`Producto ${detalle.producto_inventario_id} no encontrado`);
            const stockSistema = new client_1.Prisma.Decimal(producto.stock_actual || 0);
            const stockFisico = new client_1.Prisma.Decimal(detalle.stock_fisico);
            const diferencia = stockFisico.minus(stockSistema);
            const costoUnitario = new client_1.Prisma.Decimal(producto.costo_unitario || 0);
            const valorDiferencia = diferencia.mul(costoUnitario);
            totalDiferencias = totalDiferencias.plus(valorDiferencia.abs());
            detallesConDatos.push({
                producto_inventario_id: detalle.producto_inventario_id,
                stock_sistema: stockSistema,
                stock_fisico: stockFisico,
                diferencia: diferencia,
                tipo_diferencia: detalle.tipo_diferencia || null,
                valor_diferencia: valorDiferencia,
                notas: detalle.notas || null,
            });
        }
        return await prisma_service_1.prisma.cierres_inventario.create({
            data: {
                tenant_id: tenantId,
                fecha_inicio: new Date(fecha_inicio),
                fecha_fin: new Date(fecha_fin),
                tipo_cierre,
                estado: 'Borrador',
                total_diferencias: totalDiferencias,
                observaciones: observaciones || null,
                realizado_por_id: userId,
                detalles: { create: detallesConDatos }
            },
            include: { detalles: true }
        });
    },
    async update(tenantId, id, data) {
        const { observaciones, detalles } = data;
        const existing = await this.getById(tenantId, id);
        if (!existing)
            throw new Error('Cierre no encontrado');
        if (existing.estado !== 'Borrador')
            throw new Error('Solo se pueden editar cierres en Borrador');
        let updateData = {};
        if (observaciones !== undefined)
            updateData.observaciones = observaciones;
        if (detalles && detalles.length > 0) {
            // Recalcular todo
            await prisma_service_1.prisma.cierres_inventario_detalles.deleteMany({ where: { cierre_id: id } });
            let totalDiferencias = new client_1.Prisma.Decimal(0);
            const detallesConDatos = [];
            for (const detalle of detalles) {
                const producto = await prisma_service_1.prisma.productos_inventario.findUnique({
                    where: { id: detalle.producto_inventario_id }
                });
                if (!producto)
                    continue;
                const stockSistema = new client_1.Prisma.Decimal(producto.stock_actual || 0);
                const stockFisico = new client_1.Prisma.Decimal(detalle.stock_fisico);
                const diferencia = stockFisico.minus(stockSistema);
                const costoUnitario = new client_1.Prisma.Decimal(producto.costo_unitario || 0);
                const valorDiferencia = diferencia.mul(costoUnitario);
                totalDiferencias = totalDiferencias.plus(valorDiferencia.abs());
                detallesConDatos.push({
                    producto_inventario_id: detalle.producto_inventario_id,
                    stock_sistema: stockSistema,
                    stock_fisico: stockFisico,
                    diferencia: diferencia,
                    tipo_diferencia: detalle.tipo_diferencia || null,
                    valor_diferencia: valorDiferencia,
                    notas: detalle.notas || null,
                });
            }
            updateData.total_diferencias = totalDiferencias;
            updateData.detalles = { create: detallesConDatos };
        }
        return await prisma_service_1.prisma.cierres_inventario.update({
            where: { id },
            data: updateData,
            include: { detalles: true }
        });
    },
    async finalizar(tenantId, id) {
        const cierre = await this.getById(tenantId, id);
        if (!cierre)
            throw new Error('Cierre no encontrado');
        if (cierre.estado === 'Finalizado')
            throw new Error('Cierre ya finalizado');
        // Actualizar stock de productos
        for (const detalle of cierre.detalles) {
            await prisma_service_1.prisma.productos_inventario.update({
                where: { id: detalle.producto_inventario_id },
                data: {
                    stock_anterior: detalle.stock_sistema,
                    stock_actual: detalle.stock_fisico,
                    ultimo_conteo: new Date()
                }
            });
        }
        return await prisma_service_1.prisma.cierres_inventario.update({
            where: { id },
            data: { estado: 'Finalizado' },
            include: { detalles: true }
        });
    }
};
