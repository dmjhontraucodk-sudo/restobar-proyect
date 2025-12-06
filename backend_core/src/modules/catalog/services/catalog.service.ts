import { prisma } from '@shared/database/prisma.service';
import { TipoCategoria } from '@prisma/client';

// Interfaces para tipado
export interface CreateCategoryData {
  nombre: string;
  tipo: TipoCategoria;
  descripcion?: string;
  orden?: number;
  visible_en_web?: boolean;
}

export interface UpdateCategoryData {
  nombre?: string;
  tipo?: TipoCategoria;
  descripcion?: string;
  orden?: number;
  visible_en_web?: boolean;
}

export interface CreateProductData {
  nombre: string;
  categoria_id: number;
  precio: number;
  descripcion?: string;
  foto_url?: string;
  disponible?: boolean;
  visible_en_web?: boolean;
  producto_inventario_id?: number;
  // Campos adicionales de producto
  es_vegetariano?: boolean;
  es_vegano?: boolean;
  sin_gluten?: boolean;
  es_picante?: boolean;
  es_recomendado?: boolean;
  es_nuevo?: boolean;
}

export interface UpdateProductData {
  nombre?: string;
  categoria_id?: number;
  precio?: number;
  descripcion?: string;
  foto_url?: string;
  disponible?: boolean;
  visible_en_web?: boolean;
  producto_inventario_id?: number;
  es_vegetariano?: boolean;
  es_vegano?: boolean;
  sin_gluten?: boolean;
  es_picante?: boolean;
  es_recomendado?: boolean;
  es_nuevo?: boolean;
}

export const catalogService = {
  
  // ==================== CATEGORÍAS ====================

  async getCategories(tenantId: number, tipo?: TipoCategoria) {
    const where: any = { tenant_id: tenantId };
    if (tipo) where.tipo = tipo;

    return await prisma.categoriasmenu.findMany({
      where,
      include: {
        _count: {
          select: { productos: true }
        }
      },
      orderBy: { orden: 'asc' }
    });
  },

  async getCategoryById(tenantId: number, id: number) {
    return await prisma.categoriasmenu.findFirst({
      where: { id, tenant_id: tenantId }
    });
  },

  async createCategory(tenantId: number, data: CreateCategoryData) {
    // Verificar si ya existe slug/nombre (opcional pero recomendado)
    const slug = data.nombre.toLowerCase().replace(/ /g, '-');
    
    return await prisma.categoriasmenu.create({
      data: {
        ...data,
        slug,
        tenant_id: tenantId
      }
    });
  },

  async updateCategory(tenantId: number, id: number, data: UpdateCategoryData) {
    const category = await this.getCategoryById(tenantId, id);
    if (!category) throw new Error('Categoría no encontrada');

    // Si cambia nombre, actualizar slug
    let slug = undefined;
    if (data.nombre) {
        slug = data.nombre.toLowerCase().replace(/ /g, '-');
    }

    return await prisma.categoriasmenu.update({
      where: { id },
      data: {
        ...data,
        slug: slug || undefined
      }
    });
  },

  async deleteCategory(tenantId: number, id: number) {
    const category = await this.getCategoryById(tenantId, id);
    if (!category) throw new Error('Categoría no encontrada');

    return await prisma.categoriasmenu.delete({
      where: { id }
    });
  },

  // ==================== PRODUCTOS ====================

  async getProducts(tenantId: number, tipo?: TipoCategoria) {
    const where: any = { tenant_id: tenantId };
    
    // Filtrar por tipo de categoría si se especifica
    if (tipo) {
        where.categoriasmenu = { tipo };
    }

    return await prisma.productos.findMany({
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

  async getProductById(tenantId: number, id: number) {
    return await prisma.productos.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        categoriasmenu: true,
        producto_inventario: true
      }
    });
  },

  async createProduct(tenantId: number, data: CreateProductData) {
    // Verificar que la categoría pertenezca al tenant
    const category = await this.getCategoryById(tenantId, data.categoria_id);
    if (!category) throw new Error('Categoría inválida o no pertenece al tenant');

    return await prisma.productos.create({
      data: {
        ...data,
        tenant_id: tenantId
      }
    });
  },

  async updateProduct(tenantId: number, id: number, data: UpdateProductData) {
    const product = await this.getProductById(tenantId, id);
    if (!product) throw new Error('Producto no encontrado');

    if (data.categoria_id) {
        const category = await this.getCategoryById(tenantId, data.categoria_id);
        if (!category) throw new Error('Categoría inválida');
    }

    return await prisma.productos.update({
      where: { id },
      data
    });
  },

  async deleteProduct(tenantId: number, id: number) {
    const product = await this.getProductById(tenantId, id);
    if (!product) throw new Error('Producto no encontrado');

    return await prisma.productos.delete({
      where: { id }
    });
  }
};
