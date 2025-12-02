"use strict";
// backend_core/src/controller/app/overview.controller.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOverviewData = void 0;
// Ajusta la ruta al servicio de dashboard (debe subir un nivel a 'services')
const dashboard_service_1 = require("../../services/dashboard.service");
const dashboardService = new dashboard_service_1.DashboardService();
/**
 * GET /api/dashboard/overview
 * Obtiene todas las métricas y gráficos para la página de Visión General.
 */
const getOverviewData = async (req, res, next) => {
    // 1. Extraer tenantId del token de usuario
    const tenantId = req.user?.tenant_id;
    if (!tenantId || tenantId !== req.tenant?.id) {
        return res.status(403).json({ error: 'Acceso prohibido. Tenant ID no coincide.' });
    }
    try {
        const data = await dashboardService.getOverviewData(tenantId);
        res.status(200).json(data);
    }
    catch (error) {
        console.error('Error en overview.controller.getOverviewData:', error);
        next(error);
    }
};
exports.getOverviewData = getOverviewData;
