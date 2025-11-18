"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webCatalogService = void 0;
// src/services/web-catalog.service.ts
const prisma_1 = require("../lib/prisma");
exports.webCatalogService = {
    // Obtener tenant por subdominio
    async getTenantBySubdomain(subdomain) {
        return await prisma_1.prisma.tenants.findFirst({
            where: {
                subdominio: subdomain,
                isActive: true
            },
            select: {
                id: true,
                nombre_empresa: true,
                subdominio: true,
                configuracion: true
            }
        });
    },
    // Obtener productos visibles en web
    async getVisibleProducts(tenantId) {
        return await prisma_1.prisma.categoriasmenu.findMany({
            where: {
                tenant_id: tenantId,
                visible_en_web: true
            },
            include: {
                productos: {
                    where: {
                        visible_en_web: true,
                        disponible: true
                    },
                    select: {
                        id: true,
                        nombre: true,
                        descripcion: true,
                        precio: true,
                        foto_url: true,
                        disponible: true,
                        es_vegetariano: true,
                        es_vegano: true,
                        sin_gluten: true,
                        es_picante: true,
                        es_recomendado: true,
                        es_nuevo: true
                    },
                    orderBy: { nombre: 'asc' }
                }
            },
            orderBy: { orden: 'asc' }
        });
    },
    // Obtener producto específico
    async getProductById(tenantId, productId) {
        return await prisma_1.prisma.productos.findFirst({
            where: {
                id: productId,
                tenant_id: tenantId,
                visible_en_web: true,
                disponible: true
            },
            select: {
                id: true,
                nombre: true,
                descripcion: true,
                precio: true,
                foto_url: true,
                disponible: true,
                es_vegetariano: true,
                es_vegano: true,
                sin_gluten: true,
                es_picante: true,
                es_recomendado: true,
                es_nuevo: true,
                categoriasmenu: {
                    select: {
                        id: true,
                        nombre: true
                    }
                }
            }
        });
    },
    // Buscar productos por término
    async searchProducts(tenantId, searchTerm) {
        return await prisma_1.prisma.productos.findMany({
            where: {
                tenant_id: tenantId,
                visible_en_web: true,
                disponible: true,
                OR: [
                    {
                        nombre: {
                            contains: searchTerm
                        }
                    },
                    {
                        descripcion: {
                            contains: searchTerm
                        }
                    }
                ]
            },
            select: {
                id: true,
                nombre: true,
                descripcion: true,
                precio: true,
                foto_url: true,
                es_vegetariano: true,
                es_vegano: true,
                sin_gluten: true,
                es_picante: true,
                es_recomendado: true,
                es_nuevo: true,
                categoriasmenu: {
                    select: {
                        nombre: true
                    }
                }
            },
            take: 20 // Límite de resultados
        });
    },
    // Obtener categorías visibles
    async getVisibleCategories(tenantId) {
        return await prisma_1.prisma.categoriasmenu.findMany({
            where: {
                tenant_id: tenantId,
                visible_en_web: true
            },
            select: {
                id: true,
                nombre: true,
                slug: true,
                descripcion: true,
                orden: true,
                _count: {
                    select: {
                        productos: {
                            where: {
                                visible_en_web: true,
                                disponible: true
                            }
                        }
                    }
                }
            },
            orderBy: { orden: 'asc' }
        });
    },
    // Verificar stock de productos
    async checkProductsStock(tenantId, items) {
        const productIds = items.map(item => item.id);
        const products = await prisma_1.prisma.productos.findMany({
            where: {
                tenant_id: tenantId,
                id: { in: productIds },
                disponible: true
            },
            select: {
                id: true,
                nombre: true,
                disponible: true
            }
        });
        // Verificar que todos los productos existan y estén disponibles
        const unavailableProducts = items.filter(item => {
            const product = products.find((p) => p.id === item.id);
            return !product || !product.disponible;
        });
        return {
            allAvailable: unavailableProducts.length === 0,
            unavailableProducts: unavailableProducts.map(item => {
                const product = products.find((p) => p.id === item.id);
                return {
                    id: item.id,
                    nombre: product?.nombre || 'Producto no encontrado',
                    disponible: !!product?.disponible
                };
            })
        };
    },
    // Obtener productos recomendados
    async getRecommendedProducts(tenantId, limit = 6) {
        return await prisma_1.prisma.productos.findMany({
            where: {
                tenant_id: tenantId,
                visible_en_web: true,
                disponible: true,
                es_recomendado: true
            },
            select: {
                id: true,
                nombre: true,
                descripcion: true,
                precio: true,
                foto_url: true,
                es_vegetariano: true,
                es_vegano: true,
                sin_gluten: true,
                es_picante: true,
                categoriasmenu: {
                    select: {
                        nombre: true
                    }
                }
            },
            take: limit,
            orderBy: { nombre: 'asc' }
        });
    },
    // Obtener productos nuevos
    async getNewProducts(tenantId, limit = 6) {
        return await prisma_1.prisma.productos.findMany({
            where: {
                tenant_id: tenantId,
                visible_en_web: true,
                disponible: true,
                es_nuevo: true
            },
            select: {
                id: true,
                nombre: true,
                descripcion: true,
                precio: true,
                foto_url: true,
                es_vegetariano: true,
                es_vegano: true,
                sin_gluten: true,
                es_picante: true,
                categoriasmenu: {
                    select: {
                        nombre: true
                    }
                }
            },
            take: limit,
            orderBy: { nombre: 'asc' }
        });
    },
    // Obtener productos por categoría
    async getProductsByCategory(tenantId, categoryId) {
        return await prisma_1.prisma.productos.findMany({
            where: {
                tenant_id: tenantId,
                categoria_id: categoryId,
                visible_en_web: true,
                disponible: true
            },
            select: {
                id: true,
                nombre: true,
                descripcion: true,
                precio: true,
                foto_url: true,
                es_vegetariano: true,
                es_vegano: true,
                sin_gluten: true,
                es_picante: true,
                es_recomendado: true,
                es_nuevo: true
            },
            orderBy: { nombre: 'asc' }
        });
    }
};
