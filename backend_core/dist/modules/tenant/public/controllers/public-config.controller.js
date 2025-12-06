"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicConfigController = void 0;
const prisma_service_1 = require("@shared/database/prisma.service");
exports.publicConfigController = {
    async getPublicConfig(req, res) {
        try {
            const tenantId = req.tenant?.id;
            if (!tenantId) {
                return res.status(400).json({ error: 'Tenant no identificado' });
            }
            const tenant = await prisma_service_1.prisma.tenants.findUnique({
                where: { id: tenantId },
                select: {
                    id: true,
                    subdominio: true,
                    nombre_empresa: true,
                    configuracion: true,
                }
            });
            if (!tenant) {
                return res.status(404).json({ error: 'Tenant no encontrado' });
            }
            return res.json({
                nombre_empresa: tenant.nombre_empresa,
                subdominio: tenant.subdominio,
                configuracion: tenant.configuracion || {}
            });
        }
        catch (error) {
            console.error('Error en getPublicConfig:', error);
            return res.status(500).json({
                error: 'Error al obtener configuración',
                message: error.message
            });
        }
    }
};
