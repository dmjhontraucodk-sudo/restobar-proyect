"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsController = void 0;
const zod_1 = require("zod");
const reports_service_1 = require("../../services/reports.service");
// Esquema Zod para validar los filtros de fecha (opcionales)
const dateRangeSchema = zod_1.z.object({
    fechaInicio: zod_1.z.string().optional(),
    fechaFin: zod_1.z.string().optional(),
});
exports.reportsController = {
    /**
     * GET /api/dashboard/reports/sales/summary
     * Obtiene el resumen de ventas (KPIs y tendencia diaria) para un rango de fecha.
     */
    async getSalesSummary(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            // 1. Validar y procesar fechas
            const validation = dateRangeSchema.safeParse(req.query);
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Filtros de fecha inválidos',
                    details: validation.error.issues
                });
            }
            const { fechaInicio, fechaFin } = validation.data;
            // Definir rango de fechas por defecto: Últimos 7 días (ajustable en el frontend)
            let startDate = new Date();
            let endDate = new Date();
            if (fechaInicio && fechaFin) {
                // Si se proporcionan, usarlos
                startDate = new Date(fechaInicio);
                endDate = new Date(fechaFin);
                // Asegurarse de que endDate incluya hasta el final del día
                endDate.setHours(23, 59, 59, 999);
            }
            else {
                // Si no se proporcionan, usar el rango de 7 días hacia atrás
                endDate.setHours(23, 59, 59, 999);
                startDate = new Date(endDate);
                startDate.setDate(endDate.getDate() - 7);
                startDate.setHours(0, 0, 0, 0);
            }
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return res.status(400).json({ error: 'Rango de fechas no válido.' });
            }
            // 2. Llamar al servicio
            const summary = await reports_service_1.reportsService.getSalesSummaryByDateRange(tenantId, {
                startDate,
                endDate
            });
            // 3. Devolver respuesta. Nota: Prisma devuelve Decimales, los convertimos en el servicio.
            return res.status(200).json(summary);
        }
        catch (error) {
            console.error('Error en getSalesSummary:', error);
            return res.status(500).json({ error: 'Error interno del servidor al obtener el resumen de ventas.' });
        }
    },
    /**
     * GET /api/dashboard/reports/inventory/summary
     * Obtiene el resumen de Inventario (KPIs de stock y mermas por cierre).
     */
    async getInventorySummary(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            // Validar fechas (útil para filtrar compras o cierres)
            const validation = dateRangeSchema.safeParse(req.query);
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Filtros de fecha inválidos',
                    details: validation.error.issues
                });
            }
            const { fechaInicio, fechaFin } = validation.data;
            // Lógica de fechas (Por defecto: todo el mes actual)
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
    /**
     * GET /api/dashboard/reports/finance/summary
     * Obtiene el resumen de Finanzas (KPIs de caja, gastos y tendencias de pago).
     */
    async getFinanceSummary(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            // 1. Validar y procesar fechas
            const validation = dateRangeSchema.safeParse(req.query);
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Filtros de fecha inválidos',
                    details: validation.error.issues
                });
            }
            const { fechaInicio, fechaFin } = validation.data;
            // Lógica de fechas (Por defecto: últimos 30 días)
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
            // 2. Llamar al servicio
            const summary = await reports_service_1.reportsService.getFinanceSummaryByDateRange(tenantId, {
                startDate,
                endDate
            });
            // 3. Devolver respuesta
            return res.status(200).json(summary);
        }
        catch (error) {
            console.error('Error en getFinanceSummary:', error);
            return res.status(500).json({ error: 'Error interno del servidor al obtener el resumen financiero.' });
        }
    },
};
