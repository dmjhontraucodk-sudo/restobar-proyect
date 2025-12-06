import { Response } from 'express';
import { catalogService } from '../services/catalog.service';
import { AuthRequest } from '@shared/middleware/auth.middleware';
import { RequestWithTenant } from '@shared/middleware/tenant.middleware';
import { TipoCategoria } from '@prisma/client';

type CatalogRequest = AuthRequest & RequestWithTenant;

export const adminCatalogController = {
  
  // ==================== CATEGORÍAS ====================

  async getCategories(req: CatalogRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      if (!tenantId) return res.status(403).json({ error: 'Acceso denegado' });

      const { tipo } = req.query;
      const categories = await catalogService.getCategories(tenantId, tipo as TipoCategoria);
      
      res.json(categories);
    } catch (error: any) {
      console.error('Error getting categories:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async createCategory(req: CatalogRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      if (!tenantId) return res.status(403).json({ error: 'Acceso denegado' });

      const category = await catalogService.createCategory(tenantId, req.body);
      res.status(201).json(category);
    } catch (error: any) {
      console.error('Error creating category:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async updateCategory(req: CatalogRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      const id = parseInt(req.params.id);
      if (!tenantId) return res.status(403).json({ error: 'Acceso denegado' });

      const category = await catalogService.updateCategory(tenantId, id, req.body);
      res.json(category);
    } catch (error: any) {
      console.error('Error updating category:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async deleteCategory(req: CatalogRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      const id = parseInt(req.params.id);
      if (!tenantId) return res.status(403).json({ error: 'Acceso denegado' });

      await catalogService.deleteCategory(tenantId, id);
      res.json({ message: 'Categoría eliminada' });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // ==================== PRODUCTOS ====================

  async getProducts(req: CatalogRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      if (!tenantId) return res.status(403).json({ error: 'Acceso denegado' });

      const { tipo } = req.query;
      const products = await catalogService.getProducts(tenantId, tipo as TipoCategoria);
      
      res.json(products);
    } catch (error: any) {
      console.error('Error getting products:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async getProductById(req: CatalogRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      const id = parseInt(req.params.id);
      if (!tenantId) return res.status(403).json({ error: 'Acceso denegado' });

      const product = await catalogService.getProductById(tenantId, id);
      if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
      
      res.json(product);
    } catch (error: any) {
      console.error('Error getting product:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async createProduct(req: CatalogRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      if (!tenantId) return res.status(403).json({ error: 'Acceso denegado' });

      const product = await catalogService.createProduct(tenantId, req.body);
      res.status(201).json(product);
    } catch (error: any) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async updateProduct(req: CatalogRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      const id = parseInt(req.params.id);
      if (!tenantId) return res.status(403).json({ error: 'Acceso denegado' });

      const product = await catalogService.updateProduct(tenantId, id, req.body);
      res.json(product);
    } catch (error: any) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async deleteProduct(req: CatalogRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      const id = parseInt(req.params.id);
      if (!tenantId) return res.status(403).json({ error: 'Acceso denegado' });

      await catalogService.deleteProduct(tenantId, id);
      res.json({ message: 'Producto eliminado' });
    } catch (error: any) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: error.message });
    }
  }
};
