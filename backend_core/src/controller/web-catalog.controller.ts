// src/controller/web-catalog.controller.ts
import { Request, Response } from 'express';
import { webCatalogService } from '../services/web-catalog.service';

interface AuthRequest extends Request {
  tenant?: {
    id: number;
    subdominio: string;
    configuracion: any;
    nombre_empresa?: string; // ✅ AÑADIR ESTA PROPIEDAD
  };
}

export const webCatalogController = {
  // Obtener catálogo completo del tenant
  async getCatalog(req: AuthRequest, res: Response) {
    try {
      const tenant = req.tenant;
      
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant no encontrado' });
      }

      const categories = await webCatalogService.getVisibleProducts(tenant.id);

      res.json({
        success: true,
        tenant: {
          nombre_empresa: tenant.nombre_empresa, // ✅ AHORA EXISTE
          subdominio: tenant.subdominio
        },
        categories
      });
    } catch (error) {
      console.error('Error en getCatalog:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor al obtener el catálogo' 
      });
    }
  },

  // Buscar productos
  async searchProducts(req: AuthRequest, res: Response) {
    try {
      const tenant = req.tenant;
      const { q } = req.query;

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant no encontrado' });
      }

      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Término de búsqueda requerido' });
      }

      const results = await webCatalogService.searchProducts(tenant.id, q);

      res.json({
        success: true,
        results,
        count: results.length
      });
    } catch (error) {
      console.error('Error en searchProducts:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor al buscar productos' 
      });
    }
  },

  // Obtener producto específico
  async getProduct(req: AuthRequest, res: Response) {
    try {
      const tenant = req.tenant;
      const productId = parseInt(req.params.id);

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant no encontrado' });
      }

      if (isNaN(productId)) {
        return res.status(400).json({ error: 'ID de producto inválido' });
      }

      const product = await webCatalogService.getProductById(tenant.id, productId);

      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      res.json({
        success: true,
        product
      });
    } catch (error) {
      console.error('Error en getProduct:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor al obtener el producto' 
      });
    }
  },

  // Verificar disponibilidad de productos
  async checkAvailability(req: AuthRequest, res: Response) {
    try {
      const tenant = req.tenant;
      const { items } = req.body;

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant no encontrado' });
      }

      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Lista de productos requerida' });
      }

      const stockCheck = await webCatalogService.checkProductsStock(tenant.id, items);

      res.json({
        success: true,
        ...stockCheck
      });
    } catch (error) {
      console.error('Error en checkAvailability:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor al verificar disponibilidad' 
      });
    }
  }
};