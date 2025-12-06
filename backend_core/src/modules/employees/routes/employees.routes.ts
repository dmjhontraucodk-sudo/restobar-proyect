import { Router } from 'express';
import { empleadosController } from '../controllers/empleados.controller';
import { rolesController } from '../controllers/roles.controller';
import { validateToken } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';
import { verifyTenantAccess } from '@shared/middleware/verifyTenantAccess';

const router = Router();

// Middleware global para todas las rutas de este módulo
router.use(validateToken, tenantMiddleware, verifyTenantAccess);

// ==================== RUTAS DE EMPLEADOS ====================
router.get('/', empleadosController.getAllEmpleados);
router.post('/', empleadosController.createEmpleado);
router.get('/con-acceso', empleadosController.getEmpleadosConAcceso);
// Roles available for employees (operativos)
router.get('/roles', empleadosController.getRoles); 
router.post('/incidencias', empleadosController.registrarIncidencia);

router.get('/:id', empleadosController.getEmpleadoById);
router.patch('/:id', empleadosController.updateEmpleado);
router.delete('/:id', empleadosController.desactivarEmpleado);
router.post('/:id/activar', empleadosController.activarEmpleado);
router.post('/:id/resetear-password', empleadosController.resetearPassword);

// ==================== RUTAS DE ROLES (GESTIÓN) ====================
// Prefijo /roles
// Nota: Estas rutas antes estaban en /roles/todos, /roles/crear, etc.
// Se agruparán bajo un sub-router o se manejarán aquí con prefijo.
// Para mantener compatibilidad con la estructura anterior, podemos usar sub-rutas.

// Rutas de roles
router.get('/roles/todos', rolesController.getAllRoles);
router.post('/roles/crear', rolesController.createRol);
router.patch('/roles/:id', rolesController.updateRol);
router.delete('/roles/:id', rolesController.desactivarRol);
router.post('/roles/:id/activar', rolesController.activarRol);

export default router;
