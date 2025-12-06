"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCatalogController = void 0;
const catalog_service_1 = require("../services/catalog.service");
exports.adminCatalogController = {
    // ==================== CATEGORÍAS ====================
    async getCategories(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso denegado' });
            const { tipo } = req.query;
            const categories = await catalog_service_1.catalogService.getCategories(tenantId, tipo);
            res.json(categories);
        }
        catch (error) {
            console.error('Error getting categories:', error);
            res.status(500).json({ error: error.message });
        }
    },
    async createCategory(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso denegado' });
            const category = await catalog_service_1.catalogService.createCategory(tenantId, req.body);
            res.status(201).json(category);
        }
        catch (error) {
            console.error('Error creating category:', error);
            res.status(500).json({ error: error.message });
        }
    },
    async updateCategory(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const id = parseInt(req.params.id);
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso denegado' });
            const category = await catalog_service_1.catalogService.updateCategory(tenantId, id, req.body);
            res.json(category);
        }
        catch (error) {
            console.error('Error updating category:', error);
            res.status(500).json({ error: error.message });
        }
    },
    async deleteCategory(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const id = parseInt(req.params.id);
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso denegado' });
            await catalog_service_1.catalogService.deleteCategory(tenantId, id);
            res.json({ message: 'Categoría eliminada' });
        }
        catch (error) {
            console.error('Error deleting category:', error);
            res.status(500).json({ error: error.message });
        }
    },
    // ==================== PRODUCTOS ====================
    async getProducts(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso denegado' });
            const { tipo } = req.query;
            const products = await catalog_service_1.catalogService.getProducts(tenantId, tipo);
            res.json(products);
        }
        catch (error) {
            console.error('Error getting products:', error);
            res.status(500).json({ error: error.message });
        }
    },
    async getProductById(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const id = parseInt(req.params.id);
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso denegado' });
            const product = await catalog_service_1.catalogService.getProductById(tenantId, id);
            if (!product)
                return res.status(404).json({ error: 'Producto no encontrado' });
            res.json(product);
        }
        catch (error) {
            console.error('Error getting product:', error);
            res.status(500).json({ error: error.message });
        }
    },
    async createProduct(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso denegado' });
            const product = await catalog_service_1.catalogService.createProduct(tenantId, req.body);
            res.status(201).json(product);
        }
        catch (error) {
            console.error('Error creating product:', error);
            res.status(500).json({ error: error.message });
        }
    },
    async updateProduct(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const id = parseInt(req.params.id);
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso denegado' });
            const product = await catalog_service_1.catalogService.updateProduct(tenantId, id, req.body);
            res.json(product);
        }
        catch (error) {
            console.error('Error updating product:', error);
            res.status(500).json({ error: error.message });
        }
    },
    async deleteProduct(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const id = parseInt(req.params.id);
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso denegado' });
            await catalog_service_1.catalogService.deleteProduct(tenantId, id);
            res.json({ message: 'Producto eliminado' });
        }
        catch (error) {
            console.error('Error deleting product:', error);
            res.status(500).json({ error: error.message });
        }
    }
};
