// backend_core/src/controller/app/overview.controller.ts

import { Request, Response, NextFunction } from 'express';
// Ajusta la ruta al servicio de dashboard (debe subir un nivel a 'services')
import { DashboardService } from '../../services/dashboard.service'; 

// Interfaz de Autenticación (tomada de tus controladores existentes)
interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    tenant_id: number;
    rol_id: number;
  };
  tenant?: {
    id: number;
    subdominio: string;
    configuracion: any;
    nombre_empresa?: string;
  };
}

const dashboardService = new DashboardService();

/**
 * GET /api/dashboard/overview
 * Obtiene todas las métricas y gráficos para la página de Visión General.
 */
export const getOverviewData = async (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1. Extraer tenantId del token de usuario
    const tenantId = req.user?.tenant_id;

    if (!tenantId || tenantId !== req.tenant?.id) {
        return res.status(403).json({ error: 'Acceso prohibido. Tenant ID no coincide.' });
    }

    try {
        const data = await dashboardService.getOverviewData(tenantId); 
        res.status(200).json(data);
    } catch (error) {
        console.error('Error en overview.controller.getOverviewData:', error);
        next(error); 
    }
};