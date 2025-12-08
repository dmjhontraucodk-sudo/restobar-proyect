import { Request, Response } from 'express';
import { rolePerformanceService } from '../services/role-performance.service';

/**
 * Controlador para obtener el reporte de desempeño de un empleado específico.
 */
const getEmployeePerformanceReport = async (req: Request, res: Response): Promise<void | Response> => {
    const { id: tenantId } = (req as any).tenant;
    const employeeId = parseInt(req.params.employeeId, 10);

    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
        return res.status(400).json({ message: 'Los parámetros fechaInicio y fechaFin son requeridos.' });
    }
    if (isNaN(employeeId)) {
        return res.status(400).json({ message: 'El ID del empleado es inválido.' });
    }

    try {
        const startDate = new Date(fechaInicio as string);
        const endDate = new Date(fechaFin as string);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({ message: 'Formato de fecha inválido.' });
        }
        
        const performanceData = await rolePerformanceService.getEmployeePerformance(employeeId, tenantId, startDate, endDate);
        
        res.status(200).json(performanceData);

    } catch (error: any) {
        console.error(`Error al generar reporte para el empleado ${employeeId}:`, error);
        res.status(500).json({ message: 'Error interno del servidor al generar el reporte.', error: error.message });
    }
};

/**
 * Controlador para obtener la lista de roles.
 */
const getRolesList = async (_req: Request, res: Response): Promise<void> => {
    try {
        const roles = await rolePerformanceService.getRoles();
        res.status(200).json(roles);
    } catch (error: any) {
        console.error('Error al obtener la lista de roles:', error);
        res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
    }
};

/**
 * Controlador para obtener la lista de empleados por un rol.
 */
const getEmployeesByRoleList = async (req: Request, res: Response): Promise<void | Response> => {
    const { id: tenantId } = (req as any).tenant;
    const roleId = parseInt(req.params.roleId, 10);

    if (isNaN(roleId)) {
        return res.status(400).json({ message: 'El ID del rol es inválido.' });
    }

    try {
        const employees = await rolePerformanceService.getEmployeesByRole(tenantId, roleId);
        res.status(200).json(employees);
    } catch (error: any) {
        console.error(`Error al obtener empleados para el rol ${roleId}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
    }
};

export const rolePerformanceController = {
    getEmployeePerformanceReport,
    getRolesList,
    getEmployeesByRoleList
};