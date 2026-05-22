import { Request, Response } from 'express';
import { prisma } from '@shared/database/prisma.service';

interface TenantRequest extends Request {
  tenant?: {
    id: number;
    subdominio: string;
  };
}

export const webCatalogController = {
  
  async getCatalog(req: TenantRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.tenant?.id;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant no identificado' });
      }

      const categorias = await prisma.categoriasmenu.findMany({
        where: { tenant_id: tenantId },
        include: {
          productos: {
            where: { 
              tenant_id: tenantId,
              visible_en_web: true,
              // ✅ CAMBIO: Traer todos (disponible true, null, o false)
              // Filtraremos después en el código
            },
            select: {
              id: true,
              nombre: true,
              descripcion: true,
              precio: true,
              precio_oferta: true, // ✅ NUEVO
              foto_url: true,
              categoria_id: true,
              es_vegetariano: true,
              es_vegano: true,
              sin_gluten: true,
              es_picante: true,
              es_recomendado: true,
              es_nuevo: true,
              disponible: true,
              producto_inventario_id: true,
              producto_inventario: {
                select: {
                  stock_actual: true,
                  activo: true
                }
              }
            }
          }
        },
        orderBy: { orden: 'asc' }
      });

      // ✅ Procesar disponibilidad inteligente
      const categoriasConDisponibilidad = categorias.map(cat => ({
        ...cat,
        productos: cat.productos
          .map(prod => {
            let disponible = true;

            // Si tiene inventario vinculado, revisar stock
            if (prod.producto_inventario_id && prod.producto_inventario) {
              disponible = prod.producto_inventario.activo && 
                           Number(prod.producto_inventario.stock_actual) > 0;
            } 
            // Si NO tiene inventario vinculado
            else {
              // Si disponible es explícitamente false, no está disponible
              // Si es true o null, SÍ está disponible
              disponible = prod.disponible !== false;
            }

            // Limpiar la respuesta
            const { producto_inventario, ...productoLimpio } = prod;
            
            return {
              ...productoLimpio,
              disponible
            };
          })
          // ✅ Filtrar solo productos disponibles
          .filter(prod => prod.disponible)
      }));

      // Filtrar categorías que tengan productos
      const categoriasConProductos = categoriasConDisponibilidad
        .filter(cat => cat.productos.length > 0);

      return res.json({
        categories: categoriasConProductos,
        tenant: {
          nombre_empresa: req.tenant?.subdominio || 'RestBar'
        }
      });

    } catch (error: any) {
      console.error('Error en getCatalog:', error);
      return res.status(500).json({ 
        error: 'Error al obtener catálogo',
        message: error.message 
      });
    }
  },

  async searchProducts(req: TenantRequest, res: Response): Promise<any> {
    try {
      const tenantId = req.tenant?.id;
      const query = req.query.q as string;

      if (!tenantId) return res.status(400).json({ error: 'Tenant no identificado' });
      if (!query) return res.json({ results: [] });

      const productos = await prisma.productos.findMany({
        where: {
          tenant_id: tenantId,
          visible_en_web: true,
          nombre: { contains: query }
        },
        include: {
          producto_inventario: {
            select: { stock_actual: true, activo: true }
          }
        }
      });

      const productosConDisponibilidad = productos.map(prod => {
        let disponible = true;
        if (prod.producto_inventario_id && prod.producto_inventario) {
          disponible = prod.producto_inventario.activo && Number(prod.producto_inventario.stock_actual) > 0;
        } else {
          disponible = prod.disponible !== false;
        }
        const { producto_inventario, ...productoLimpio } = prod;
        return { ...productoLimpio, disponible };
      }).filter(prod => prod.disponible);

      return res.json({ results: productosConDisponibilidad });
    } catch (error: any) {
      console.error('Error en searchProducts:', error);
      return res.status(500).json({ error: 'Error al buscar productos' });
    }
  },

  async getProductById(req: TenantRequest, res: Response): Promise<any> {
    try {
      const tenantId = req.tenant?.id;
      const id = Number(req.params.id);

      if (!tenantId) return res.status(400).json({ error: 'Tenant no identificado' });
      if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

      const prod = await prisma.productos.findFirst({
        where: { id, tenant_id: tenantId },
        include: {
          producto_inventario: {
            select: { stock_actual: true, activo: true }
          }
        }
      });

      if (!prod || !prod.visible_en_web) return res.status(404).json({ error: 'Producto no encontrado' });

      let disponible = true;
      if (prod.producto_inventario_id && prod.producto_inventario) {
        disponible = prod.producto_inventario.activo && Number(prod.producto_inventario.stock_actual) > 0;
      } else {
        disponible = prod.disponible !== false;
      }

      const { producto_inventario, ...productoLimpio } = prod;
      return res.json({ ...productoLimpio, disponible });
    } catch (error: any) {
      console.error('Error en getProductById:', error);
      return res.status(500).json({ error: 'Error al obtener el producto' });
    }
  },

  async checkAvailability(req: TenantRequest, res: Response): Promise<any> {
    try {
      const tenantId = req.tenant?.id;
      const items = req.body.items; // Array<{id: number, cantidad: number}>

      if (!tenantId) return res.status(400).json({ error: 'Tenant no identificado' });
      if (!Array.isArray(items) || items.length === 0) return res.json({ available: true });

      let available = true;

      for (const item of items) {
        const prod = await prisma.productos.findFirst({
          where: { id: item.id, tenant_id: tenantId },
          include: { producto_inventario: { select: { stock_actual: true, activo: true } } }
        });

        if (!prod || !prod.visible_en_web) {
          available = false;
          break;
        }

        if (prod.producto_inventario_id && prod.producto_inventario) {
           if (!prod.producto_inventario.activo || Number(prod.producto_inventario.stock_actual) < item.cantidad) {
             available = false;
             break;
           }
        } else if (prod.disponible === false) {
           available = false;
           break;
        }
      }

      return res.json({ available });
    } catch (error: any) {
      console.error('Error en checkAvailability:', error);
      return res.status(500).json({ error: 'Error al verificar disponibilidad' });
    }
  }
};
