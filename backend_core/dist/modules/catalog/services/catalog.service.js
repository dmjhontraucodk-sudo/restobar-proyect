"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catalogService = void 0;
const prisma_service_1 = require("@shared/database/prisma.service");
exports.catalogService = {
    // ==================== CATEGORÍAS ====================
    async getCategories(tenantId, tipo) {
        const where = { tenant_id: tenantId };
        if (tipo)
            where.tipo = tipo;
        return await prisma_service_1.prisma.categoriasmenu.findMany({
            where,
            include: {
                _count: {
                    select: { productos: true }
                }
            },
            orderBy: { orden: 'asc' }
        });
    },
    async getCategoryById(tenantId, id) {
        return await prisma_service_1.prisma.categoriasmenu.findFirst({
            where: { id, tenant_id: tenantId }
        });
    },
    async createCategory(tenantId, data) {
        // Verificar si ya existe slug/nombre (opcional pero recomendado)
        const slug = data.nombre.toLowerCase().replace(/ /g, '-');
        return await prisma_service_1.prisma.categoriasmenu.create({
            data: {
                ...data,
                slug,
                tenant_id: tenantId
            }
        });
    },
    async updateCategory(tenantId, id, data) {
        const category = await this.getCategoryById(tenantId, id);
        if (!category)
            throw new Error('Categoría no encontrada');
        // Si cambia nombre, actualizar slug
        let slug = undefined;
        if (data.nombre) {
            slug = data.nombre.toLowerCase().replace(/ /g, '-');
        }
        return await prisma_service_1.prisma.categoriasmenu.update({
            where: { id },
            data: {
                ...data,
                slug: slug || undefined
            }
        });
    },
    async deleteCategory(tenantId, id) {
        const category = await this.getCategoryById(tenantId, id);
        if (!category)
            throw new Error('Categoría no encontrada');
        return await prisma_service_1.prisma.categoriasmenu.delete({
            where: { id }
        });
    },
    // ==================== PRODUCTOS ====================
    async getProducts(tenantId, tipo) {
        const where = { tenant_id: tenantId };
        // Filtrar por tipo de categoría si se especifica
        if (tipo) {
            where.categoriasmenu = { tipo };
        }
        return await prisma_service_1.prisma.productos.findMany({
            where,
            include: {
                categoriasmenu: {
                    select: { id: true, nombre: true, tipo: true }
                },
                producto_inventario: {
                    select: { id: true, nombre: true, stock_actual: true }
                }
            },
            orderBy: { nombre: 'asc' }
        });
    },
    async getProductById(tenantId, id) {
        return await prisma_service_1.prisma.productos.findFirst({
            where: { id, tenant_id: tenantId },
            include: {
                categoriasmenu: true,
                producto_inventario: true
            }
        });
    },
    async createProduct(tenantId, data) {
        // Verificar que la categoría pertenezca al tenant
        const category = await this.getCategoryById(tenantId, data.categoria_id);
        if (!category)
            throw new Error('Categoría inválida o no pertenece al tenant');
        return await prisma_service_1.prisma.productos.create({
            data: {
                ...data,
                tenant_id: tenantId
            }
        });
    },
    async updateProduct(tenantId, id, data) {
        const product = await this.getProductById(tenantId, id);
        if (!product)
            throw new Error('Producto no encontrado');
        if (data.categoria_id) {
            const category = await this.getCategoryById(tenantId, data.categoria_id);
            if (!category)
                throw new Error('Categoría inválida');
        }
        return await prisma_service_1.prisma.productos.update({
            where: { id },
            data
        });
    },
    async deleteProduct(tenantId, id) {
        const product = await this.getProductById(tenantId, id);
        if (!product)
            throw new Error('Producto no encontrado');
        return await prisma_service_1.prisma.productos.delete({
            where: { id }
        });
    }
};
