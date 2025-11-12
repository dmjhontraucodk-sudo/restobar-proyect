// src/controller/app/dashboard.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { z } from 'zod';
import { cloudinary } from '../../config/cloudinary.config';
import { TipoCategoria, ordenes_estado } from '@prisma/client';

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

// --- Funciones Existentes ---
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

    // 1. Validar el query param 'tipo'
    const tipoSchema = z.nativeEnum(TipoCategoria).optional(); // Acepta COMIDA, BEBIDA o undefined
    const tipoValidation = tipoSchema.safeParse(req.query.tipo);

    let tipoFiltro: TipoCategoria | undefined;
    if (tipoValidation.success && tipoValidation.data) {
      tipoFiltro = tipoValidation.data;
    }

    const productos = await prisma.productos.findMany({
      where: { 
        tenant_id: tenantId,
        // --- ✨ 2. AÑADIR FILTRO POR TIPO DE CATEGORÍA ---
        categoriasmenu: {
          tipo: tipoFiltro // Si tipoFiltro es undefined, Prisma ignora este filtro
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

export const getInsumos = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }
    const insumos = await prisma.insumos.findMany({
      where: { tenant_id: tenantId },
      orderBy: { nombre: 'asc' },
    });
    res.status(200).json(insumos);
  } catch (error) {
    console.error('Error en getInsumos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const createInsumoSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  unidad_medida: z.string().min(1, "La unidad es requerida"),
  stock_actual: z.number().min(0).optional().default(0),
  costo_unitario: z.number().min(0).optional().default(0),
});

export const createInsumo = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }
    const validation = createInsumoSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
    }
    const { nombre, unidad_medida, stock_actual, costo_unitario } = validation.data;
    const nuevoInsumo = await prisma.insumos.create({
      data: {
        tenant_id: tenantId,
        nombre,
        unidad_medida,
        stock_actual,
        costo_unitario,
      },
    });
    res.status(201).json(nuevoInsumo);
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('nombre')) {
      return res.status(409).json({ error: 'Ya existe un insumo con este nombre.' });
    }
    console.error('Error en createInsumo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Esquemas para Productos y Recetas ---
const recipeItemSchema = z.object({
  insumoId: z.number().int().positive("ID de insumo inválido"),
  cantidad: z.number().positive("La cantidad debe ser mayor a 0"),
});

const createProductSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  precio: z.number().positive("El precio debe ser mayor a 0"),
  categoriaNombre: z.string().min(1, "El nombre de la categoría es requerido"),
  tipo: z.nativeEnum(TipoCategoria),
  descripcion: z.string().optional().nullable(),
  foto_url: z.string().url("URL de foto inválida").optional().nullable(),
  disponible: z.boolean().default(true),
  visible_en_web: z.boolean().default(true),
  receta: z.array(recipeItemSchema).min(1, "La receta debe tener al menos un ingrediente."),
});

// --- Crear Producto con Receta ---
export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Verificación de seguridad
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    // 2. Validar el body con Zod
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
      visible_en_web, 
      receta 
    } = validation.data;

    // 3. Iniciar Transacción de Prisma
    const nuevoProductoConReceta = await prisma.$transaction(async (tx) => {
      
      // A. Buscar la categoría. Si no existe, crearla.
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

      // B. Crear el Producto
      const nuevoProducto = await tx.productos.create({
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

      // C. Preparar los datos de la receta
      const recetaData = receta.map(item => ({
        tenant_id: tenantId,
        producto_id: nuevoProducto.id,
        insumo_id: item.insumoId,
        cantidad_usada: item.cantidad,
      }));

      // D. Guardar la receta
      await tx.recetas.createMany({
        data: recetaData,
      });

      return nuevoProducto;
    });

    // 4. Si la transacción fue exitosa, responder
    res.status(201).json(nuevoProductoConReceta);

  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('nombre')) {
      return res.status(409).json({ error: 'Ya existe un producto con este nombre.' });
    }
    if (error.code === 'P2003') {
       return res.status(400).json({ error: 'Error en la receta: Uno de los insumos no existe.' });
    }

    console.error('Error en createProduct:', error);
    res.status(500).json({ error: 'Error interno del servidor al crear el producto.' });
  }
};

// --- Actualizar Producto (campos básicos) ---
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
    // 1. Verificación de seguridad
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    // 2. Obtener el ID del producto
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'ID de producto inválido.' });
    }

    // 3. Validar el body
    const validation = updateProductSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
    }

    // 4. Actualizar con verificación de tenant
    const updateResult = await prisma.productos.updateMany({
      where: {
        id: productId,
        tenant_id: tenantId,
      },
      data: validation.data,
    });

    // 5. Comprobar si se actualizó
    if (updateResult.count === 0) {
      return res.status(404).json({ error: 'Producto no encontrado o no te pertenece.' });
    }

    // 6. Devolver el producto actualizado
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

// --- Crear Categoría ---
const createCategorySchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  tipo: z.nativeEnum(TipoCategoria) // <-- Ahora pedimos el tipo (COMIDA o BEBIDA)
});

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    // --- ✨ VALIDACIÓN ACTUALIZADA ---
    const validation = createCategorySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
    }

    const { nombre, tipo } = validation.data; // <-- Obtener el tipo
    const slug = slugify(nombre);

    // --- ✨ CREACIÓN ACTUALIZADA ---
    const nuevaCategoria = await prisma.categoriasmenu.create({
      data: {
        tenant_id: tenantId,
        nombre: nombre,
        tipo: tipo, // <-- Guardar el tipo
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

// --- Obtener Categorías ---
export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    // 1. Validar el query param 'tipo'
    const tipoSchema = z.nativeEnum(TipoCategoria); // Acepta COMIDA o BEBIDA
    const tipoValidation = tipoSchema.safeParse(req.query.tipo);

    if (!tipoValidation.success) {
      return res.status(400).json({ 
        error: 'Tipo de categoría inválido. Debe ser COMIDA o BEBIDA.',
        details: tipoValidation.error.issues
      });
    }

    // 2. Buscar categorías del tenant Y del tipo correcto
    const categories = await prisma.categoriasmenu.findMany({
      where: {
        tenant_id: tenantId,
        tipo: tipoValidation.data // <-- ✨ FILTRO AÑADIDO
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

// --- Obtener Producto por ID con Receta ---
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
          select: { nombre: true }
        },
        recetas: {
          include: {
            insumos: {
              select: {
                id: true,
                nombre: true,
                unidad_medida: true
              }
            }
          }
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

// --- Actualizar Producto con Receta ---
const updateProductWithRecipeSchema = createProductSchema.partial().extend({
  receta: z.array(recipeItemSchema).min(1, "La receta no puede estar vacía.").optional(),
});

export const updateProductWithRecipe = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'ID de producto inválido.' });
    }

    const validation = updateProductWithRecipeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
    }

    const { 
      nombre, 
      precio, 
      categoriaNombre, 
      descripcion, 
      foto_url, 
      disponible, 
      visible_en_web, 
      receta
    } = validation.data;

    const productoActualizado = await prisma.$transaction(async (tx) => {
      let categoriaId: number | undefined;

      // Si se pasó nueva categoría, buscarla o crearla
      if (categoriaNombre) {
        let categoria = await tx.categoriasmenu.findFirst({
          where: { tenant_id: tenantId, nombre: categoriaNombre },
        });

        if (!categoria) {
          categoria = await tx.categoriasmenu.create({
            data: {
              tenant_id: tenantId,
              nombre: categoriaNombre,
              slug: slugify(categoriaNombre),
              visible_en_web: true,
            },
          });
        }
        categoriaId = categoria.id;
      }

      // Actualizar producto
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

      // Si se proporcionó nueva receta, reemplazarla
      if (receta) {
        await tx.recetas.deleteMany({
          where: { producto_id: productId, tenant_id: tenantId },
        });

        const recetaData = receta.map(item => ({
          tenant_id: tenantId,
          producto_id: productId,
          insumo_id: item.insumoId,
          cantidad_usada: item.cantidad,
        }));

        await tx.recetas.createMany({
          data: recetaData,
        });
      }
      
      return producto;
    });

    res.status(200).json(productoActualizado);

  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un producto o categoría con este nombre.' });
    }
    if (error.code === 'P2003') {
       return res.status(400).json({ error: 'Error en la receta: Uno de los insumos no existe.' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'El producto que intentas actualizar no existe.' });
    }
    console.error('Error en updateProductWithRecipe:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// --- Subir Imagen a Cloudinary ---
export const uploadImage = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo.' });
    }

    console.log('📤 Subiendo imagen a Cloudinary...');
    console.log('   - Tamaño:', req.file.size, 'bytes');
    console.log('   - Tipo:', req.file.mimetype);
    console.log('   - Tenant:', tenantId);

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

    console.log('✅ Imagen subida exitosamente:');
    console.log('   - URL:', result.secure_url);
    console.log('   - ID:', result.public_id);

    res.status(201).json({ url: result.secure_url });

  } catch (error: any) {
    console.error('❌ Error en uploadImage:', error);
    
    if (error.http_code) {
      console.error('   - Código HTTP:', error.http_code);
      console.error('   - Mensaje:', error.message);
    }
    
    res.status(500).json({ 
      error: 'Error al subir la imagen',
      details: error.message 
    });
  }
};

// --- 1. OBTENER ÓRDENES (ACTUALIZADO CON FILTROS DE FECHA) ---
export const getOrdenes = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }
    
    // --- ✨ VALIDACIÓN DE FILTROS ---
    const querySchema = z.object({
      estado: z.nativeEnum(ordenes_estado).optional(),
      fechaInicio: z.string().datetime().optional(), // Espera un string ISO (ej: "2025-11-12T00:00:00Z")
      fechaFin: z.string().datetime().optional(),
    });
    
    const validation = querySchema.safeParse(req.query);

    if (!validation.success) {
      return res.status(400).json({ error: 'Parámetros de filtro inválidos', details: validation.error.issues });
    }
    
    const { estado, fechaInicio, fechaFin } = validation.data;
    
    // --- ✨ CONSTRUCCIÓN DE LA CLÁUSULA WHERE ---
    const whereClause: any = {
      tenant_id: tenantId,
    };

    if (estado) {
      whereClause.estado = estado;
    }

    if (fechaInicio || fechaFin) {
      whereClause.created_at = {};
      if (fechaInicio) {
        whereClause.created_at.gte = new Date(fechaInicio); // gte = Greater Than or Equal (desde)
      }
      if (fechaFin) {
        whereClause.created_at.lte = new Date(fechaFin); // lte = Less Than or Equal (hasta)
      }
    }
    // --- FIN DE LA CLÁUSULA WHERE ---

    const ordenes = await prisma.ordenes.findMany({
      where: whereClause, // Usar la cláusula dinámica
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


// --- 2. CREAR UNA NUEVA ORDEN (Y DESCONTAR STOCK) ---

// Esquema para un item del pedido
const ordenItemSchema = z.object({
  producto_id: z.number().int().positive(),
  cantidad: z.number().int().positive(),
  precio_unitario: z.number().positive(),
  notas: z.string().optional().nullable(),
});

// Esquema para la orden completa
const createOrdenSchema = z.object({
  mesa_id: z.number().int().positive(),
  items: z.array(ordenItemSchema).min(1, "La orden debe tener al menos un item."),
});

export const createOrden = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const empleadoId = req.user?.id; // El mesero que está logueado

    if (!tenantId || !empleadoId || tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: 'Acceso prohibido.' });
    }

    const validation = createOrdenSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
    }

    const { mesa_id, items } = validation.data;

    // Calcular totales
    const subtotal = items.reduce((acc, item) => acc + (item.precio_unitario * item.cantidad), 0);
    const total = subtotal; // (Aquí podrías añadir impuestos o descuentos en el futuro)

    // --- INICIO DE LA TRANSACCIÓN (LA PARTE MÁS IMPORTANTE) ---
    const nuevaOrden = await prisma.$transaction(async (tx) => {
      
      // 1. Crear la Orden principal
      const orden = await tx.ordenes.create({
        data: {
          tenant_id: tenantId,
          mesa_id: mesa_id,
          empleado_id: empleadoId,
          estado: 'Abierta', // Estado inicial
          subtotal: subtotal,
          total: total,
        }
      });

      // 2. Preparar los detalles de la orden
      const detallesData = items.map(item => ({
        tenant_id: tenantId,
        orden_id: orden.id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        notas: item.notas,
      }));

      // 3. Guardar los detalles
      await tx.ordendetalles.createMany({
        data: detallesData,
      });

      // 4. ✨ DESCONTAR STOCK DEL INVENTARIO ✨
      for (const item of items) {
        // Encontrar la receta para este producto
        const receta = await tx.recetas.findMany({
          where: {
            producto_id: item.producto_id,
            tenant_id: tenantId,
          }
        });

        // Si el producto tiene receta, descontar cada insumo
        if (receta.length > 0) {
          for (const ingrediente of receta) {
            const cantidadADescontar = ingrediente.cantidad_usada.toNumber() * item.cantidad;
            
            await tx.insumos.updateMany({
              where: {
                id: ingrediente.insumo_id,
                tenant_id: tenantId,
              },
              data: {
                stock_actual: {
                  decrement: cantidadADescontar
                }
              }
            });
            // (Nota: En un sistema de producción real, aquí verificaríamos si el stock queda negativo)
          }
        }
      }
      
      // 5. Marcar la mesa como "Ocupada"
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
    // --- FIN DE LA TRANSACCIÓN ---

    res.status(201).json(nuevaOrden);

  } catch (error: any) {
    console.error('Error en createOrden:', error);
    res.status(500).json({ error: 'Error interno del servidor al crear la orden.' });
  }
};


// --- 3. ACTUALIZAR ESTADO DE UNA ORDEN ---
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
        // Si el estado es "Pagada" o "Cancelada", también podríamos cerrar la orden
        ...( (estado === 'Pagada' || estado === 'Cancelada') && {
          closed_at: new Date() 
        })
      }
    });

    if (ordenActualizada.count === 0) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }
    
    // Si la orden se paga o cancela, liberar la mesa
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


// --- 4. OBTENER MESAS (CON SU ORDEN ACTIVA) ---
// (La usaremos para la página de "Mesas")
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
            estado: 'Abierta' // Solo nos interesan las órdenes abiertas
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

    // Mapear para simplificar: solo queremos la *última* orden abierta de cada mesa
    const resultado = mesas.map(mesa => ({
      ...mesa,
      ordenActiva: mesa.ordenes.length > 0 ? mesa.ordenes[0] : null,
      ordenes: undefined, // Limpiar el array de órdenes
    }));

    res.status(200).json(resultado);

  } catch (error: any) {
    console.error('Error en getMesasConOrdenes:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};