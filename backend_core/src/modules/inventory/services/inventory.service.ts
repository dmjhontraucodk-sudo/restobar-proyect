import { prisma } from '@shared/database/prisma.service';

export const inventoryService = {
    // ==================== CATEGORÍAS INVENTARIO ====================
    async getCategorias(tenantId: number) {
        return await prisma.categorias_inventario.findMany({
            where: { tenant_id: tenantId, activa: true },
            orderBy: [{ orden: 'asc' }, { nombre: 'asc' }]
        });
    },

    async createCategoria(tenantId: number, data: any) {
        return await prisma.categorias_inventario.create({
            data: { ...data, tenant_id: tenantId }
        });
    },

    async updateCategoria(tenantId: number, id: number, data: any) {
        return await prisma.categorias_inventario.updateMany({
            where: { id, tenant_id: tenantId },
            data
        });
    },

    // ==================== UNIDADES DE MEDIDA ====================
    async getUnidades(tenantId: number) {
        return await prisma.unidades_medida.findMany({
            where: { tenant_id: tenantId, activa: true },
            orderBy: { nombre: 'asc' }
        });
    },

    async createUnidad(tenantId: number, data: any) {
        return await prisma.unidades_medida.create({
            data: { ...data, tenant_id: tenantId }
        });
    },

    // ==================== PRODUCTOS INVENTARIO ====================
    async getProductos(tenantId: number, categoriaId?: number) {
        const where: any = { tenant_id: tenantId, activo: true };
        if (categoriaId) where.categoria_inventario_id = categoriaId;

        return await prisma.productos_inventario.findMany({
            where,
            include: {
                categorias_inventario: { select: { nombre: true, color: true, icono: true } },
                unidades_medida: { select: { nombre: true, abreviatura: true } }
            },
            orderBy: { nombre: 'asc' }
        });
    },

    async getProductoById(tenantId: number, id: number) {
        // VERIFICACIÓN DE TENANT CORREGIDA
        return await prisma.productos_inventario.findFirst({
            where: { id, tenant_id: tenantId },
            include: {
                categorias_inventario: true,
                unidades_medida: true
            }
        });
    },

    async createProducto(tenantId: number, data: any) {
        return await prisma.productos_inventario.create({
            data: { ...data, tenant_id: tenantId }
        });
    },

    async updateProducto(tenantId: number, id: number, data: any) {
        return await prisma.productos_inventario.updateMany({
            where: { id, tenant_id: tenantId },
            data
        });
    },

    async actualizarStockManual(tenantId: number, productoId: number, data: { 
        stockNuevo: number, 
        stockAnterior: number, 
        costoUnitario: number, 
        observaciones: string,
        usuarioId: number 
    }) {
        const { stockNuevo, stockAnterior, costoUnitario, observaciones, usuarioId } = data;
        
        // VERIFICAR que el producto pertenece al tenant
        const producto = await prisma.productos_inventario.findFirst({
            where: { id: productoId, tenant_id: tenantId }
        });
        
        if (!producto) {
            throw new Error('Producto no encontrado o no pertenece al tenant');
        }

        // Actualizar producto
        await prisma.productos_inventario.update({
            where: { id: productoId },
            data: { 
                stock_actual: stockNuevo,
                stock_anterior: stockAnterior,
                ultimo_conteo: new Date()
            }
        });

        // Registrar Kardex
        const tipoMovimiento = stockNuevo > stockAnterior ? 'Entrada' : 'Salida';
        const cantidad = Math.abs(stockNuevo - stockAnterior);

        await prisma.kardex.create({
            data: {
                tenant_id: tenantId,
                producto_inventario_id: productoId,
                tipo_movimiento: tipoMovimiento,
                motivo: 'Ajuste Manual',
                cantidad,
                costo_unitario: costoUnitario,
                valor_total: costoUnitario * cantidad,
                saldo_cantidad: stockNuevo,
                saldo_valor: costoUnitario * stockNuevo,
                documento_tipo: 'AjusteManual',
                observaciones: observaciones,
                usuario_id: usuarioId
            }
        });
    },

    // ==================== KARDEX ====================
    async getKardexReport(tenantId: number, filters: any) {
        const where: any = { tenant_id: tenantId };
        if (filters.producto_id) where.producto_inventario_id = filters.producto_id;
        if (filters.tipo_movimiento) where.tipo_movimiento = filters.tipo_movimiento;
        if (filters.fechaInicio || filters.fechaFin) {
            where.fecha = {};
            if (filters.fechaInicio) where.fecha.gte = filters.fechaInicio;
            if (filters.fechaFin) where.fecha.lte = filters.fechaFin;
        }

        return await prisma.kardex.findMany({
            where,
            include: {
                productos_inventario: {
                    select: { 
                        nombre: true, 
                        unidades_medida: { select: { abreviatura: true } } 
                    }
                },
                empleados: { select: { nombre: true } }
            },
            orderBy: { fecha: 'desc' },
            take: 100
        });
    }
};