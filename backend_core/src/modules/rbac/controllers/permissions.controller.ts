// backend_core/src/modules/rbac/controllers/permissions.controller.ts
import { Request, Response } from 'express';
import { permissionsService } from '../services/permissions.service';
import { ALL_NAVIGATION_ITEMS } from '../constants/navigation.constants';

class PermissionsController {
  /**
   * Obtiene todos los ítems de navegación disponibles como permisos.
   * @param req Request de Express.
   * @param res Response de Express.
   */
  public async getNavigationItems(_req: Request, res: Response): Promise<void> {
    try {
      // Devolver los ALL_NAVIGATION_ITEMS completos, no solo los IDs, para que el frontend tenga labels y paths
      res.status(200).json({ success: true, navigationItems: ALL_NAVIGATION_ITEMS });
    } catch (error: any) {
      console.error('Error getting navigation items:', error);
      res.status(500).json({ success: false, message: 'Error al obtener ítems de navegación.', error: error.message });
    }
  }

  /**
   * Obtiene los permisos de un rol específico.
   * @param req Request de Express, con `roleId` en params.
   * @param res Response de Express.
   */
  public async getRolePermissions(req: Request, res: Response): Promise<void> {
    try {
      const roleId = parseInt(req.params.id, 10);
      if (isNaN(roleId)) {
        res.status(400).json({ success: false, message: 'ID de rol inválido.' });
        return;
      }

      const permissions = await permissionsService.getRolePermissions(roleId);
      res.status(200).json({ success: true, permissions });
    } catch (error: any) {
      console.error(`Error getting permissions for role ${req.params.id}:`, error);
      res.status(500).json({ success: false, message: 'Error al obtener permisos del rol.', error: error.message });
    }
  }

  /**
   * Actualiza los permisos de un rol específico.
   * @param req Request de Express, con `roleId` en params y `permissions` en body.
   * @param res Response de Express.
   */
  public async updateRolePermissions(req: Request, res: Response): Promise<void> {
    try {
      const roleId = parseInt(req.params.id, 10);
      const { permissions } = req.body; // `permissions` se espera como string[]

      if (isNaN(roleId)) {
        res.status(400).json({ success: false, message: 'ID de rol inválido.' });
        return;
      }
      if (!Array.isArray(permissions) || !permissions.every(p => typeof p === 'string')) {
        res.status(400).json({ success: false, message: 'Formato de permisos inválido. Se espera un array de strings.' });
        return;
      }

      await permissionsService.updateRolePermissions(roleId, permissions);
      res.status(200).json({ success: true, message: 'Permisos del rol actualizados exitosamente.' });
    } catch (error: any) {
      console.error(`Error updating permissions for role ${req.params.id}:`, error);
      res.status(500).json({ success: false, message: 'Error al actualizar permisos del rol.', error: error.message });
    }
  }
}

export const permissionsController = new PermissionsController();