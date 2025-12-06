"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cajaController = void 0;
const zod_1 = require("zod");
const caja_service_1 = require("../services/caja.service");
const abrirCajaSchema = zod_1.z.object({
    monto_inicial: zod_1.z.number().min(0),
    observaciones: zod_1.z.string().optional(),
});
const cerrarCajaSchema = zod_1.z.object({
    monto_real: zod_1.z.number().min(0),
    observaciones: zod_1.z.string().optional(),
});
const movimientoSchema = zod_1.z.object({
    tipo: zod_1.z.enum(['INGRESO', 'EGRESO']),
    concepto: zod_1.z.string().min(1),
    monto: zod_1.z.number().positive(),
    metodo_pago: zod_1.z.enum(['Efectivo', 'Tarjeta', 'Transferencia', 'Otro']),
    notas: zod_1.z.string().optional(),
});
exports.cajaController = {
    async getEstadoCaja(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = req.user?.id;
            if (!tenantId || !empleadoId)
                return res.status(403).json({ error: 'Acceso no autorizado' });
            const cajaAbierta = await caja_service_1.cajaService.getCajaAbierta(tenantId, empleadoId);
            if (!cajaAbierta)
                return res.status(404).json({ error: 'No tienes caja abierta', message: 'Debes abrir una caja antes de realizar operaciones' });
            const movimientos = cajaAbierta.movimientos;
            // USANDO EL TIPO CORRECTO DE PRISMA
            const ingresos = movimientos.filter((m) => m.tipo === 'INGRESO')
                .reduce((sum, m) => sum + Number(m.monto), 0);
            const egresos = movimientos.filter((m) => m.tipo === 'EGRESO')
                .reduce((sum, m) => sum + Number(m.monto), 0);
            const saldoTeorico = Number(cajaAbierta.monto_inicial) + ingresos - egresos;
            return res.json({
                caja: cajaAbierta,
                resumen: {
                    inicial: Number(cajaAbierta.monto_inicial),
                    ingresos,
                    egresos,
                    saldo_teorico: saldoTeorico
                }
            });
        }
        catch (error) {
            console.error('Error en getEstadoCaja:', error);
            return res.status(500).json({ error: 'Error al obtener estado de caja' });
        }
    },
    async abrirCaja(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = req.user?.id;
            if (!tenantId || !empleadoId)
                return res.status(403).json({ error: 'Acceso no autorizado' });
            const validation = abrirCajaSchema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
            const { monto_inicial, observaciones } = validation.data;
            const nuevaCaja = await caja_service_1.cajaService.abrirCaja(tenantId, empleadoId, monto_inicial, observaciones);
            return res.status(201).json({ success: true, message: 'Caja abierta exitosamente', caja: nuevaCaja });
        }
        catch (error) {
            if (error.message === 'Ya tienes una caja abierta')
                return res.status(400).json({ error: error.message });
            console.error('Error en abrirCaja:', error);
            return res.status(500).json({ error: 'Error al abrir caja' });
        }
    },
    async registrarMovimiento(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = req.user?.id;
            if (!tenantId || !empleadoId)
                return res.status(403).json({ error: 'Acceso no autorizado' });
            const validation = movimientoSchema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
            await caja_service_1.cajaService.registrarMovimiento(tenantId, empleadoId, validation.data);
            return res.json({ success: true, message: 'Movimiento registrado exitosamente' });
        }
        catch (error) {
            console.error('Error en registrarMovimiento:', error);
            return res.status(500).json({ error: error.message || 'Error al registrar movimiento' });
        }
    },
    async cerrarCaja(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = req.user?.id;
            if (!tenantId || !empleadoId)
                return res.status(403).json({ error: 'Acceso no autorizado' });
            const validation = cerrarCajaSchema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
            const cajaCerrada = await caja_service_1.cajaService.cerrarCaja(tenantId, empleadoId, validation.data.monto_real, validation.data.observaciones);
            return res.json({ success: true, message: 'Caja cerrada exitosamente', caja: cajaCerrada });
        }
        catch (error) {
            console.error('Error en cerrarCaja:', error);
            return res.status(500).json({ error: error.message || 'Error al cerrar caja' });
        }
    },
    async getHistorial(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso no autorizado' });
            const historial = await caja_service_1.cajaService.getHistorial(tenantId, req.query);
            return res.json(historial);
        }
        catch (error) {
            console.error('Error en getHistorial:', error);
            return res.status(500).json({ error: 'Error al obtener historial' });
        }
    }
};
