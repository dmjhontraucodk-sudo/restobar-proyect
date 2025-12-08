import { Router } from 'express';
import { rolePerformanceController } from '../controllers/role-performance.controller';

const router = Router();

// Endpoint para obtener la lista de roles para el reporte
router.get('/performance/roles', rolePerformanceController.getRolesList);

// Endpoint para obtener la lista de empleados de un rol específico
router.get('/performance/employees-by-role/:roleId', rolePerformanceController.getEmployeesByRoleList);

// Endpoint para obtener el reporte de desempeño de un empleado específico
// GET /api/dashboard/reports/performance/employee/123?fechaInicio=2024-01-01&fechaFin=2024-01-31
router.get('/performance/employee/:employeeId', rolePerformanceController.getEmployeePerformanceReport);

export default router;