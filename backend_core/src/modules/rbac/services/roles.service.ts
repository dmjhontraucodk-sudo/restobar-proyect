import { prisma } from '@shared/database/prisma.service';
import { ALL_NAVIGATION_ITEMS, NavigationItem } from '../constants/navigation.constants';

export class RolesService {
  async getAllRoles() {
    return prisma.roles.findMany({
        where: {
            activo: true,
        }
    });
  }

  async getRoleById(id: number) {
    return prisma.roles.findUnique({
      where: { id },
    });
  }

  async updateRolePermissions(id: number, permissions: string[]) {
    // Validate that all permissions are valid
    const validPermissionIds = new Set(ALL_NAVIGATION_ITEMS.map((item: NavigationItem) => item.id));
    for (const p of permissions) {
        if (!validPermissionIds.has(p)) {
            throw new Error(`Invalid permission: ${p}`);
        }
    }

    const permissionsJson = permissions as any; // Prisma maneja JSON como `any`

    return prisma.roles.update({
      where: { id },
      data: { permissions: permissionsJson },
    });
  }

  async getRolePermissions(id: number): Promise<string[]> {
    const role = await this.getRoleById(id);
    if (!role || !role.permissions) {
        return [];
    }
    try {
        // Here we should also validate the permissions against the current navigation items
        // to filter out outdated permissions.
        const rolePermissions = role.permissions as string[]; // Cast directly from Json?
        const validPermissionIds = new Set(ALL_NAVIGATION_ITEMS.map((item: NavigationItem) => item.id));
        return rolePermissions.filter(p => validPermissionIds.has(p));
    } catch (error) {
        return [];
    }
  }
}
