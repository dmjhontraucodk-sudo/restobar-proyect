"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finanzasController = void 0;
const finanzas_service_1 = require("../services/finanzas.service");
exports.finanzasController = {
    async getResumenFinanciero(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso prohibido' });
            const { fechaInicio, fechaFin } = req.query;
            const now = new Date();
            const start = fechaInicio ? new Date(fechaInicio) : new Date(now.getFullYear(), now.getMonth(), 1);
            const end = fechaFin ? new Date(fechaFin) : new Date();
            end.setHours(23, 59, 59, 999);
            const resumen = await finanzas_service_1.finanzasService.getResumen(tenantId, start, end);
            res.json(resumen);
        }
        catch (error) {
            console.error('Error en reporte financiero:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
};
