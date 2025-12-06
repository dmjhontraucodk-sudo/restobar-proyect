"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsController = void 0;
const zod_1 = require("zod");
const reports_service_1 = require("../services/reports.service");
const dateRangeSchema = zod_1.z.object({
    fechaInicio: zod_1.z.string().optional(),
    fechaFin: zod_1.z.string().optional(),
});
exports.reportsController = {
    async getSalesSummary(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            const validation = dateRangeSchema.safeParse(req.query);
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Filtros de fecha inválidos',
                    details: validation.error.issues
                });
            }
            const { fechaInicio, fechaFin } = validation.data;
            let startDate = new Date();
            let endDate = new Date();
            if (fechaInicio && fechaFin) {
                startDate = new Date(fechaInicio);
                endDate = new Date(fechaFin);
                endDate.setHours(23, 59, 59, 999);
            }
            else {
                endDate.setHours(23, 59, 59, 999);
                startDate = new Date(endDate);
                startDate.setDate(endDate.getDate() - 7);
                startDate.setHours(0, 0, 0, 0);
            }
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return res.status(400).json({ error: 'Rango de fechas no válido.' });
            }
            const summary = await reports_service_1.reportsService.getSalesSummaryByDateRange(tenantId, {
                startDate,
                endDate
            });
            return res.status(200).json(summary);
        }
        catch (error) {
            console.error('Error en getSalesSummary:', error);
            return res.status(500).json({ error: 'Error interno del servidor al obtener el resumen de ventas.' });
        }
    },
    async getInventorySummary(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            const validation = dateRangeSchema.safeParse(req.query);
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Filtros de fecha inválidos',
                    details: validation.error.issues
                });
            }
            const { fechaInicio, fechaFin } = validation.data;
            let startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            let endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);
            if (fechaInicio && fechaFin) {
                startDate = new Date(fechaInicio);
                endDate = new Date(fechaFin);
                endDate.setHours(23, 59, 59, 999);
            }
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return res.status(400).json({ error: 'Rango de fechas no válido.' });
            }
            const summary = await reports_service_1.reportsService.getInventorySummaryAndAlerts(tenantId, { startDate, endDate });
            return res.status(200).json(summary);
        }
        catch (error) {
            console.error('Error en getInventorySummary:', error);
            return res.status(500).json({ error: 'Error interno del servidor al obtener el resumen de inventario.' });
        }
    },
    async getFinanceSummary(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            const validation = dateRangeSchema.safeParse(req.query);
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Filtros de fecha inválidos',
                    details: validation.error.issues
                });
            }
            const { fechaInicio, fechaFin } = validation.data;
            let endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
            let startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 30);
            startDate.setHours(0, 0, 0, 0);
            if (fechaInicio && fechaFin) {
                startDate = new Date(fechaInicio);
                endDate = new Date(fechaFin);
                endDate.setHours(23, 59, 59, 999);
            }
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return res.status(400).json({ error: 'Rango de fechas no válido.' });
            }
            const summary = await reports_service_1.reportsService.getFinanceSummaryByDateRange(tenantId, {
                startDate,
                endDate
            });
            return res.status(200).json(summary);
        }
        catch (error) {
            console.error('Error en getFinanceSummary:', error);
            return res.status(500).json({ error: 'Error interno del servidor al obtener el resumen financiero.' });
        }
    },
};
