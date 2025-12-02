"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.empleadosController = void 0;
const zod_1 = require("zod");
const empleados_service_1 = require("../../services/empleados.service");
const prisma_1 = require("../../lib/prisma"); // ✅ Importar prisma
// ==================== SCHEMAS ZOD ====================
const createEmpleadoSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, 'El nombre es requerido'),
    email: zod_1.z.string().email('Email inválido'),
    rol_id: zod_1.z.number().int().positive('El rol es requerido'),
    documento_identidad: zod_1.z.string().optional(),
    telefono: zod_1.z.string().optional(),
    requiere_login: zod_1.z.boolean(),
    password: zod_1.z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').optional(),
    salario: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional(),
    fecha_ingreso: zod_1.z.string().optional()
});
const updateEmpleadoSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1).optional(),
    email: zod_1.z.string().email().optional(),
    rol_id: zod_1.z.number().int().positive().optional(),
    documento_identidad: zod_1.z.string().optional(),
    telefono: zod_1.z.string().optional(),
    is_active: zod_1.z.boolean().optional(),
    salario: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional(),
    fecha_ingreso: zod_1.z.string().optional()
});
const cambiarPasswordSchema = zod_1.z.object({
    nueva_password: zod_1.z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
});
// ✅ SCHEMA PARA INCIDENCIAS (Agregar esto)
const incidenciaSchema = zod_1.z.object({
    empleado_id: zod_1.z.number().int().positive('ID de empleado inválido'),
    monto: zod_1.z.number().positive('El monto debe ser positivo'),
    motivo: zod_1.z.string().min(1, 'El motivo es requerido'),
    es_adelanto: zod_1.z.boolean().default(false)
});
// ==================== CONTROLLER ====================
exports.empleadosController = {
    /**
     * GET /api/dashboard/empleados - Obtiene todos los empleados del tenant
     */
    async getAllEmpleados(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            const empleados = await empleados_service_1.empleadosService.getAllEmpleados(tenantId);
            // Ocultar password_hash en la respuesta
            const empleadosSafe = empleados.map(emp => {
                const { password_hash, ...empleadoSinPassword } = emp;
                return empleadoSinPassword;
            });
            return res.status(200).json({
                success: true,
                empleados: empleadosSafe,
                count: empleadosSafe.length
            });
        }
        catch (error) {
            console.error('Error en getAllEmpleados:', error);
            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor.'
            });
        }
    },
    /**
     * GET /api/dashboard/empleados/con-acceso - Obtiene solo empleados con login
     */
    async getEmpleadosConAcceso(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            const empleados = await empleados_service_1.empleadosService.getEmpleadosConAcceso(tenantId);
            const empleadosSafe = empleados.map(emp => {
                const { password_hash, ...empleadoSinPassword } = emp;
                return empleadoSinPassword;
            });
            return res.status(200).json({
                success: true,
                empleados: empleadosSafe
            });
        }
        catch (error) {
            console.error('Error en getEmpleadosConAcceso:', error);
            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor.'
            });
        }
    },
    /**
     * GET /api/dashboard/empleados/:id - Obtiene un empleado por ID
     */
    async getEmpleadoById(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = parseInt(req.params.id);
            if (!tenantId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            if (isNaN(empleadoId)) {
                return res.status(400).json({ error: 'ID de empleado inválido.' });
            }
            const empleado = await empleados_service_1.empleadosService.getEmpleadoById(tenantId, empleadoId);
            if (!empleado) {
                return res.status(404).json({ error: 'Empleado no encontrado.' });
            }
            const { password_hash, ...empleadoSafe } = empleado;
            return res.status(200).json({
                success: true,
                empleado: empleadoSafe
            });
        }
        catch (error) {
            console.error('Error en getEmpleadoById:', error);
            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor.'
            });
        }
    },
    /**
     * POST /api/dashboard/empleados - Crea un nuevo empleado
     */
    async createEmpleado(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const usuarioActualId = req.user?.id;
            if (!tenantId || !usuarioActualId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            // Validar datos con Zod
            const validation = createEmpleadoSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Datos inválidos',
                    details: validation.error.issues
                });
            }
            const data = validation.data;
            // Crear empleado
            const nuevoEmpleado = await empleados_service_1.empleadosService.createEmpleado(tenantId, data);
            const { password_hash, ...empleadoSafe } = nuevoEmpleado;
            return res.status(201).json({
                success: true,
                message: 'Empleado creado exitosamente.',
                empleado: empleadoSafe
            });
        }
        catch (error) {
            console.error('Error en createEmpleado:', error);
            if (error.message.includes('Ya existe')) {
                return res.status(409).json({
                    success: false,
                    error: error.message
                });
            }
            return res.status(500).json({
                success: false,
                error: error.message || 'Error interno del servidor.'
            });
        }
    },
    /**
     * PATCH /api/dashboard/empleados/:id - Actualiza un empleado
     */
    async updateEmpleado(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const usuarioActualId = req.user?.id;
            const empleadoId = parseInt(req.params.id);
            if (!tenantId || !usuarioActualId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            if (isNaN(empleadoId)) {
                return res.status(400).json({ error: 'ID de empleado inválido.' });
            }
            // Validar permisos jerárquicos
            const puedeGestionar = await empleados_service_1.empleadosService.puedeGestionarEmpleado(usuarioActualId, empleadoId, tenantId);
            if (!puedeGestionar) {
                return res.status(403).json({
                    error: 'No tienes permisos para modificar a este empleado.'
                });
            }
            // Validar datos con Zod
            const validation = updateEmpleadoSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Datos inválidos',
                    details: validation.error.issues
                });
            }
            const data = validation.data;
            // Actualizar empleado
            const empleadoActualizado = await empleados_service_1.empleadosService.updateEmpleado(tenantId, empleadoId, data);
            const { password_hash, ...empleadoSafe } = empleadoActualizado;
            return res.status(200).json({
                success: true,
                message: 'Empleado actualizado exitosamente.',
                empleado: empleadoSafe
            });
        }
        catch (error) {
            console.error('Error en updateEmpleado:', error);
            if (error.message.includes('no encontrado')) {
                return res.status(404).json({ error: error.message });
            }
            if (error.message.includes('Ya existe')) {
                return res.status(409).json({ error: error.message });
            }
            return res.status(500).json({
                success: false,
                error: error.message || 'Error interno del servidor.'
            });
        }
    },
    /**
     * DELETE /api/dashboard/empleados/:id - Desactiva un empleado
     */
    async desactivarEmpleado(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const usuarioActualId = req.user?.id;
            const empleadoId = parseInt(req.params.id);
            if (!tenantId || !usuarioActualId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            if (isNaN(empleadoId)) {
                return res.status(400).json({ error: 'ID de empleado inválido.' });
            }
            // Validar permisos jerárquicos
            const puedeGestionar = await empleados_service_1.empleadosService.puedeGestionarEmpleado(usuarioActualId, empleadoId, tenantId);
            if (!puedeGestionar) {
                return res.status(403).json({
                    error: 'No tienes permisos para desactivar a este empleado.'
                });
            }
            // Desactivar empleado
            await empleados_service_1.empleadosService.desactivarEmpleado(tenantId, empleadoId);
            return res.status(200).json({
                success: true,
                message: 'Empleado desactivado exitosamente.'
            });
        }
        catch (error) {
            console.error('Error en desactivarEmpleado:', error);
            if (error.message.includes('no encontrado')) {
                return res.status(404).json({ error: error.message });
            }
            if (error.message.includes('propietario')) {
                return res.status(403).json({ error: error.message });
            }
            return res.status(500).json({
                success: false,
                error: error.message || 'Error interno del servidor.'
            });
        }
    },
    /**
     * POST /api/dashboard/empleados/:id/activar - Reactiva un empleado
     */
    async activarEmpleado(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = parseInt(req.params.id);
            if (!tenantId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            if (isNaN(empleadoId)) {
                return res.status(400).json({ error: 'ID de empleado inválido.' });
            }
            await empleados_service_1.empleadosService.activarEmpleado(tenantId, empleadoId);
            return res.status(200).json({
                success: true,
                message: 'Empleado reactivado exitosamente.'
            });
        }
        catch (error) {
            console.error('Error en activarEmpleado:', error);
            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor.'
            });
        }
    },
    /**
     * POST /api/dashboard/empleados/:id/resetear-password - Resetea la contraseña
     */
    async resetearPassword(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const usuarioActualId = req.user?.id;
            const empleadoId = parseInt(req.params.id);
            if (!tenantId || !usuarioActualId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            if (isNaN(empleadoId)) {
                return res.status(400).json({ error: 'ID de empleado inválido.' });
            }
            // Validar permisos
            const puedeGestionar = await empleados_service_1.empleadosService.puedeGestionarEmpleado(usuarioActualId, empleadoId, tenantId);
            if (!puedeGestionar) {
                return res.status(403).json({
                    error: 'No tienes permisos para resetear la contraseña de este empleado.'
                });
            }
            const passwordTemporal = await empleados_service_1.empleadosService.resetearPassword(tenantId, empleadoId);
            return res.status(200).json({
                success: true,
                message: 'Contraseña reseteada exitosamente.',
                password_temporal: passwordTemporal // Solo en desarrollo, en producción enviar por email
            });
        }
        catch (error) {
            console.error('Error en resetearPassword:', error);
            return res.status(500).json({
                success: false,
                error: error.message || 'Error interno del servidor.'
            });
        }
    },
    /**
     * GET /api/dashboard/roles - Obtiene todos los roles disponibles
     */
    async getRoles(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            // Obtener roles operativos (sin Propietario)
            const roles = await empleados_service_1.empleadosService.getRolesOperativos();
            return res.status(200).json({
                success: true,
                roles
            });
        }
        catch (error) {
            console.error('Error en getRoles:', error);
            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor.'
            });
        }
    },
    /**
     * POST /api/dashboard/empleados/incidencias - Registra incidencias o adelantos
     */
    async registrarIncidencia(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const usuarioActualId = req.user?.id; // ✅ Corregido: usar usuarioActualId
            if (!tenantId || !usuarioActualId) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            const validation = incidenciaSchema.safeParse(req.body); // ✅ Ahora existe
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Datos inválidos',
                    details: validation.error.issues
                });
            }
            const { empleado_id, monto, motivo, es_adelanto } = validation.data;
            // 🔥 TRANSACCIÓN ATÓMICA
            const result = await prisma_1.prisma.$transaction(async (tx) => {
                // 1. Registrar la deuda en el historial del empleado
                const incidencia = await tx.descuentos_empleados.create({
                    data: {
                        tenant_id: tenantId,
                        empleado_id: empleado_id,
                        monto: monto,
                        motivo: es_adelanto ? `Adelanto: ${motivo}` : motivo,
                        estado: 'Pendiente' // Se descontará en la próxima nómina
                    }
                });
                // 2. SI ES ADELANTO: Sacar dinero de la Caja
                if (es_adelanto) {
                    // Buscar caja abierta del usuario que hace la operación (o una general)
                    const cajaAbierta = await tx.cajas.findFirst({
                        where: {
                            tenant_id: tenantId,
                            usuario_responsable_id: usuarioActualId,
                            estado: 'Abierta'
                        }
                    });
                    if (!cajaAbierta) {
                        throw new Error('No tienes una caja abierta para entregar el dinero del adelanto.');
                    }
                    // Registrar Egreso en Caja
                    await tx.cajas_movimientos.create({
                        data: {
                            tenant_id: tenantId,
                            caja_id: cajaAbierta.id,
                            usuario_id: usuarioActualId,
                            tipo: 'EGRESO',
                            concepto: `Adelanto a Empleado #${empleado_id}`,
                            monto: monto,
                            metodo_pago: 'Efectivo', // Asumimos efectivo por defecto para caja chica
                            documento_tipo: 'Adelanto',
                            documento_id: incidencia.id,
                            notas: motivo
                        }
                    });
                }
                return incidencia;
            });
            return res.status(201).json({
                success: true,
                message: es_adelanto ?
                    'Adelanto registrado y dinero descontado de caja.' :
                    'Incidencia registrada correctamente.',
                data: result
            });
        }
        catch (error) {
            console.error('Error en registrarIncidencia:', error);
            return res.status(500).json({
                success: false,
                error: error.message || 'Error interno del servidor.'
            });
        }
    }
};
