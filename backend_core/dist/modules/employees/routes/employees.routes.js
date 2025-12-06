"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const empleados_controller_1 = require("../controllers/empleados.controller");
const roles_controller_1 = require("../controllers/roles.controller");
const auth_middleware_1 = require("@shared/middleware/auth.middleware");
const tenant_middleware_1 = require("@shared/middleware/tenant.middleware");
const verifyTenantAccess_1 = require("@shared/middleware/verifyTenantAccess");
const router = (0, express_1.Router)();
// Middleware global para todas las rutas de este módulo
router.use(auth_middleware_1.validateToken, tenant_middleware_1.tenantMiddleware, verifyTenantAccess_1.verifyTenantAccess);
// ==================== RUTAS DE EMPLEADOS ====================
router.get('/', empleados_controller_1.empleadosController.getAllEmpleados);
router.post('/', empleados_controller_1.empleadosController.createEmpleado);
router.get('/con-acceso', empleados_controller_1.empleadosController.getEmpleadosConAcceso);
// Roles available for employees (operativos)
router.get('/roles', empleados_controller_1.empleadosController.getRoles);
router.post('/incidencias', empleados_controller_1.empleadosController.registrarIncidencia);
router.get('/:id', empleados_controller_1.empleadosController.getEmpleadoById);
router.patch('/:id', empleados_controller_1.empleadosController.updateEmpleado);
router.delete('/:id', empleados_controller_1.empleadosController.desactivarEmpleado);
router.post('/:id/activar', empleados_controller_1.empleadosController.activarEmpleado);
router.post('/:id/resetear-password', empleados_controller_1.empleadosController.resetearPassword);
// ==================== RUTAS DE ROLES (GESTIÓN) ====================
// Prefijo /roles
// Nota: Estas rutas antes estaban en /roles/todos, /roles/crear, etc.
// Se agruparán bajo un sub-router o se manejarán aquí con prefijo.
// Para mantener compatibilidad con la estructura anterior, podemos usar sub-rutas.
// Rutas de roles
router.get('/roles/todos', roles_controller_1.rolesController.getAllRoles);
router.post('/roles/crear', roles_controller_1.rolesController.createRol);
router.patch('/roles/:id', roles_controller_1.rolesController.updateRol);
router.delete('/roles/:id', roles_controller_1.rolesController.desactivarRol);
router.post('/roles/:id/activar', roles_controller_1.rolesController.activarRol);
exports.default = router;
