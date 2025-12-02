"use strict";
// backend_core/src/controller/app/caja.controller.ts - COMPLETO
Object.defineProperty(exports, "__esModule", { value: true });
exports.cajaController = void 0;
const prisma_1 = require("../../lib/prisma");
const zod_1 = require("zod");
// Esquemas de validación
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
    // ✅ OBTENER ESTADO ACTUAL DE CAJA
    async getEstadoCaja(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = req.user?.id;
            if (!tenantId || !empleadoId) {
                return res.status(403).json({ error: 'Acceso no autorizado' });
            }
            // Buscar caja abierta del usuario
            const cajaAbierta = await prisma_1.prisma.cajas.findFirst({
                where: {
                    tenant_id: tenantId,
                    usuario_responsable_id: empleadoId,
                    estado: 'Abierta'
                },
                include: {
                    movimientos: {
                        orderBy: { fecha_hora: 'desc' }
                    }
                }
            });
            if (!cajaAbierta) {
                return res.status(404).json({
                    error: 'No tienes caja abierta',
                    message: 'Debes abrir una caja antes de realizar operaciones'
                });
            }
            // Calcular resumen
            const movimientos = cajaAbierta.movimientos;
            const ingresos = movimientos
                .filter(m => m.tipo === 'INGRESO')
                .reduce((sum, m) => sum + Number(m.monto), 0);
            const egresos = movimientos
                .filter(m => m.tipo === 'EGRESO')
                .reduce((sum, m) => sum + Number(m.monto), 0);
            const saldoTeorico = Number(cajaAbierta.monto_inicial) + ingresos - egresos;
            return res.json({
                caja: cajaAbierta,
                resumen: {
                    inicial: Number(cajaAbierta.monto_inicial),
                    ingresos: ingresos,
                    egresos: egresos,
                    saldo_teorico: saldoTeorico
                }
            });
        }
        catch (error) {
            console.error('Error en getEstadoCaja:', error);
            return res.status(500).json({ error: 'Error al obtener estado de caja' });
        }
    },
    // ✅ ABRIR CAJA
    async abrirCaja(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = req.user?.id;
            if (!tenantId || !empleadoId) {
                return res.status(403).json({ error: 'Acceso no autorizado' });
            }
            const validation = abrirCajaSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Datos inválidos',
                    details: validation.error.issues
                });
            }
            // Verificar que no tenga otra caja abierta
            const cajaExistente = await prisma_1.prisma.cajas.findFirst({
                where: {
                    tenant_id: tenantId,
                    usuario_responsable_id: empleadoId,
                    estado: 'Abierta'
                }
            });
            if (cajaExistente) {
                return res.status(400).json({
                    error: 'Ya tienes una caja abierta',
                    caja_id: cajaExistente.id
                });
            }
            const { monto_inicial, observaciones } = validation.data;
            // Crear nueva caja
            const nuevaCaja = await prisma_1.prisma.cajas.create({
                data: {
                    tenant_id: tenantId,
                    usuario_responsable_id: empleadoId,
                    monto_inicial: monto_inicial,
                    monto_esperado: monto_inicial,
                    estado: 'Abierta',
                    observaciones: observaciones,
                }
            });
            console.log(`✅ Caja abierta #${nuevaCaja.id} por empleado #${empleadoId}`);
            return res.status(201).json({
                success: true,
                message: 'Caja abierta exitosamente',
                caja: nuevaCaja
            });
        }
        catch (error) {
            console.error('Error en abrirCaja:', error);
            return res.status(500).json({ error: 'Error al abrir caja' });
        }
    },
    // ✅ REGISTRAR MOVIMIENTO MANUAL
    async registrarMovimiento(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = req.user?.id;
            if (!tenantId || !empleadoId) {
                return res.status(403).json({ error: 'Acceso no autorizado' });
            }
            const validation = movimientoSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Datos inválidos',
                    details: validation.error.issues
                });
            }
            // Buscar caja abierta
            const cajaAbierta = await prisma_1.prisma.cajas.findFirst({
                where: {
                    tenant_id: tenantId,
                    usuario_responsable_id: empleadoId,
                    estado: 'Abierta'
                }
            });
            if (!cajaAbierta) {
                return res.status(404).json({
                    error: 'No tienes caja abierta',
                    message: 'Debes abrir una caja antes de registrar movimientos'
                });
            }
            const { tipo, concepto, monto, metodo_pago, notas } = validation.data;
            await prisma_1.prisma.$transaction(async (tx) => {
                // Crear movimiento
                await tx.cajas_movimientos.create({
                    data: {
                        tenant_id: tenantId,
                        caja_id: cajaAbierta.id,
                        usuario_id: empleadoId,
                        tipo: tipo,
                        concepto: concepto,
                        monto: monto,
                        metodo_pago: metodo_pago,
                        notas: notas,
                    }
                });
                // Actualizar monto esperado en caja
                const incremento = tipo === 'INGRESO' ? monto : -monto;
                await tx.cajas.update({
                    where: { id: cajaAbierta.id },
                    data: {
                        monto_esperado: { increment: incremento }
                    }
                });
            });
            console.log(`✅ Movimiento registrado: ${tipo} S/ ${monto}`);
            return res.json({
                success: true,
                message: 'Movimiento registrado exitosamente'
            });
        }
        catch (error) {
            console.error('Error en registrarMovimiento:', error);
            return res.status(500).json({ error: 'Error al registrar movimiento' });
        }
    },
    // ✅ CERRAR CAJA
    async cerrarCaja(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = req.user?.id;
            if (!tenantId || !empleadoId) {
                return res.status(403).json({ error: 'Acceso no autorizado' });
            }
            const validation = cerrarCajaSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Datos inválidos',
                    details: validation.error.issues
                });
            }
            // Buscar caja abierta
            const cajaAbierta = await prisma_1.prisma.cajas.findFirst({
                where: {
                    tenant_id: tenantId,
                    usuario_responsable_id: empleadoId,
                    estado: 'Abierta'
                }
            });
            if (!cajaAbierta) {
                return res.status(404).json({
                    error: 'No tienes caja abierta',
                    message: 'No hay caja para cerrar'
                });
            }
            const { monto_real, observaciones } = validation.data;
            const montoEsperado = Number(cajaAbierta.monto_esperado);
            const diferencia = monto_real - montoEsperado;
            // Cerrar caja
            const cajaCerrada = await prisma_1.prisma.cajas.update({
                where: { id: cajaAbierta.id },
                data: {
                    estado: 'Cerrada',
                    fecha_cierre: new Date(),
                    monto_real: monto_real,
                    diferencia: diferencia,
                    observaciones: observaciones
                        ? `${cajaAbierta.observaciones || ''}\n--- CIERRE ---\n${observaciones}`
                        : cajaAbierta.observaciones
                }
            });
            console.log(`✅ Caja cerrada #${cajaCerrada.id} - Diferencia: S/ ${diferencia.toFixed(2)}`);
            return res.json({
                success: true,
                message: 'Caja cerrada exitosamente',
                caja: cajaCerrada,
                diferencia: diferencia
            });
        }
        catch (error) {
            console.error('Error en cerrarCaja:', error);
            return res.status(500).json({ error: 'Error al cerrar caja' });
        }
    },
    // ✅ OBTENER HISTORIAL DE CAJAS CERRADAS
    async getHistorial(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso no autorizado' });
            }
            const { fechaInicio, fechaFin } = req.query;
            const whereClause = {
                tenant_id: tenantId,
                estado: 'Cerrada'
            };
            if (fechaInicio || fechaFin) {
                whereClause.fecha_cierre = {};
                if (fechaInicio) {
                    whereClause.fecha_cierre.gte = new Date(fechaInicio);
                }
                if (fechaFin) {
                    whereClause.fecha_cierre.lte = new Date(fechaFin);
                }
            }
            const historial = await prisma_1.prisma.cajas.findMany({
                where: whereClause,
                include: {
                    empleados: {
                        select: {
                            nombre: true,
                            email: true
                        }
                    },
                    _count: {
                        select: { movimientos: true }
                    }
                },
                orderBy: {
                    fecha_cierre: 'desc'
                },
                take: 50 // Limitar a últimas 50 cajas
            });
            return res.json(historial);
        }
        catch (error) {
            console.error('Error en getHistorial:', error);
            return res.status(500).json({ error: 'Error al obtener historial' });
        }
    }
};
