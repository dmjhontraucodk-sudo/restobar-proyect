"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nominaController = void 0;
const nomina_service_1 = require("../services/nomina.service");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const pagarNominaSchema = zod_1.z.object({
    metodo_pago: zod_1.z.nativeEnum(client_1.pagos_metodo_pago)
});
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
    },
    async pagarNomina(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = parseInt(req.params.id);
            const usuarioPagadorId = req.user?.id;
            if (!tenantId || !usuarioPagadorId || isNaN(empleadoId)) {
                return res.status(400).json({ error: 'Datos de empleado o usuario pagador inválidos.' });
            }
            const validation = pagarNominaSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({ error: 'Método de pago inválido', details: validation.error.issues });
            }
            const { metodo_pago } = validation.data;
            // Permisos: Solo administrador o gerente pueden pagar nómina
            const usuarioActual = await nomina_service_1.nominaService.getEmpleadoById(usuarioPagadorId);
            if (!usuarioActual || (!usuarioActual.es_propietario && usuarioActual.roles.nombre !== 'Gerente')) {
                return res.status(403).json({ error: 'No tienes permisos para pagar nómina.' });
            }
            const result = await nomina_service_1.nominaService.pagarNomina(tenantId, empleadoId, usuarioPagadorId, metodo_pago);
            res.status(200).json({ success: true, message: result.message, montoPagado: result.montoPagado });
        }
        catch (error) {
            console.error('Error al pagar nómina:', error);
            res.status(500).json({ success: false, error: error.message || 'Error interno del servidor al pagar nómina.' });
        }
    }
};
