"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.comprasController = void 0;
const compras_service_1 = require("../services/compras.service");
exports.comprasController = {
    async getAll(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso no autorizado' });
            const compras = await compras_service_1.comprasService.getAll(tenantId, req.query);
            res.json(compras);
        }
        catch (error) {
            console.error('Error getting compras:', error);
            res.status(500).json({ error: error.message });
        }
    },
    async getById(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const id = parseInt(req.params.id);
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso no autorizado' });
            const compra = await compras_service_1.comprasService.getById(tenantId, id);
            if (!compra)
                return res.status(404).json({ error: 'Compra no encontrada' });
            res.json(compra);
        }
        catch (error) {
            console.error('Error getting compra:', error);
            res.status(500).json({ error: error.message });
        }
    },
    async create(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso no autorizado' });
            const newCompra = await compras_service_1.comprasService.create(tenantId, req.body);
            res.status(201).json(newCompra);
        }
        catch (error) {
            console.error('Error creating compra:', error);
            res.status(500).json({ error: error.message });
        }
    },
    async update(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const id = parseInt(req.params.id);
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso no autorizado' });
            const updatedCompra = await compras_service_1.comprasService.update(tenantId, id, req.body);
            res.json(updatedCompra);
        }
        catch (error) {
            console.error('Error updating compra:', error);
            res.status(500).json({ error: error.message });
        }
    },
    async delete(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const id = parseInt(req.params.id);
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso no autorizado' });
            await compras_service_1.comprasService.delete(tenantId, id);
            res.json({ message: 'Compra eliminada exitosamente' });
        }
        catch (error) {
            console.error('Error deleting compra:', error);
            res.status(500).json({ error: error.message });
        }
    },
    async receiveCompra(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const id = parseInt(req.params.id);
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso no autorizado' });
            const receivedCompra = await compras_service_1.comprasService.receiveCompra(tenantId, id);
            res.json(receivedCompra);
        }
        catch (error) {
            console.error('Error receiving compra:', error);
            res.status(500).json({ error: error.message });
        }
    }
};
