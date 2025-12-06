"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicTablesController = void 0;
const prisma_service_1 = require("@shared/database/prisma.service");
exports.publicTablesController = {
    /**
     * GET /api/web/mesas/disponibles
     * Obtiene las mesas disponibles del tenant para reservas públicas
     */
    async getAvailableTables(req, res) {
        try {
            const tenantId = req.tenant?.id;
            if (!tenantId) {
                return res.status(400).json({ error: 'Tenant no identificado' });
            }
            // Obtener mesas libres
            const mesasDisponibles = await prisma_service_1.prisma.mesas.findMany({
                where: {
                    tenant_id: tenantId,
                    estado: 'Libre'
                },
                select: {
                    id: true,
                    nombre_o_numero: true,
                    capacidad: true,
                    estado: true,
                },
                orderBy: { nombre_o_numero: 'asc' }
            });
            return res.json(mesasDisponibles);
        }
        catch (error) {
            console.error('Error en getAvailableTables:', error);
            return res.status(500).json({
                error: 'Error al obtener mesas disponibles',
                message: error.message
            });
        }
    }
};
