"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gastosController = void 0;
const gastos_service_1 = require("../services/gastos.service");
exports.gastosController = {
    async getAll(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso no autorizado' });
            const gastos = await gastos_service_1.gastosService.getAll(tenantId);
            return res.json(gastos);
        }
        catch (error) {
            return res.status(500).json({ error: 'Error al obtener gastos' });
        }
    },
    async getById(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const id = parseInt(req.params.id);
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso no autorizado' });
            const gasto = await gastos_service_1.gastosService.getById(tenantId, id);
            if (!gasto)
                return res.status(404).json({ error: 'Gasto no encontrado' });
            return res.json(gasto);
        }
        catch (error) {
            return res.status(500).json({ error: 'Error al obtener gasto' });
        }
    },
    async create(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const userId = req.user?.id;
            if (!tenantId || !userId)
                return res.status(403).json({ error: 'Acceso no autorizado' });
            const gasto = await gastos_service_1.gastosService.create(tenantId, userId, req.body);
            return res.status(201).json(gasto);
        }
        catch (error) {
            console.error('Error al crear gasto:', error);
            return res.status(500).json({ error: 'Error al crear gasto' });
        }
    },
    async update(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const id = parseInt(req.params.id);
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso no autorizado' });
            const gasto = await gastos_service_1.gastosService.update(tenantId, id, req.body);
            return res.json(gasto);
        }
        catch (error) {
            return res.status(500).json({ error: 'Error al actualizar gasto' });
        }
    },
    async delete(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const id = parseInt(req.params.id);
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso no autorizado' });
            await gastos_service_1.gastosService.delete(tenantId, id);
            return res.json({ message: 'Gasto eliminado correctamente' });
        }
        catch (error) {
            return res.status(500).json({ error: 'Error al eliminar gasto' });
        }
    },
    async getEstadisticas(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso no autorizado' });
            // Extraer parámetros del query (agregamos guion bajo para indicar que no se usan aún)
            const { fechaInicio: _fechaInicio, fechaFin: _fechaFin } = req.query;
            // Por ahora retornamos un placeholder o implementamos la lógica
            const estadisticas = await gastos_service_1.gastosService.getEstadisticas(tenantId, {
                fechaInicio: _fechaInicio,
                fechaFin: _fechaFin
            });
            return res.json(estadisticas);
        }
        catch (error) {
            return res.status(500).json({ error: 'Error al obtener estadísticas' });
        }
    }
};
