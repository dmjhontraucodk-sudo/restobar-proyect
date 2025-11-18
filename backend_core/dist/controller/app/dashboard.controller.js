"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompraById = exports.receiveCompra = exports.createGasto = exports.getGastos = exports.updateProductoInventario = exports.createProductoInventario = exports.getProductosInventario = exports.createUnidadMedida = exports.getUnidadesMedida = exports.createTipoGasto = exports.getTiposGasto = exports.updateCategoriaInventario = exports.createCategoriaInventario = exports.getCategoriasInventario = exports.getMesasConOrdenes = exports.updateOrdenEstado = exports.createOrden = exports.getOrdenes = exports.uploadImage = exports.updateProductWithRecipe = exports.updateProductDetails = exports.getProductById = exports.getCategories = exports.createCategory = exports.updateProduct = exports.createProduct = exports.getProducts = exports.getDashboardInfo = void 0;
const prisma_1 = require("../../lib/prisma");
const zod_1 = require("zod");
const cloudinary_config_1 = require("../../config/cloudinary.config");
const client_1 = require("@prisma/client");
// --- Función simple para crear Slugs ---
function slugify(text) {
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
const getDashboardInfo = async (req, res) => {
    try {
        const tenantIdFromToken = req.user?.tenant_id;
        const tenantIdFromSubdomain = req.tenant?.id;
        if (!tenantIdFromToken || !tenantIdFromSubdomain || tenantIdFromToken !== tenantIdFromSubdomain) {
            return res.status(403).json({ error: 'Acceso prohibido. No perteneces a este tenant.' });
        }
        const tenantId = tenantIdFromToken;
        const tenantInfo = await prisma_1.prisma.tenants.findUnique({
            where: { id: tenantId },
            select: { id: true, nombre_empresa: true, subdominio: true, isActive: true }
        });
        if (!tenantInfo) {
            return res.status(404).json({ error: 'Tenant no encontrado.' });
        }
        const empleadosDelTenant = await prisma_1.prisma.empleados.findMany({
            where: { tenant_id: tenantId },
            select: { id: true, email: true, is_active: true, rol_id: true }
        });
        res.status(200).json({
            message: `Información exclusiva para el Tenant ID: ${tenantId}`,
            tenant: tenantInfo,
            empleados: empleadosDelTenant,
        });
    }
    catch (error) {
        console.error('Error en getDashboardInfo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.getDashboardInfo = getDashboardInfo;
const getProducts = async (req, res) => {
    try {
        const tenantId = req.user?.tenant_id;
        if (!tenantId || tenantId !== req.tenant?.id) {
            return res.status(403).json({ error: 'Acceso prohibido.' });
        }
        const tipoSchema = zod_1.z.nativeEnum(client_1.TipoCategoria).optional();
        const tipoValidation = tipoSchema.safeParse(req.query.tipo);
        let tipoFiltro;
        if (tipoValidation.success && tipoValidation.data) {
            tipoFiltro = tipoValidation.data;
        }
        const productos = await prisma_1.prisma.productos.findMany({
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
    }
    catch (error) {
        console.error('Error en getProducts:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.getProducts = getProducts;
const createProductSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, "El nombre es requerido"),
    precio: zod_1.z.number().positive("El precio debe ser mayor a 0"),
    categoriaNombre: zod_1.z.string().min(1, "El nombre de la categoría es requerido"),
    tipo: zod_1.z.nativeEnum(client_1.TipoCategoria),
    descripcion: zod_1.z.string().optional().nullable(),
    foto_url: zod_1.z.string().url("URL de foto inválida").optional().nullable(),
    disponible: zod_1.z.boolean().default(true),
    visible_en_web: zod_1.z.boolean().default(true),
});
const createProduct = async (req, res) => {
    try {
        const tenantId = req.user?.tenant_id;
        if (!tenantId || tenantId !== req.tenant?.id) {
            return res.status(403).json({ error: 'Acceso prohibido.' });
        }
        const validation = createProductSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
        }
        const { nombre, precio, categoriaNombre, tipo, descripcion, foto_url, disponible, visible_en_web } = validation.data;
        const nuevoProducto = await prisma_1.prisma.$transaction(async (tx) => {
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
    }
    catch (error) {
        if (error.code === 'P2002' && error.meta?.target?.includes('nombre')) {
            return res.status(409).json({ error: 'Ya existe un producto con este nombre.' });
        }
        console.error('Error en createProduct:', error);
        res.status(500).json({ error: 'Error interno del servidor al crear el producto.' });
    }
};
exports.createProduct = createProduct;
const updateProductSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1).optional(),
    precio: zod_1.z.number().positive().optional(),
    descripcion: zod_1.z.string().optional().nullable(),
    foto_url: zod_1.z.string().url().optional().nullable(),
    disponible: zod_1.z.boolean().optional(),
    visible_en_web: zod_1.z.boolean().optional(),
});
const updateProduct = async (req, res) => {
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
        const updateResult = await prisma_1.prisma.productos.updateMany({
            where: {
                id: productId,
                tenant_id: tenantId,
            },
            data: validation.data,
        });
        if (updateResult.count === 0) {
            return res.status(404).json({ error: 'Producto no encontrado o no te pertenece.' });
        }
        const updatedProduct = await prisma_1.prisma.productos.findUnique({
            where: { id: productId },
        });
        res.status(200).json(updatedProduct);
    }
    catch (error) {
        if (error.code === 'P2002' && error.meta?.target?.includes('nombre')) {
            return res.status(409).json({ error: 'Ya existe un producto con este nombre.' });
        }
        console.error('Error en updateProduct:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};
exports.updateProduct = updateProduct;
const createCategorySchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, "El nombre es requerido"),
    tipo: zod_1.z.nativeEnum(client_1.TipoCategoria)
});
const createCategory = async (req, res) => {
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
        const nuevaCategoria = await prisma_1.prisma.categoriasmenu.create({
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
    }
    catch (error) {
        if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
            return res.status(409).json({ error: 'Ya existe una categoría con este nombre (o un nombre similar).' });
        }
        console.error('Error en createCategory:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};
exports.createCategory = createCategory;
const getCategories = async (req, res) => {
    try {
        const tenantId = req.user?.tenant_id;
        if (!tenantId || tenantId !== req.tenant?.id) {
            return res.status(403).json({ error: 'Acceso prohibido.' });
        }
        const tipoSchema = zod_1.z.nativeEnum(client_1.TipoCategoria);
        const tipoValidation = tipoSchema.safeParse(req.query.tipo);
        if (!tipoValidation.success) {
            return res.status(400).json({
                error: 'Tipo de categoría inválido. Debe ser COMIDA o BEBIDA.',
                details: tipoValidation.error.issues
            });
        }
        const categories = await prisma_1.prisma.categoriasmenu.findMany({
            where: {
                tenant_id: tenantId,
                tipo: tipoValidation.data
            },
            orderBy: {
                nombre: 'asc',
            }
        });
        res.status(200).json(categories);
    }
    catch (error) {
        console.error('Error en getCategories:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};
exports.getCategories = getCategories;
const getProductById = async (req, res) => {
    try {
        const tenantId = req.user?.tenant_id;
        if (!tenantId || tenantId !== req.tenant?.id) {
            return res.status(403).json({ error: 'Acceso prohibido.' });
        }
        const productId = parseInt(req.params.id);
        if (isNaN(productId)) {
            return res.status(400).json({ error: 'ID de producto inválido.' });
        }
        const producto = await prisma_1.prisma.productos.findFirst({
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
    }
    catch (error) {
        console.error('Error en getProductById:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};
exports.getProductById = getProductById;
const updateProductDetailsSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, "El nombre es requerido").optional(),
    precio: zod_1.z.number().positive("El precio debe ser mayor a 0").optional(),
    categoriaNombre: zod_1.z.string().min(1, "El nombre de la categoría es requerido").optional(),
    tipo: zod_1.z.nativeEnum(client_1.TipoCategoria).optional(),
    descripcion: zod_1.z.string().optional().nullable(),
    foto_url: zod_1.z.string().url("URL de foto inválida").optional().nullable(),
    disponible: zod_1.z.boolean().optional(),
    visible_en_web: zod_1.z.boolean().optional(),
});
const updateProductDetails = async (req, res) => {
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
        const { nombre, precio, categoriaNombre, tipo, descripcion, foto_url, disponible, visible_en_web } = validation.data;
        const productoActualizado = await prisma_1.prisma.$transaction(async (tx) => {
            let categoriaId;
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
    }
    catch (error) {
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
exports.updateProductDetails = updateProductDetails;
exports.updateProductWithRecipe = exports.updateProductDetails;
const uploadImage = async (req, res) => {
    try {
        const tenantId = req.user?.tenant_id;
        if (!tenantId || tenantId !== req.tenant?.id) {
            return res.status(403).json({ error: 'Acceso prohibido.' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No se recibió ningún archivo.' });
        }
        const result = await cloudinary_config_1.cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`, {
            folder: `tenants/${tenantId}/productos`,
            allowed_formats: ['jpg', 'png', 'webp', 'jpeg'],
            transformation: [
                { width: 1000, height: 1000, crop: 'limit' },
                { quality: 'auto', fetch_format: 'auto' }
            ]
        });
        res.status(201).json({ url: result.secure_url });
    }
    catch (error) {
        console.error('❌ Error en uploadImage:', error);
        res.status(500).json({
            error: 'Error al subir la imagen',
            details: error.message
        });
    }
};
exports.uploadImage = uploadImage;
const getOrdenes = async (req, res) => {
    try {
        const tenantId = req.user?.tenant_id;
        if (!tenantId || tenantId !== req.tenant?.id) {
            return res.status(403).json({ error: 'Acceso prohibido.' });
        }
        const querySchema = zod_1.z.object({
            estado: zod_1.z.nativeEnum(client_1.ordenes_estado).optional(),
            fechaInicio: zod_1.z.string().datetime().optional(),
            fechaFin: zod_1.z.string().datetime().optional(),
        });
        const validation = querySchema.safeParse(req.query);
        if (!validation.success) {
            return res.status(400).json({ error: 'Parámetros de filtro inválidos', details: validation.error.issues });
        }
        const { estado, fechaInicio, fechaFin } = validation.data;
        const whereClause = {
            tenant_id: tenantId,
        };
        if (estado) {
            whereClause.estado = estado;
        }
        if (fechaInicio || fechaFin) {
            whereClause.created_at = {};
            if (fechaInicio) {
                whereClause.created_at.gte = new Date(fechaInicio);
            }
            if (fechaFin) {
                whereClause.created_at.lte = new Date(fechaFin);
            }
        }
        const ordenes = await prisma_1.prisma.ordenes.findMany({
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
    }
    catch (error) {
        console.error('Error en getOrdenes:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};
exports.getOrdenes = getOrdenes;
const ordenItemSchema = zod_1.z.object({
    producto_id: zod_1.z.number().int().positive(),
    cantidad: zod_1.z.number().int().positive(),
    precio_unitario: zod_1.z.number().positive(),
    notas: zod_1.z.string().optional().nullable(),
});
const createOrdenSchema = zod_1.z.object({
    mesa_id: zod_1.z.number().int().positive(),
    items: zod_1.z.array(ordenItemSchema).min(1, "La orden debe tener al menos un item."),
});
const createOrden = async (req, res) => {
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
        const nuevaOrden = await prisma_1.prisma.$transaction(async (tx) => {
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
    }
    catch (error) {
        console.error('Error en createOrden:', error);
        res.status(500).json({ error: 'Error interno del servidor al crear la orden.' });
    }
};
exports.createOrden = createOrden;
const updateEstadoSchema = zod_1.z.object({
    estado: zod_1.z.nativeEnum(client_1.ordenes_estado),
});
const updateOrdenEstado = async (req, res) => {
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
        const ordenActualizada = await prisma_1.prisma.ordenes.updateMany({
            where: {
                id: ordenId,
                tenant_id: tenantId,
            },
            data: {
                estado: estado,
                ...((estado === 'Pagada' || estado === 'Cancelada') && {
                    closed_at: new Date()
                })
            }
        });
        if (ordenActualizada.count === 0) {
            return res.status(404).json({ error: 'Orden no encontrada.' });
        }
        if (estado === 'Pagada' || estado === 'Cancelada') {
            const orden = await prisma_1.prisma.ordenes.findFirst({ where: { id: ordenId } });
            if (orden) {
                await prisma_1.prisma.mesas.updateMany({
                    where: { id: orden.mesa_id, tenant_id: tenantId },
                    data: { estado: 'Libre' }
                });
            }
        }
        res.status(200).json({ message: 'Estado de la orden actualizado.' });
    }
    catch (error) {
        console.error('Error en updateOrdenEstado:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};
exports.updateOrdenEstado = updateOrdenEstado;
const getMesasConOrdenes = async (req, res) => {
    try {
        const tenantId = req.user?.tenant_id;
        if (!tenantId || tenantId !== req.tenant?.id) {
            return res.status(403).json({ error: 'Acceso prohibido.' });
        }
        const mesas = await prisma_1.prisma.mesas.findMany({
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
    }
    catch (error) {
        console.error('Error en getMesasConOrdenes:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};
exports.getMesasConOrdenes = getMesasConOrdenes;
const createCategoriaInventarioSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, "El nombre es requerido"),
    descripcion: zod_1.z.string().optional(),
    color: zod_1.z.string().regex(/^#[0-9A-F]{6}$/i, "Color inválido").optional(),
    icono: zod_1.z.string().optional(),
    orden: zod_1.z.number().int().optional(),
});
const getCategoriasInventario = async (req, res) => {
    try {
        const tenantId = req.user?.tenant_id;
        if (!tenantId || tenantId !== req.tenant?.id) {
            return res.status(403).json({ error: 'Acceso prohibido.' });
        }
        const categorias = await prisma_1.prisma.categorias_inventario.findMany({
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
    }
    catch (error) {
        console.error('Error en getCategoriasInventario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.getCategoriasInventario = getCategoriasInventario;
const createCategoriaInventario = async (req, res) => {
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
        const nuevaCategoria = await prisma_1.prisma.categorias_inventario.create({
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
    }
    catch (error) {
        if (error.code === 'P2002' && error.meta?.target?.includes('nombre')) {
            return res.status(409).json({ error: 'Ya existe una categoría con este nombre.' });
        }
        console.error('Error en createCategoriaInventario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.createCategoriaInventario = createCategoriaInventario;
const updateCategoriaInventarioSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1).optional(),
    descripcion: zod_1.z.string().optional(),
    color: zod_1.z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    icono: zod_1.z.string().optional(),
    orden: zod_1.z.number().int().optional(),
    activa: zod_1.z.boolean().optional(),
});
const updateCategoriaInventario = async (req, res) => {
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
        const updateResult = await prisma_1.prisma.categorias_inventario.updateMany({
            where: {
                id: categoriaId,
                tenant_id: tenantId,
            },
            data: validation.data,
        });
        if (updateResult.count === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada.' });
        }
        const categoriaActualizada = await prisma_1.prisma.categorias_inventario.findUnique({
            where: { id: categoriaId },
        });
        res.status(200).json(categoriaActualizada);
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Ya existe una categoría con este nombre.' });
        }
        console.error('Error en updateCategoriaInventario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.updateCategoriaInventario = updateCategoriaInventario;
// ✨✨✨ 2. TIPOS DE GASTO (Dinámicos) ✨✨✨
const createTipoGastoSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, "El nombre es requerido"),
    descripcion: zod_1.z.string().optional(),
    afecta_inventario: zod_1.z.boolean().default(false),
    color: zod_1.z.string().regex(/^#[0-9A-F]{6}$/i, "Color inválido").optional(),
    icono: zod_1.z.string().optional(),
    orden: zod_1.z.number().int().optional(),
});
const getTiposGasto = async (req, res) => {
    try {
        const tenantId = req.user?.tenant_id;
        if (!tenantId || tenantId !== req.tenant?.id) {
            return res.status(403).json({ error: 'Acceso prohibido.' });
        }
        const tipos = await prisma_1.prisma.tipos_gasto.findMany({
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
    }
    catch (error) {
        console.error('Error en getTiposGasto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.getTiposGasto = getTiposGasto;
const createTipoGasto = async (req, res) => {
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
        const nuevoTipo = await prisma_1.prisma.tipos_gasto.create({
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
    }
    catch (error) {
        if (error.code === 'P2002' && error.meta?.target?.includes('nombre')) {
            return res.status(409).json({ error: 'Ya existe un tipo de gasto con este nombre.' });
        }
        console.error('Error en createTipoGasto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.createTipoGasto = createTipoGasto;
// ✨✨✨ 3. UNIDADES DE MEDIDA (Dinámicas) ✨✨✨
const createUnidadMedidaSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, "El nombre es requerido"),
    abreviatura: zod_1.z.string().min(1, "La abreviatura es requerida"),
    tipo: zod_1.z.string().optional(),
});
const getUnidadesMedida = async (req, res) => {
    try {
        const tenantId = req.user?.tenant_id;
        if (!tenantId || tenantId !== req.tenant?.id) {
            return res.status(403).json({ error: 'Acceso prohibido.' });
        }
        const unidades = await prisma_1.prisma.unidades_medida.findMany({
            where: {
                tenant_id: tenantId,
                activa: true
            },
            orderBy: { nombre: 'asc' },
        });
        res.status(200).json(unidades);
    }
    catch (error) {
        console.error('Error en getUnidadesMedida:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.getUnidadesMedida = getUnidadesMedida;
const createUnidadMedida = async (req, res) => {
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
        const nuevaUnidad = await prisma_1.prisma.unidades_medida.create({
            data: {
                tenant_id: tenantId,
                nombre,
                abreviatura,
                tipo,
            },
        });
        res.status(201).json(nuevaUnidad);
    }
    catch (error) {
        if (error.code === 'P2002' && error.meta?.target?.includes('nombre')) {
            return res.status(409).json({ error: 'Ya existe una unidad con este nombre.' });
        }
        console.error('Error en createUnidadMedida:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.createUnidadMedida = createUnidadMedida;
// ✨✨✨ 4. PRODUCTOS DE INVENTARIO ✨✨✨
const createProductoInventarioSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, "El nombre es requerido"),
    categoria_inventario_id: zod_1.z.number().int().positive().optional(),
    unidad_medida_id: zod_1.z.number().int().positive().optional(),
    codigo_barras: zod_1.z.string().optional(),
    stock_actual: zod_1.z.number().min(0).optional().default(0),
    costo_unitario: zod_1.z.number().min(0).optional().default(0),
    stock_minimo: zod_1.z.number().min(0).optional().default(0),
    stock_maximo: zod_1.z.number().min(0).optional(),
});
const getProductosInventario = async (req, res) => {
    try {
        const tenantId = req.user?.tenant_id;
        if (!tenantId || tenantId !== req.tenant?.id) {
            return res.status(403).json({ error: 'Acceso prohibido.' });
        }
        const { categoria_id } = req.query;
        const whereClause = {
            tenant_id: tenantId,
            activo: true
        };
        if (categoria_id) {
            whereClause.categoria_inventario_id = parseInt(categoria_id);
        }
        const productos = await prisma_1.prisma.productos_inventario.findMany({
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
    }
    catch (error) {
        console.error('Error en getProductosInventario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.getProductosInventario = getProductosInventario;
const createProductoInventario = async (req, res) => {
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
        const nuevoProducto = await prisma_1.prisma.productos_inventario.create({
            data: {
                tenant_id: tenantId,
                ...data,
            },
        });
        res.status(201).json(nuevoProducto);
    }
    catch (error) {
        if (error.code === 'P2002' && error.meta?.target?.includes('nombre')) {
            return res.status(409).json({ error: 'Ya existe un producto con este nombre.' });
        }
        console.error('Error en createProductoInventario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.createProductoInventario = createProductoInventario;
const updateProductoInventarioSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1).optional(),
    categoria_inventario_id: zod_1.z.number().int().positive().optional(),
    unidad_medida_id: zod_1.z.number().int().positive().optional(),
    codigo_barras: zod_1.z.string().optional(),
    stock_actual: zod_1.z.number().min(0).optional(),
    costo_unitario: zod_1.z.number().min(0).optional(),
    stock_minimo: zod_1.z.number().min(0).optional(),
    stock_maximo: zod_1.z.number().min(0).optional(),
    activo: zod_1.z.boolean().optional(),
});
const updateProductoInventario = async (req, res) => {
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
        const updateResult = await prisma_1.prisma.productos_inventario.updateMany({
            where: {
                id: productoId,
                tenant_id: tenantId,
            },
            data: validation.data,
        });
        if (updateResult.count === 0) {
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }
        const productoActualizado = await prisma_1.prisma.productos_inventario.findUnique({
            where: { id: productoId },
            include: {
                categorias_inventario: true,
                unidades_medida: true,
            }
        });
        res.status(200).json(productoActualizado);
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Ya existe un producto con este nombre.' });
        }
        console.error('Error en updateProductoInventario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.updateProductoInventario = updateProductoInventario;
// ✨✨✨ 5. COMPRAS/GASTOS ✨✨✨
const compraDetalleSchema = zod_1.z.object({
    producto_inventario_id: zod_1.z.number().int().positive(),
    cantidad: zod_1.z.number().positive(),
    costo_unitario: zod_1.z.number().positive(),
});
const createGastoSchema = zod_1.z.object({
    tipo_gasto_id: zod_1.z.number().int().positive(),
    fecha: zod_1.z.string().datetime(),
    total: zod_1.z.number().positive(),
    descripcion: zod_1.z.string().optional(),
    numero_documento: zod_1.z.string().optional(),
    proveedor_id: zod_1.z.number().int().positive().optional(),
    items: zod_1.z.array(compraDetalleSchema).optional(),
});
const getGastos = async (req, res) => {
    try {
        const tenantId = req.user?.tenant_id;
        if (!tenantId || tenantId !== req.tenant?.id) {
            return res.status(403).json({ error: 'Acceso prohibido.' });
        }
        const querySchema = zod_1.z.object({
            tipo_gasto_id: zod_1.z.string().optional(),
            fechaInicio: zod_1.z.string().datetime().optional(),
            fechaFin: zod_1.z.string().datetime().optional(),
        });
        const validation = querySchema.safeParse(req.query);
        if (!validation.success) {
            return res.status(400).json({ error: 'Parámetros inválidos', details: validation.error.issues });
        }
        const { tipo_gasto_id, fechaInicio, fechaFin } = validation.data;
        const whereClause = {
            tenant_id: tenantId,
        };
        if (tipo_gasto_id) {
            whereClause.tipo_gasto_id = parseInt(tipo_gasto_id);
        }
        if (fechaInicio || fechaFin) {
            whereClause.fecha = {};
            if (fechaInicio)
                whereClause.fecha.gte = new Date(fechaInicio);
            if (fechaFin)
                whereClause.fecha.lte = new Date(fechaFin);
        }
        const gastos = await prisma_1.prisma.compras.findMany({
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
        res.status(200).json(gastos);
    }
    catch (error) {
        console.error('Error en getGastos:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};
exports.getGastos = getGastos;
const createGasto = async (req, res) => {
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
        const tipoGasto = await prisma_1.prisma.tipos_gasto.findFirst({
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
        const nuevaCompra = await prisma_1.prisma.$transaction(async (tx) => {
            const compra = await tx.compras.create({
                data: {
                    tenant_id: tenantId,
                    tipo_gasto_id: tipo_gasto_id,
                    fecha: new Date(fecha),
                    total: total,
                    descripcion: descripcion,
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
    }
    catch (error) {
        console.error('Error en createGasto:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};
exports.createGasto = createGasto;
const receiveCompra = async (req, res) => {
    try {
        const tenantId = req.user?.tenant_id;
        if (!tenantId || tenantId !== req.tenant?.id) {
            return res.status(403).json({ error: 'Acceso prohibido.' });
        }
        const compraId = parseInt(req.params.id);
        if (isNaN(compraId)) {
            return res.status(400).json({ error: 'ID de compra inválido.' });
        }
        const compra = await prisma_1.prisma.compras.findFirst({
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
        await prisma_1.prisma.$transaction(async (tx) => {
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
    }
    catch (error) {
        console.error('Error en receiveCompra:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};
exports.receiveCompra = receiveCompra;
const getCompraById = async (req, res) => {
    try {
        const tenantId = req.user?.tenant_id;
        if (!tenantId || tenantId !== req.tenant?.id) {
            return res.status(403).json({ error: 'Acceso prohibido.' });
        }
        const compraId = parseInt(req.params.id);
        if (isNaN(compraId)) {
            return res.status(400).json({ error: 'ID de compra inválido.' });
        }
        const compra = await prisma_1.prisma.compras.findFirst({
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
    }
    catch (error) {
        console.error('Error en getCompraById:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};
exports.getCompraById = getCompraById;
