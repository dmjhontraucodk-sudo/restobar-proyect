"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tiposGastoController = void 0;
const tipos_gasto_service_1 = require("../services/tipos-gasto.service");
exports.tiposGastoController = {
    async getAll(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso no autorizado' });
            const tiposGasto = await tipos_gasto_service_1.tiposGastoService.getAll(tenantId);
            res.json(tiposGasto);
        }
        catch (error) {
            console.error('Error getting tipos de gasto:', error);
            res.status(500).json({ error: error.message });
        }
    },
    async getById(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const id = parseInt(req.params.id);
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso no autorizado' });
            const tipoGasto = await tipos_gasto_service_1.tiposGastoService.getById(tenantId, id);
            if (!tipoGasto)
                return res.status(404).json({ error: 'Tipo de gasto no encontrado' });
            res.json(tipoGasto);
        }
        catch (error) {
            console.error('Error getting tipo de gasto:', error);
            res.status(500).json({ error: error.message });
        }
    },
    async create(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso no autorizado' });
            const newTipoGasto = await tipos_gasto_service_1.tiposGastoService.create(tenantId, req.body);
            res.status(201).json(newTipoGasto);
        }
        catch (error) {
            console.error('Error creating tipo de gasto:', error);
            res.status(500).json({ error: error.message });
        }
    },
    async update(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const id = parseInt(req.params.id);
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso no autorizado' });
            const updatedTipoGasto = await tipos_gasto_service_1.tiposGastoService.update(tenantId, id, req.body);
            res.json(updatedTipoGasto);
        }
        catch (error) {
            console.error('Error updating tipo de gasto:', error);
            res.status(500).json({ error: error.message });
        }
    },
    async delete(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const id = parseInt(req.params.id);
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso no autorizado' });
            await tipos_gasto_service_1.tiposGastoService.delete(tenantId, id);
            res.json({ message: 'Tipo de gasto eliminado exitosamente' });
        }
        catch (error) {
            console.error('Error deleting tipo de gasto:', error);
            res.status(500).json({ error: error.message });
        }
    }
};
