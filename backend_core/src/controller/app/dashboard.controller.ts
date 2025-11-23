// src/controller/app/dashboard.controller.ts - REFACTORIZADO 100% DINÁMICO
import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { z } from 'zod';
import { cloudinary } from '../../config/cloudinary.config';
import { TipoCategoria, ordenes_estado } from '@prisma/client';
import { ordenesService } from '../../services/ordenes.service';
// --- Interfaz de Autenticación ---
interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    tenant_id: number;
    rol_id: number;
  };
  tenant?: {
    id: number;
    subdominio: string;
    configuracion: any;
  };
}

// --- Función simple para crear Slugs ---
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

// ========== FUNCIONES EXISTENTES (SIN CAMBIOS) ==========

export const getDashboardInfo = async (req: AuthRequest, res: Response) => {
  try {
    const tenantIdFromToken = req.user?.tenant_id;
    const tenantIdFromSubdomain = req.tenant?.id;
    if (!tenantIdFromToken || !tenantIdFromSubdomain || tenantIdFromToken !== tenantIdFromSubdomain) {
      return res.status(403).json({ error: 'Acceso prohibido. No perteneces a este tenant.' });
    }
    const tenantId = tenantIdFromToken;
    const tenantInfo = await prisma.tenants.findUnique({
      where: { id: tenantId },
      select: { id: true, nombre_empresa: true, subdominio: true, isActive: true }
    });
    if (!tenantInfo) {
      return res.status(404).json({ error: 'Tenant no encontrado.' });
    }
    const empleadosDelTenant = await prisma.empleados.findMany({
      where: { tenant_id: tenantId },
      select: { id: true, email: true, is_active: true, rol_id: true }
    });
    res.status(200).json({
      message: `Información exclusiva para el Tenant ID: ${tenantId}`,
      tenant: tenantInfo,
      empleados: empleadosDelTenant,
    });
  } catch (error) {
    console.error('Error en getDashboardInfo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    const tipoSchema = z.nativeEnum(TipoCategoria).optional();
    const tipoValidation = tipoSchema.safeParse(req.query.tipo);

    let tipoFiltro: TipoCategoria | undefined;
    if (tipoValidation.success && tipoValidation.data) {
      tipoFiltro = tipoValidation.data;
    }

    const productos = await prisma.productos.findMany({
      where: { 
        tenant_id: tenantId,
        categoriasmenu: {
          tipo: tipoFiltro
        }
      },
      include: {
        categoriasmenu: {
          select: { nombre: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });
    res.status(200).json(productos);
  } catch (error) {
    console.error('Error en getProducts:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const createProductSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  precio: z.number().positive("El precio debe ser mayor a 0"),
  categoriaNombre: z.string().min(1, "El nombre de la categoría es requerido"),
  tipo: z.nativeEnum(TipoCategoria),
  descripcion: z.string().optional().nullable(),
  foto_url: z.string().url("URL de foto inválida").optional().nullable(),
  disponible: z.boolean().default(true),
  visible_en_web: z.boolean().default(true),
});

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    const validation = createProductSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
    }
    
    const { 
      nombre, 
      precio, 
      categoriaNombre, 
      tipo,
      descripcion, 
      foto_url, 
      disponible, 
      visible_en_web
    } = validation.data;

    const nuevoProducto = await prisma.$transaction(async (tx) => {
      
      let categoria = await tx.categoriasmenu.findFirst({
        where: {
          tenant_id: tenantId,
          nombre: categoriaNombre,
          tipo: tipo,
        },
      });

      if (!categoria) {
        categoria = await tx.categoriasmenu.create({
          data: {
            tenant_id: tenantId,
            nombre: categoriaNombre,
            slug: slugify(categoriaNombre),
            tipo: tipo,
            visible_en_web: true,
          },
        });
      }

      const producto = await tx.productos.create({
        data: {
          tenant_id: tenantId,
          categoria_id: categoria.id,
          nombre,
          descripcion,
          precio,
          foto_url,
          disponible,
          visible_en_web,
        },
      });

      return producto;
    });

    res.status(201).json(nuevoProducto);

  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('nombre')) {
      return res.status(409).json({ error: 'Ya existe un producto con este nombre.' });
    }

    console.error('Error en createProduct:', error);
    res.status(500).json({ error: 'Error interno del servidor al crear el producto.' });
  }
};

const updateProductSchema = z.object({
  nombre: z.string().min(1).optional(),
  precio: z.number().positive().optional(),
  descripcion: z.string().optional().nullable(),
  foto_url: z.string().url().optional().nullable(),
  disponible: z.boolean().optional(),
  visible_en_web: z.boolean().optional(),
});

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'ID de producto inválido.' });
    }

    const validation = updateProductSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
    }

    const updateResult = await prisma.productos.updateMany({
      where: {
        id: productId,
        tenant_id: tenantId,
      },
      data: validation.data,
    });

    if (updateResult.count === 0) {
      return res.status(404).json({ error: 'Producto no encontrado o no te pertenece.' });
    }

    const updatedProduct = await prisma.productos.findUnique({
      where: { id: productId },
    });
    
    res.status(200).json(updatedProduct);

  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('nombre')) {
      return res.status(409).json({ error: 'Ya existe un producto con este nombre.' });
    }
    console.error('Error en updateProduct:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

const createCategorySchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  tipo: z.nativeEnum(TipoCategoria)
});

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    const validation = createCategorySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
    }

    const { nombre, tipo } = validation.data;
    const slug = slugify(nombre);

    const nuevaCategoria = await prisma.categoriasmenu.create({
      data: {
        tenant_id: tenantId,
        nombre: nombre,
        tipo: tipo,
        slug: slug,
        visible_en_web: true,
        orden: 0,
      }
    });

    res.status(201).json(nuevaCategoria);

  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
      return res.status(409).json({ error: 'Ya existe una categoría con este nombre (o un nombre similar).' });
    }
    console.error('Error en createCategory:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    const tipoSchema = z.nativeEnum(TipoCategoria);
    const tipoValidation = tipoSchema.safeParse(req.query.tipo);

    if (!tipoValidation.success) {
      return res.status(400).json({ 
        error: 'Tipo de categoría inválido. Debe ser COMIDA o BEBIDA.',
        details: tipoValidation.error.issues
      });
    }

    const categories = await prisma.categoriasmenu.findMany({
      where: {
        tenant_id: tenantId,
        tipo: tipoValidation.data
      },
      orderBy: {
        nombre: 'asc',
      }
    });

    res.status(200).json(categories);

  } catch (error: any) {
    console.error('Error en getCategories:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const getProductById = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'ID de producto inválido.' });
    }

    const producto = await prisma.productos.findFirst({
      where: {
        id: productId,
        tenant_id: tenantId,
      },
      include: {
        categoriasmenu: {
          select: { nombre: true, tipo: true }
        }
      }
    });

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado o no te pertenece.' });
    }

    res.status(200).json(producto);

  } catch (error: any) {
    console.error('Error en getProductById:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

const updateProductDetailsSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").optional(),
  precio: z.number().positive("El precio debe ser mayor a 0").optional(),
  categoriaNombre: z.string().min(1, "El nombre de la categoría es requerido").optional(),
  tipo: z.nativeEnum(TipoCategoria).optional(),
  descripcion: z.string().optional().nullable(),
  foto_url: z.string().url("URL de foto inválida").optional().nullable(),
  disponible: z.boolean().optional(),
  visible_en_web: z.boolean().optional(),
});

export const updateProductDetails = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'ID de producto inválido.' });
    }

    const validation = updateProductDetailsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
    }

    const { 
      nombre, 
      precio, 
      categoriaNombre,
      tipo, 
      descripcion, 
      foto_url, 
      disponible, 
      visible_en_web
    } = validation.data;

    const productoActualizado = await prisma.$transaction(async (tx) => {
      let categoriaId: number | undefined;

      if (categoriaNombre && tipo) {
        let categoria = await tx.categoriasmenu.findFirst({
          where: { tenant_id: tenantId, nombre: categoriaNombre, tipo: tipo },
        });

        if (!categoria) {
          categoria = await tx.categoriasmenu.create({
            data: {
              tenant_id: tenantId,
              nombre: categoriaNombre,
              tipo: tipo,
              slug: slugify(categoriaNombre),
              visible_en_web: true,
            },
          });
        }
        categoriaId = categoria.id;
      }

      const producto = await tx.productos.update({
        where: {
          id: productId,
        },
        data: {
          nombre,
          precio,
          descripcion,
          foto_url,
          disponible,
          visible_en_web,
          categoria_id: categoriaId,
        },
      });

      return producto;
    });

    res.status(200).json(productoActualizado);

  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un producto o categoría con este nombre.' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'El producto que intentas actualizar no existe.' });
    }
    console.error('Error en updateProductDetails:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const updateProductWithRecipe = updateProductDetails;

export const uploadImage = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo.' });
    }

    const result = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
      {
        folder: `tenants/${tenantId}/productos`,
        allowed_formats: ['jpg', 'png', 'webp', 'jpeg'],
        transformation: [
          { width: 1000, height: 1000, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      }
    );

    res.status(201).json({ url: result.secure_url });

  } catch (error: any) {
    console.error('❌ Error en uploadImage:', error);
    res.status(500).json({ 
      error: 'Error al subir la imagen',
      details: error.message 
    });
  }
};

export const getOrdenes = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }
    
    const querySchema = z.object({
      estado: z.nativeEnum(ordenes_estado).optional(),
      fechaInicio: z.string().datetime().optional(),
      fechaFin: z.string().datetime().optional(),
    });
    
    const validation = querySchema.safeParse(req.query);

    if (!validation.success) {
      return res.status(400).json({ error: 'Parámetros de filtro inválidos', details: validation.error.issues });
    }
    
    const { estado, fechaInicio, fechaFin } = validation.data;
    
    const whereClause: any = {
      tenant_id: tenantId,
    };

    if (estado) {
      whereClause.estado = estado;
    }

  if (estado !== 'Abierta' && (fechaInicio || fechaFin)) { // <-- MODIFICACIÓN AQUÍ
      whereClause.created_at = {};
      if (fechaInicio) {
        whereClause.created_at.gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        whereClause.created_at.lte = new Date(fechaFin);
      }
    }

    const ordenes = await prisma.ordenes.findMany({
      where: whereClause,
      include: {
        mesas: {
          select: { nombre_o_numero: true }
        },
        empleados: {
          select: { nombre: true, email: true }
        },
        ordendetalles: {
          include: {
            productos: {
              select: { nombre: true }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.status(200).json(ordenes);

  } catch (error: any) {
    console.error('Error en getOrdenes:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

const ordenItemSchema = z.object({
  producto_id: z.number().int().positive(),
  cantidad: z.number().int().positive(),
  precio_unitario: z.number().positive(),
  notas: z.string().optional().nullable(),
});

const createOrdenSchema = z.object({
  mesa_id: z.number().int().positive(),
  items: z.array(ordenItemSchema).min(1, "La orden debe tener al menos un item."),
});

export const createOrden = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const empleadoId = req.user?.id;

    if (!tenantId || !empleadoId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    const validation = createOrdenSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
    }

    const { mesa_id, items } = validation.data;

    const subtotal = items.reduce((acc, item) => acc + (item.precio_unitario * item.cantidad), 0);
    const total = subtotal;

    const nuevaOrden = await prisma.$transaction(async (tx) => {
      
      const orden = await tx.ordenes.create({
        data: {
          tenant_id: tenantId,
          mesa_id: mesa_id,
          empleado_id: empleadoId,
          estado: 'Abierta',
          subtotal: subtotal,
          total: total,
        }
      });

      const detallesData = items.map(item => ({
        tenant_id: tenantId,
        orden_id: orden.id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        notas: item.notas,
      }));

      await tx.ordendetalles.createMany({
        data: detallesData,
      });

      await tx.mesas.updateMany({
        where: {
          id: mesa_id,
          tenant_id: tenantId,
        },
        data: {
          estado: 'Ocupada'
        }
      });

      return orden;
    });

    res.status(201).json(nuevaOrden);

  } catch (error: any) {
    console.error('Error en createOrden:', error);
    res.status(500).json({ error: 'Error interno del servidor al crear la orden.' });
  }
};

const updateEstadoSchema = z.object({
  estado: z.nativeEnum(ordenes_estado),
});

export const updateOrdenEstado = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    const ordenId = parseInt(req.params.id);
    if (isNaN(ordenId)) {
      return res.status(400).json({ error: 'ID de orden inválido.' });
    }

    const validation = updateEstadoSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
    }

    const { estado } = validation.data;

    const ordenActualizada = await prisma.ordenes.updateMany({
      where: {
        id: ordenId,
        tenant_id: tenantId,
      },
      data: {
        estado: estado,
        ...( (estado === 'Pagada' || estado === 'Cancelada') && {
          closed_at: new Date() 
        })
      }
    });

    if (ordenActualizada.count === 0) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }
    
    if (estado === 'Pagada' || estado === 'Cancelada') {
      const orden = await prisma.ordenes.findFirst({ where: { id: ordenId } });
      if (orden) {
        await prisma.mesas.updateMany({
          where: { id: orden.mesa_id, tenant_id: tenantId },
          data: { estado: 'Libre' }
        });
      }
    }

    res.status(200).json({ message: 'Estado de la orden actualizado.' });

  } catch (error: any) {
    console.error('Error en updateOrdenEstado:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

  // Esquema para añadir ítems (igual al itemSchema original)
  const updateOrderItemsSchema = z.object({
      items: z.array(ordenItemSchema).min(1, "Debe añadir al menos un item."),
  });

  // ✅ NUEVA FUNCIÓN CONTROLADORA
  export const addItemsToOrden = async (req: AuthRequest, res: Response) => {
      try {
          const tenantId = req.user?.tenant_id;
          const empleadoId = req.user?.id;
          const ordenId = parseInt(req.params.id);

          if (!tenantId || !empleadoId || isNaN(ordenId)) {
              return res.status(400).json({ error: 'Datos de orden o sesión inválidos.' });
          }

          const validation = updateOrderItemsSchema.safeParse(req.body);
          if (!validation.success) {
              return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
          }

          const data = validation.data;
          
          // Llamar al nuevo servicio
          const ordenActualizada = await ordenesService.addItemsToOrder(
              tenantId,
              empleadoId,
              ordenId,
              data
          );

          res.status(200).json(ordenActualizada);

      } catch (error: any) {
          console.error('Error en addItemsToOrden:', error);
          res.status(400).json({ error: error.message || 'Error al añadir ítems a la orden.' });
      }
  };

export const getMesasConOrdenes = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    const mesas = await prisma.mesas.findMany({
      where: { tenant_id: tenantId },
      include: {
        ordenes: {
          where: {
            estado: 'Abierta'
          },
          include: {
            ordendetalles: {
              include: {
                productos: {
                  select: { nombre: true }
                }
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          }
        }
      },
      orderBy: {
        nombre_o_numero: 'asc'
      }
    });

    const resultado = mesas.map(mesa => ({
      ...mesa,
      ordenActiva: mesa.ordenes.length > 0 ? mesa.ordenes[0] : null,
      ordenes: undefined,
    }));

    res.status(200).json(resultado);

  } catch (error: any) {
    console.error('Error en getMesasConOrdenes:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

const createCategoriaInventarioSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Color inválido").optional(),
  icono: z.string().optional(),
  orden: z.number().int().optional(),
});

export const getCategoriasInventario = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    const categorias = await prisma.categorias_inventario.findMany({
      where: { 
        tenant_id: tenantId,
        activa: true 
      },
      orderBy: [
        { orden: 'asc' },
        { nombre: 'asc' }
      ],
    });

    res.status(200).json(categorias);
  } catch (error: any) {
    console.error('Error en getCategoriasInventario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createCategoriaInventario = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    const validation = createCategoriaInventarioSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
    }

    const { nombre, descripcion, color, icono, orden } = validation.data;

    const nuevaCategoria = await prisma.categorias_inventario.create({
      data: {
        tenant_id: tenantId,
        nombre,
        descripcion,
        color,
        icono,
        orden,
      },
    });

    res.status(201).json(nuevaCategoria);
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('nombre')) {
      return res.status(409).json({ error: 'Ya existe una categoría con este nombre.' });
    }
    console.error('Error en createCategoriaInventario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const updateCategoriaInventarioSchema = z.object({
  nombre: z.string().min(1).optional(),
  descripcion: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  icono: z.string().optional(),
  orden: z.number().int().optional(),
  activa: z.boolean().optional(),
});

export const updateCategoriaInventario = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    const categoriaId = parseInt(req.params.id);
    if (isNaN(categoriaId)) {
      return res.status(400).json({ error: 'ID de categoría inválido.' });
    }

    const validation = updateCategoriaInventarioSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
    }

    const updateResult = await prisma.categorias_inventario.updateMany({
      where: {
        id: categoriaId,
        tenant_id: tenantId,
      },
      data: validation.data,
    });

    if (updateResult.count === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada.' });
    }

    const categoriaActualizada = await prisma.categorias_inventario.findUnique({
      where: { id: categoriaId },
    });

    res.status(200).json(categoriaActualizada);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe una categoría con este nombre.' });
    }
    console.error('Error en updateCategoriaInventario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ✨✨✨ 2. TIPOS DE GASTO (Dinámicos) ✨✨✨

const createTipoGastoSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  afecta_inventario: z.boolean().default(false),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Color inválido").optional(),
  icono: z.string().optional(),
  orden: z.number().int().optional(),
});

export const getTiposGasto = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    const tipos = await prisma.tipos_gasto.findMany({
      where: { 
        tenant_id: tenantId,
        activo: true 
      },
      orderBy: [
        { orden: 'asc' },
        { nombre: 'asc' }
      ],
    });

    res.status(200).json(tipos);
  } catch (error: any) {
    console.error('Error en getTiposGasto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createTipoGasto = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    const validation = createTipoGastoSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
    }

    const { nombre, descripcion, afecta_inventario, color, icono, orden } = validation.data;

    const nuevoTipo = await prisma.tipos_gasto.create({
      data: {
        tenant_id: tenantId,
        nombre,
        descripcion,
        afecta_inventario,
        color,
        icono,
        orden,
      },
    });

    res.status(201).json(nuevoTipo);
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('nombre')) {
      return res.status(409).json({ error: 'Ya existe un tipo de gasto con este nombre.' });
    }
    console.error('Error en createTipoGasto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ✨✨✨ 3. UNIDADES DE MEDIDA (Dinámicas) ✨✨✨

const createUnidadMedidaSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  abreviatura: z.string().min(1, "La abreviatura es requerida"),
  tipo: z.string().optional(),
});

export const getUnidadesMedida = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    const unidades = await prisma.unidades_medida.findMany({
      where: { 
        tenant_id: tenantId,
        activa: true 
      },
      orderBy: { nombre: 'asc' },
    });

    res.status(200).json(unidades);
  } catch (error: any) {
    console.error('Error en getUnidadesMedida:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createUnidadMedida = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    const validation = createUnidadMedidaSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
    }

    const { nombre, abreviatura, tipo } = validation.data;

    const nuevaUnidad = await prisma.unidades_medida.create({
      data: {
        tenant_id: tenantId,
        nombre,
        abreviatura,
        tipo,
      },
    });

    res.status(201).json(nuevaUnidad);
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('nombre')) {
      return res.status(409).json({ error: 'Ya existe una unidad con este nombre.' });
    }
    console.error('Error en createUnidadMedida:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ✨✨✨ 4. PRODUCTOS DE INVENTARIO ✨✨✨

const createProductoInventarioSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  categoria_inventario_id: z.number().int().positive().optional(),
  unidad_medida_id: z.number().int().positive().optional(),
  codigo_barras: z.string().optional(),
  stock_actual: z.number().min(0).optional().default(0),
  costo_unitario: z.number().min(0).optional().default(0),
  stock_minimo: z.number().min(0).optional().default(0),
  stock_maximo: z.number().min(0).optional(),
});

export const getProductosInventario = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    const { categoria_id } = req.query;

    const whereClause: any = { 
      tenant_id: tenantId,
      activo: true 
    };

    if (categoria_id) {
      whereClause.categoria_inventario_id = parseInt(categoria_id as string);
    }

    const productos = await prisma.productos_inventario.findMany({
      where: whereClause,
      include: {
        categorias_inventario: {
          select: { nombre: true, color: true, icono: true }
        },
        unidades_medida: {
          select: { nombre: true, abreviatura: true }
        }
      },
      orderBy: { nombre: 'asc' },
    });

    res.status(200).json(productos);
  } catch (error: any) {
    console.error('Error en getProductosInventario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createProductoInventario = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    const validation = createProductoInventarioSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
    }

    const data = validation.data;

    const nuevoProducto = await prisma.productos_inventario.create({
      data: {
        tenant_id: tenantId,
        ...data,
      },
    });

    res.status(201).json(nuevoProducto);
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('nombre')) {
      return res.status(409).json({ error: 'Ya existe un producto con este nombre.' });
    }
    console.error('Error en createProductoInventario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const updateProductoInventarioSchema = z.object({
  nombre: z.string().min(1).optional(),
  categoria_inventario_id: z.number().int().positive().optional(),
  unidad_medida_id: z.number().int().positive().optional(),
  codigo_barras: z.string().optional(),
  stock_actual: z.number().min(0).optional(),
  costo_unitario: z.number().min(0).optional(),
  stock_minimo: z.number().min(0).optional(),
  stock_maximo: z.number().min(0).optional(),
  activo: z.boolean().optional(),
});

export const updateProductoInventario = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    const productoId = parseInt(req.params.id);
    if (isNaN(productoId)) {
      return res.status(400).json({ error: 'ID de producto inválido.' });
    }

    const validation = updateProductoInventarioSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
    }

    const updateResult = await prisma.productos_inventario.updateMany({
      where: {
        id: productoId,
        tenant_id: tenantId,
      },
      data: validation.data,
    });

    if (updateResult.count === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    const productoActualizado = await prisma.productos_inventario.findUnique({
      where: { id: productoId },
      include: {
        categorias_inventario: true,
        unidades_medida: true,
      }
    });

    res.status(200).json(productoActualizado);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un producto con este nombre.' });
    }
    console.error('Error en updateProductoInventario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ✨✨✨ 5. COMPRAS/GASTOS ✨✨✨

const compraDetalleSchema = z.object({
  producto_inventario_id: z.number().int().positive(),
  cantidad: z.number().positive(),
  costo_unitario: z.number().positive(),
});

const createGastoSchema = z.object({
  tipo_gasto_id: z.number().int().positive(),
  fecha: z.string().datetime(),
  total: z.number().positive(),
  descripcion: z.string().optional(),
  numero_documento: z.string().optional(),
  proveedor_id: z.number().int().positive().optional(),
  items: z.array(compraDetalleSchema).optional(),
});

// 🆕 AÑADIR ESTAS FUNCIONES FALTANTES
export const getGastos = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    const querySchema = z.object({
      tipo_gasto_id: z.string().optional(),
      fechaInicio: z.string().datetime().optional(),
      fechaFin: z.string().datetime().optional(),
    });

    const validation = querySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({ error: 'Parámetros inválidos', details: validation.error.issues });
    }

    const { tipo_gasto_id, fechaInicio, fechaFin } = validation.data;

    const whereClause: any = {
      tenant_id: tenantId,
    };

    if (tipo_gasto_id) {
      whereClause.tipo_gasto_id = parseInt(tipo_gasto_id);
    }

    if (fechaInicio || fechaFin) {
      whereClause.fecha = {};
      if (fechaInicio) whereClause.fecha.gte = new Date(fechaInicio);
      if (fechaFin) whereClause.fecha.lte = new Date(fechaFin);
    }

    const compras = await prisma.compras.findMany({
      where: whereClause,
      include: {
        tipos_gasto: {
          select: { nombre: true, afecta_inventario: true, color: true, icono: true }
        },
        proveedores: {
          select: { nombre_empresa: true }
        },
        compras_detalles: {
          include: {
            productos_inventario: {
              select: { 
                nombre: true,
                unidades_medida: {
                  select: { abreviatura: true }
                }
              }
            }
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    });

    res.status(200).json(compras);

  } catch (error: any) {
    console.error('Error en getGastos (compras):', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const createGasto = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    const validation = createGastoSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
    }

    const { tipo_gasto_id, fecha, total, descripcion, numero_documento, proveedor_id, items } = validation.data;

    // Verificar que el tipo de gasto existe
    const tipoGasto = await prisma.tipos_gasto.findFirst({
      where: { id: tipo_gasto_id, tenant_id: tenantId }
    });

    if (!tipoGasto) {
      return res.status(404).json({ error: 'Tipo de gasto no encontrado.' });
    }

    // Si afecta inventario, debe tener items
    if (tipoGasto.afecta_inventario && (!items || items.length === 0)) {
      return res.status(400).json({ 
        error: 'Para compras que afectan inventario debes proporcionar al menos un item.' 
      });
    }

    const nuevaCompra = await prisma.$transaction(async (tx) => {
      const compra = await tx.compras.create({
        data: {
          tenant_id: tenantId,
          tipo_gasto_id: tipo_gasto_id,
          fecha: new Date(fecha),
          total: total,
          observaciones: descripcion,
          numero_documento: numero_documento,
          proveedor_id: proveedor_id,
          estado_compra: tipoGasto.afecta_inventario ? 'Pendiente' : 'Completado',
        }
      });

      // Si tiene items, crear los detalles
      if (items && items.length > 0) {
        const detallesData = items.map(item => ({
          tenant_id: tenantId,
          compra_id: compra.id,
          producto_inventario_id: item.producto_inventario_id,
          cantidad: item.cantidad,
          costo_unitario: item.costo_unitario,
        }));

        await tx.compras_detalles.createMany({
          data: detallesData,
        });
      }

      return compra;
    });

    res.status(201).json(nuevaCompra);

  } catch (error: any) {
    console.error('Error en createGasto (compra):', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const receiveCompra = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    const compraId = parseInt(req.params.id);
    if (isNaN(compraId)) {
      return res.status(400).json({ error: 'ID de compra inválido.' });
    }

    const compra = await prisma.compras.findFirst({
      where: {
        id: compraId,
        tenant_id: tenantId,
      },
      include: {
        tipos_gasto: true
      }
    });

    if (!compra) {
      return res.status(404).json({ error: 'Compra no encontrada.' });
    }

    if (!compra.tipos_gasto.afecta_inventario) {
      return res.status(400).json({ 
        error: 'Solo se pueden recibir compras que afectan el inventario.' 
      });
    }

    if (compra.estado_compra === 'Recibido') {
      return res.status(400).json({ error: 'Esta compra ya fue recibida anteriormente.' });
    }

    await prisma.$transaction(async (tx) => {
      
      const detalles = await tx.compras_detalles.findMany({
        where: {
          compra_id: compraId,
          tenant_id: tenantId,
        }
      });

      for (const detalle of detalles) {
        await tx.productos_inventario.updateMany({
          where: {
            id: detalle.producto_inventario_id,
            tenant_id: tenantId,
          },
          data: {
            stock_actual: {
              increment: detalle.cantidad
            },
            costo_unitario: detalle.costo_unitario,
          }
        });
      }

      await tx.compras.update({
        where: { id: compraId },
        data: {
          estado_compra: 'Recibido'
        }
      });
    });

    res.status(200).json({ 
      message: 'Compra recibida exitosamente. El stock ha sido incrementado.' 
    });

  } catch (error: any) {
    console.error('Error en receiveCompra:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const getCompraById = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    const compraId = parseInt(req.params.id);
    if (isNaN(compraId)) {
      return res.status(400).json({ error: 'ID de compra inválido.' });
    }

    const compra = await prisma.compras.findFirst({
      where: {
        id: compraId,
        tenant_id: tenantId,
      },
      include: {
        tipos_gasto: true,
        proveedores: true,
        compras_detalles: {
          include: {
            productos_inventario: {
              include: {
                unidades_medida: true
              }
            }
          }
        }
      }
    });

    if (!compra) {
      return res.status(404).json({ error: 'Compra no encontrada.' });
    }

    res.status(200).json(compra);

  } catch (error: any) {
    console.error('Error en getCompraById:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};