import { Request, Response } from 'express';
import { RolesService } from '../services/roles.service';
import { ALL_NAVIGATION_ITEMS } from '../constants/navigation.constants';

const rolesService = new RolesService();

export class RolesController {
  async getAllRoles(_req: Request, res: Response) {
    try {
      const roles = await rolesService.getAllRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: 'Error getting roles', error });
    }
  }

  async getRoleById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const role = await rolesService.getRoleById(id);
      if (role) {
        res.json(role);
      } else {
        res.status(404).json({ message: 'Role not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error getting role', error });
    }
  }

  async updateRolePermissions(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const { permissions } = req.body; // Expect an array of permission IDs

      if (!Array.isArray(permissions)) {
        res.status(400).json({ message: 'Permissions must be an array' });
        return;
      }

      await rolesService.updateRolePermissions(id, permissions);
      res.json({ success: true, message: 'Permisos del rol actualizados exitosamente.' });
    } catch (error) {
        const err = error as Error;
        if (err.message.includes('Invalid permission')) {
            res.status(400).json({ message: err.message });
            return;
        }
        res.status(500).json({ message: 'Error updating role permissions', error: err.message });
    }
  }
  
  async getNavigationItems(_req: Request, res: Response) {
    try {
        res.json({ success: true, navigationItems: ALL_NAVIGATION_ITEMS });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error getting navigation items', error });
    }
  }

  async getRolePermissions(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const permissions = await rolesService.getRolePermissions(id);
      res.json({ success: true, permissions });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error getting role permissions', error });
    }
  }
}
