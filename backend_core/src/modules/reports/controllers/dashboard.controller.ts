import { Response } from 'express';
import { prisma } from '@shared/database/prisma.service';
import { DashboardService } from '../services/dashboard.service';
import { AuthRequest } from '@shared/middleware/auth.middleware';
import { RequestWithTenant } from '@shared/middleware/tenant.middleware';

type DashboardRequest = AuthRequest & RequestWithTenant;

const dashboardService = new DashboardService();

export const dashboardController = {
    async getDashboardInfo(req: DashboardRequest, res: Response) : Promise<any> {
        try {
            const tenantIdFromToken = req.user?.tenant_id;
            const tenantIdFromSubdomain = req.tenant?.id;
            if (!tenantIdFromToken || !tenantIdFromSubdomain || tenantIdFromToken !== tenantIdFromSubdomain) {
                return res.status(403).json({ error: 'Acceso prohibido. No perteneces a este tenant.' });
            }
            const tenantId = tenantIdFromToken;
            const tenantInfo = await prisma.tenants.findUnique({
                where: { id: tenantId },
                select: { id: true, nombre_empresa: true, subdominio: true, isActive: true }
            });
            if (!tenantInfo) {
                return res.status(404).json({ error: 'Tenant no encontrado.' });
            }
            const empleadosDelTenant = await prisma.empleados.findMany({
                where: { tenant_id: tenantId },
                select: { id: true, email: true, is_active: true, rol_id: true }
            });
            res.status(200).json({
                message: `Información exclusiva para el Tenant ID: ${tenantId}`,
                tenant: tenantInfo,
                empleados: empleadosDelTenant,
            });
        } catch (error) {
            console.error('Error en getDashboardInfo:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    async getOverviewData(req: DashboardRequest, res: Response) : Promise<any> {
        const tenantId = req.user?.tenant_id;

        if (!tenantId || tenantId !== req.tenant?.id) {
            return res.status(403).json({ error: 'Acceso prohibido. Tenant ID no coincide.' });
        }

        try {
            const data = await dashboardService.getOverviewData(tenantId); 
            res.status(200).json(data);
        } catch (error) {
            console.error('Error en getOverviewData:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
};
