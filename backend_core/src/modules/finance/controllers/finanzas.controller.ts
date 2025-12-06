import { Response } from 'express';
import { finanzasService } from '../services/finanzas.service';
import { AuthRequest } from '@shared/middleware/auth.middleware';
import { RequestWithTenant } from '@shared/middleware/tenant.middleware';

type FinanceRequest = AuthRequest & RequestWithTenant;

export const finanzasController = {
    async getResumenFinanciero(req: FinanceRequest, res: Response) : Promise<any> {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId) return res.status(403).json({ error: 'Acceso prohibido' });

            const { fechaInicio, fechaFin } = req.query as { fechaInicio?: string; fechaFin?: string };
            const now = new Date();
            const start = fechaInicio ? new Date(fechaInicio as string) : new Date(now.getFullYear(), now.getMonth(), 1);
            const end = fechaFin ? new Date(fechaFin as string) : new Date();
            end.setHours(23, 59, 59, 999);

            const resumen = await finanzasService.getResumen(tenantId, start, end);
            res.json(resumen);
        } catch (error: any) {
            console.error('Error en reporte financiero:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
};
