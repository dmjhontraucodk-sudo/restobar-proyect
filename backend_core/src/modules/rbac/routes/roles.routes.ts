import { Router } from 'express';
import { RolesController } from '../controllers/roles.controller';

const router = Router();
const rolesController = new RolesController();

// Endpoint to get all available navigation items for the UI
router.get('/permissions', rolesController.getNavigationItems);

// Endpoints for roles
router.get('/roles', rolesController.getAllRoles);
router.get('/roles/:id', rolesController.getRoleById);
router.put('/roles/:id/permissions', rolesController.updateRolePermissions);

router.get('/roles/:id/permissions', rolesController.getRolePermissions);

export default router;
