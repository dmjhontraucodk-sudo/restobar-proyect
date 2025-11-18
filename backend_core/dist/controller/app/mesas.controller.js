"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mesasController = void 0;
// import { CustomRequest } from '../../types'; // NO USAMOS ESTA RUTA ERRÓNEA
const mesas_service_1 = require("../../services/mesas.service");
// --- FIN AuthRequest ---
exports.mesasController = {
    // GET /api/dashboard/mesas
    async getAllMesas(req, res, next) {
        try {
            // Usamos req.user?.tenant_id ya que la ruta está protegida por validateToken
            const tenantId = req.user?.tenant_id;
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            const mesas = await mesas_service_1.mesasService.getAllMesas(tenantId);
            res.json(mesas);
        }
        catch (error) {
            next(error);
        }
    },
    // POST /api/dashboard/mesas
    async createMesa(req, res, next) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            const mesa = await mesas_service_1.mesasService.createMesa(tenantId, req.body);
            res.status(201).json(mesa);
        }
        catch (error) {
            next(error);
        }
    },
    // PATCH /api/dashboard/mesas/:id
    async updateMesa(req, res, next) {
        try {
            const tenantId = req.user?.tenant_id;
            const mesaId = parseInt(req.params.id, 10);
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            if (req.body.estado) {
                const updatedMesa = await mesas_service_1.mesasService.updateMesaState(tenantId, mesaId, req.body.estado);
                return res.json(updatedMesa);
            }
            const updatedMesa = await mesas_service_1.mesasService.updateMesa(tenantId, mesaId, req.body);
            res.json(updatedMesa);
        }
        catch (error) {
            next(error);
        }
    },
    // DELETE /api/dashboard/mesas/:id
    async deleteMesa(req, res, next) {
        try {
            const tenantId = req.user?.tenant_id;
            const mesaId = parseInt(req.params.id, 10);
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            const deletedMesa = await mesas_service_1.mesasService.deleteMesa(tenantId, mesaId);
            res.json({ message: 'Mesa eliminada correctamente', mesa: deletedMesa });
        }
        catch (error) {
            next(error);
        }
    }
};
