"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardController = void 0;
const prisma_service_1 = require("@shared/database/prisma.service");
const dashboard_service_1 = require("../services/dashboard.service");
const dashboardService = new dashboard_service_1.DashboardService();
exports.dashboardController = {
    async getDashboardInfo(req, res) {
        try {
            const tenantIdFromToken = req.user?.tenant_id;
            const tenantIdFromSubdomain = req.tenant?.id;
            if (!tenantIdFromToken || !tenantIdFromSubdomain || tenantIdFromToken !== tenantIdFromSubdomain) {
                return res.status(403).json({ error: 'Acceso prohibido. No perteneces a este tenant.' });
            }
            const tenantId = tenantIdFromToken;
            const tenantInfo = await prisma_service_1.prisma.tenants.findUnique({
                where: { id: tenantId },
                select: { id: true, nombre_empresa: true, subdominio: true, isActive: true }
            });
            if (!tenantInfo) {
                return res.status(404).json({ error: 'Tenant no encontrado.' });
            }
            const empleadosDelTenant = await prisma_service_1.prisma.empleados.findMany({
                where: { tenant_id: tenantId },
                select: { id: true, email: true, is_active: true, rol_id: true }
            });
            res.status(200).json({
                message: `Información exclusiva para el Tenant ID: ${tenantId}`,
                tenant: tenantInfo,
                empleados: empleadosDelTenant,
            });
        }
        catch (error) {
            console.error('Error en getDashboardInfo:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },
    async getOverviewData(req, res) {
        const tenantId = req.user?.tenant_id;
        if (!tenantId || tenantId !== req.tenant?.id) {
            return res.status(403).json({ error: 'Acceso prohibido. Tenant ID no coincide.' });
        }
        try {
            const data = await dashboardService.getOverviewData(tenantId);
            res.status(200).json(data);
        }
        catch (error) {
            console.error('Error en getOverviewData:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
};
