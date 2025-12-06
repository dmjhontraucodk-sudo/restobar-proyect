"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nominaController = void 0;
const nomina_service_1 = require("../services/nomina.service");
exports.nominaController = {
    async getNomina(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const userId = req.user?.id;
            if (!tenantId || !userId)
                return res.status(403).json({ error: 'Acceso prohibido' });
            const usuarioActual = await nomina_service_1.nominaService.getEmpleadoById(userId);
            if (!usuarioActual)
                return res.status(404).json({ error: 'Usuario no encontrado' });
            const puedeVer = usuarioActual.es_propietario || usuarioActual.roles.nombre === 'Gerente';
            if (!puedeVer)
                return res.status(403).json({ error: 'No tienes permisos' });
            const result = await nomina_service_1.nominaService.getNomina(tenantId);
            res.json({ success: true, ...result });
        }
        catch (error) {
            console.error('Error en getNomina:', error);
            res.status(500).json({ success: false, error: 'Error interno' });
        }
    },
    async getEstadisticasNomina(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const userId = req.user?.id;
            if (!tenantId || !userId)
                return res.status(403).json({ error: 'Acceso prohibido' });
            const usuarioActual = await nomina_service_1.nominaService.getEmpleadoById(userId);
            if (!usuarioActual)
                return res.status(404).json({ error: 'Usuario no encontrado' });
            const puedeVer = usuarioActual.es_propietario || usuarioActual.roles.nombre === 'Gerente';
            if (!puedeVer)
                return res.status(403).json({ error: 'No tienes permisos' });
            const estadisticas = await nomina_service_1.nominaService.getEstadisticasNomina(tenantId);
            res.json({ success: true, estadisticas });
        }
        catch (error) {
            console.error('Error en getEstadisticasNomina:', error);
            res.status(500).json({ success: false, error: 'Error interno' });
        }
    },
    async calcularPagoEmpleado(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = parseInt(req.params.id);
            if (!tenantId || isNaN(empleadoId))
                return res.status(400).json({ error: 'Datos inválidos' });
            const calculo = await nomina_service_1.nominaService.calcularPago(tenantId, empleadoId);
            res.json(calculo);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al calcular nómina' });
        }
    }
};
