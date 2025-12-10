// backend_core/src/modules/rbac/services/permissions.service.ts
import { PrismaClient } from '@prisma/client';
import { ALL_NAVIGATION_ITEMS } from '../constants/navigation.constants';

const prisma = new PrismaClient();

class PermissionsService {
  /**
   * Obtiene todos los ítems de navegación disponibles que pueden ser asignados como permisos.
   * @returns {string[]} Un array de IDs de ítems de navegación.
   */
  public getAllNavigationItemIds(): string[] {
    return ALL_NAVIGATION_ITEMS.map(item => item.id);
  }

  /**
   * Obtiene los permisos (ítems de navegación) asignados a un rol específico.
   * @param roleId El ID del rol.
   * @returns {Promise<string[]>} Un array de IDs de ítems de navegación asignados al rol.
   */
  public async getRolePermissions(roleId: number): Promise<string[]> {
    const role = await prisma.roles.findUnique({
      where: { id: roleId },
      select: { permissions: true },
    });

    // Asegurarse de que `permissions` sea un array de strings, incluso si es null/undefined
    return (role?.permissions as string[] | null | undefined) || [];
  }

  /**
   * Actualiza los permisos (ítems de navegación) para un rol específico.
   * @param roleId El ID del rol.
   * @param permissions Un array de IDs de ítems de navegación a asignar al rol.
   * @returns {Promise<void>}
   */
  public async updateRolePermissions(roleId: number, permissions: string[]): Promise<void> {
    await prisma.roles.update({
      where: { id: roleId },
      data: {
        permissions: permissions as any, // Prisma maneja JSON como `any`
      },
    });
  }
}

export const permissionsService = new PermissionsService();