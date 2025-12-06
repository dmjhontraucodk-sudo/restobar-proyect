"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.comprasService = void 0;
const prisma_service_1 = require("@shared/database/prisma.service");
const client_1 = require("@prisma/client");
exports.comprasService = {
    async getAll(tenantId, filters = {}) {
        const where = { tenant_id: tenantId };
        if (filters.tipo_gasto_id)
            where.tipo_gasto_id = parseInt(filters.tipo_gasto_id);
        if (filters.proveedor_id)
            where.proveedor_id = parseInt(filters.proveedor_id);
        if (filters.estado_compra)
            where.estado_compra = filters.estado_compra;
        if (filters.fechaInicio || filters.fechaFin) {
            where.fecha = {};
            if (filters.fechaInicio)
                where.fecha.gte = new Date(filters.fechaInicio);
            if (filters.fechaFin)
                where.fecha.lte = new Date(filters.fechaFin);
        }
        return await prisma_service_1.prisma.compras.findMany({
            where,
            include: {
                tipos_gasto: true,
                proveedores: true,
                compras_detalles: {
                    include: {
                        productos_inventario: true
                    }
                }
            },
            orderBy: { fecha: 'desc' }
        });
    },
    async getById(tenantId, id) {
        return await prisma_service_1.prisma.compras.findFirst({
            where: { id, tenant_id: tenantId },
            include: {
                tipos_gasto: true,
                proveedores: true,
                compras_detalles: {
                    include: {
                        productos_inventario: true
                    }
                }
            }
        });
    },
    async create(tenantId, data) {
        const { items, ...compraData } = data;
        let total = new client_1.Prisma.Decimal(0);
        // Validar que tipo_gasto_id y proveedor_id (si existe) pertenezcan al tenant
        const tipoGasto = await prisma_service_1.prisma.tipos_gasto.findFirst({ where: { id: compraData.tipo_gasto_id, tenant_id: tenantId } });
        if (!tipoGasto)
            throw new Error('Tipo de gasto inválido.');
        if (compraData.proveedor_id) {
            const proveedor = await prisma_service_1.prisma.proveedores.findFirst({ where: { id: compraData.proveedor_id, tenant_id: tenantId } });
            if (!proveedor)
                throw new Error('Proveedor inválido.');
        }
        for (const item of items) {
            const productoInventario = await prisma_service_1.prisma.productos_inventario.findFirst({ where: { id: item.producto_inventario_id, tenant_id: tenantId } });
            if (!productoInventario)
                throw new Error(`Producto de inventario con ID ${item.producto_inventario_id} no encontrado.`);
            total = total.plus(new client_1.Prisma.Decimal(item.cantidad).times(new client_1.Prisma.Decimal(item.costo_unitario)));
        }
        return await prisma_service_1.prisma.compras.create({
            data: {
                ...compraData,
                tenant_id: tenantId,
                fecha: new Date(compraData.fecha),
                total: total,
                compras_detalles: {
                    createMany: {
                        data: items.map(item => ({
                            ...item,
                            tenant_id: tenantId
                        }))
                    }
                }
            },
            include: {
                compras_detalles: true
            }
        });
    },
    async update(tenantId, id, data) {
        const existingCompra = await this.getById(tenantId, id);
        if (!existingCompra)
            throw new Error('Compra no encontrada.');
        const { items, ...compraData } = data;
        let total = new client_1.Prisma.Decimal(0);
        // Validar referencias
        if (compraData.tipo_gasto_id) {
            const tipoGasto = await prisma_service_1.prisma.tipos_gasto.findFirst({ where: { id: compraData.tipo_gasto_id, tenant_id: tenantId } });
            if (!tipoGasto)
                throw new Error('Tipo de gasto inválido.');
        }
        if (compraData.proveedor_id) {
            const proveedor = await prisma_service_1.prisma.proveedores.findFirst({ where: { id: compraData.proveedor_id, tenant_id: tenantId } });
            if (!proveedor)
                throw new Error('Proveedor inválido.');
        }
        // Actualizar detalles y calcular nuevo total
        if (items) {
            await prisma_service_1.prisma.$transaction(async (tx) => {
                // Eliminar detalles antiguos y crear nuevos, o actualizar
                await tx.compras_detalles.deleteMany({ where: { compra_id: id } });
                for (const item of items) {
                    const productoInventario = await tx.productos_inventario.findFirst({ where: { id: item.producto_inventario_id, tenant_id: tenantId } });
                    if (!productoInventario)
                        throw new Error(`Producto de inventario con ID ${item.producto_inventario_id} no encontrado.`);
                    total = total.plus(new client_1.Prisma.Decimal(item.cantidad).times(new client_1.Prisma.Decimal(item.costo_unitario)));
                    await tx.compras_detalles.create({
                        data: {
                            ...item,
                            tenant_id: tenantId,
                            compra_id: id
                        }
                    });
                }
            });
        }
        else {
            // Si no hay items nuevos, recalcular total con items existentes si solo se actualiza la compra
            total = existingCompra.compras_detalles.reduce((sum, item) => sum.plus(new client_1.Prisma.Decimal(item.cantidad).times(new client_1.Prisma.Decimal(item.costo_unitario))), new client_1.Prisma.Decimal(0));
        }
        return await prisma_service_1.prisma.compras.update({
            where: { id },
            data: {
                ...compraData,
                fecha: compraData.fecha ? new Date(compraData.fecha) : undefined,
                total: total // Actualizar total
            }
        });
    },
    async delete(tenantId, id) {
        const existingCompra = await this.getById(tenantId, id);
        if (!existingCompra)
            throw new Error('Compra no encontrada.');
        // No permitir eliminar compras ya recibidas (si el estado indica)
        if (existingCompra.estado_compra === 'Recibida') {
            throw new Error('No se puede eliminar una compra que ya ha sido recibida.');
        }
        return await prisma_service_1.prisma.$transaction([
            prisma_service_1.prisma.compras_detalles.deleteMany({ where: { compra_id: id } }),
            prisma_service_1.prisma.compras.delete({ where: { id } })
        ]);
    },
    async receiveCompra(tenantId, id) {
        const compra = await this.getById(tenantId, id);
        if (!compra)
            throw new Error('Compra no encontrada.');
        if (compra.estado_compra === 'Recibida')
            throw new Error('La compra ya ha sido recibida.');
        return await prisma_service_1.prisma.$transaction(async (tx) => {
            // 1. Actualizar el stock de los productos de inventario
            for (const detalle of compra.compras_detalles) {
                const producto = await tx.productos_inventario.findUnique({ where: { id: detalle.producto_inventario_id } });
                if (!producto)
                    throw new Error(`Producto de inventario con ID ${detalle.producto_inventario_id} no encontrado.`);
                const newStock = new client_1.Prisma.Decimal(producto.stock_actual || 0).plus(detalle.cantidad);
                await tx.productos_inventario.update({
                    where: { id: detalle.producto_inventario_id },
                    data: {
                        stock_actual: newStock,
                        costo_unitario: detalle.costo_unitario // Actualizar el costo unitario según la compra
                    }
                });
                // 2. Registrar movimiento en Kardex
                await tx.kardex.create({
                    data: {
                        tenant_id: tenantId,
                        producto_inventario_id: detalle.producto_inventario_id,
                        fecha: new Date(),
                        tipo_movimiento: 'ENTRADA',
                        motivo: `Compra #${compra.id}`,
                        cantidad: detalle.cantidad,
                        costo_unitario: detalle.costo_unitario,
                        valor_total: new client_1.Prisma.Decimal(detalle.cantidad).times(detalle.costo_unitario),
                        saldo_cantidad: newStock,
                        saldo_valor: newStock.times(detalle.costo_unitario),
                        documento_tipo: 'COMPRA',
                        documento_id: compra.id
                    }
                });
            }
            // 3. Actualizar el estado de la compra a "Recibida"
            return await tx.compras.update({
                where: { id },
                data: { estado_compra: 'Recibida' }
            });
        });
    }
};
