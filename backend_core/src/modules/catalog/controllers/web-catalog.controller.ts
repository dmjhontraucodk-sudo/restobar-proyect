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
  }
};
