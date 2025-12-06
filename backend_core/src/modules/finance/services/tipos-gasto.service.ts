import { prisma } from '@shared/database/prisma.service';

export interface CreateTipoGastoData {
  nombre: string;
  descripcion?: string;
  afecta_inventario?: boolean;
  color?: string;
  icono?: string;
  orden?: number;
  activo?: boolean;
}

export interface UpdateTipoGastoData {
  nombre?: string;
  descripcion?: string;
  afecta_inventario?: boolean;
  color?: string;
  icono?: string;
  orden?: number;
  activo?: boolean;
}

export const tiposGastoService = {
  async getAll(tenantId: number) {
    return await prisma.tipos_gasto.findMany({
      where: { tenant_id: tenantId },
      orderBy: { nombre: 'asc' }
    });
  },

  async getById(tenantId: number, id: number) {
    return await prisma.tipos_gasto.findFirst({
      where: { id, tenant_id: tenantId }
    });
  },

  async create(tenantId: number, data: CreateTipoGastoData) {
    // Validar nombre único para el tenant
    const existing = await prisma.tipos_gasto.findFirst({
      where: {
        tenant_id: tenantId,
        nombre: data.nombre
      }
    });

    if (existing) {
      throw new Error(`Ya existe un tipo de gasto con el nombre "${data.nombre}" para este restaurante.`);
    }

    return await prisma.tipos_gasto.create({
      data: {
        ...data,
        tenant_id: tenantId
      }
    });
  },

  async update(tenantId: number, id: number, data: UpdateTipoGastoData) {
    const existing = await this.getById(tenantId, id);
    if (!existing) {
      throw new Error('Tipo de gasto no encontrado.');
    }

    // Validar nombre único si se cambia
    if (data.nombre && data.nombre !== existing.nombre) {
      const nameConflict = await prisma.tipos_gasto.findFirst({
        where: {
          tenant_id: tenantId,
          nombre: data.nombre,
          id: { not: id }
        }
      });
      if (nameConflict) {
        throw new Error(`Ya existe un tipo de gasto con el nombre "${data.nombre}" para este restaurante.`);
      }
    }

    return await prisma.tipos_gasto.update({
      where: { id },
      data
    });
  },

  async delete(tenantId: number, id: number) {
    const existing = await this.getById(tenantId, id);
    if (!existing) {
      throw new Error('Tipo de gasto no encontrado.');
    }
    
    // Opcional: Verificar si hay gastos o compras asociadas antes de eliminar
    const gastosCount = await prisma.gastos.count({ where: { tipo_gasto_id: id } });
    const comprasCount = await prisma.compras.count({ where: { tipo_gasto_id: id } });

    if (gastosCount > 0 || comprasCount > 0) {
        throw new Error('No se puede eliminar el tipo de gasto porque tiene gastos o compras asociadas.');
    }

    return await prisma.tipos_gasto.delete({
      where: { id }
    });
  }
};
