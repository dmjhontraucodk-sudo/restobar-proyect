// backend_core/src/controller/app/empleados.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { empleadosService } from '../../services/empleados.service';

// --- Interfaz de Autenticación (Dashboard) ---
interface AuthRequest extends Request {
    user?: {
        id: number;
        tenant_id: number;
        rol_id: number;
        email: string;
    };
    tenant?: {
        id: number;
        subdominio: string;
    };
}

// ==================== SCHEMAS ZOD ====================

const createEmpleadoSchema = z.object({
    nombre: z.string().min(1, 'El nombre es requerido'),
    email: z.string().email('Email inválido'),
    rol_id: z.number().int().positive('El rol es requerido'),
    documento_identidad: z.string().optional(),
    telefono: z.string().optional(),
    requiere_login: z.boolean(),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').optional()
});

const updateEmpleadoSchema = z.object({
    nombre: z.string().min(1).optional(),
    email: z.string().email().optional(),
    rol_id: z.number().int().positive().optional(),
    documento_identidad: z.string().optional(),
    telefono: z.string().optional(),
    is_active: z.boolean().optional(),
    salario: z.union([z.number(), z.string()]).optional(), // ✅ NUEVO
    fecha_ingreso: z.string().optional() // ✅ NUEVO
});

const cambiarPasswordSchema = z.object({
    nueva_password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
});

// ==================== CONTROLLER ====================

export const empleadosController = {
    
    /**
     * GET /api/dashboard/empleados - Obtiene todos los empleados del tenant
     */
    async getAllEmpleados(req: AuthRequest, res: Response) {
        try {
            const tenantId = req.user?.tenant_id;

            if (!tenantId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }

            const empleados = await empleadosService.getAllEmpleados(tenantId);

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

        } catch (error: any) {
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
    async getEmpleadosConAcceso(req: AuthRequest, res: Response) {
        try {
            const tenantId = req.user?.tenant_id;

            if (!tenantId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }

            const empleados = await empleadosService.getEmpleadosConAcceso(tenantId);

            const empleadosSafe = empleados.map(emp => {
                const { password_hash, ...empleadoSinPassword } = emp;
                return empleadoSinPassword;
            });

            return res.status(200).json({
                success: true,
                empleados: empleadosSafe
            });

        } catch (error: any) {
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
    async getEmpleadoById(req: AuthRequest, res: Response) {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = parseInt(req.params.id);

            if (!tenantId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }

            if (isNaN(empleadoId)) {
                return res.status(400).json({ error: 'ID de empleado inválido.' });
            }

            const empleado = await empleadosService.getEmpleadoById(tenantId, empleadoId);

            if (!empleado) {
                return res.status(404).json({ error: 'Empleado no encontrado.' });
            }

            const { password_hash, ...empleadoSafe } = empleado;

            return res.status(200).json({
                success: true,
                empleado: empleadoSafe
            });

        } catch (error: any) {
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
    async createEmpleado(req: AuthRequest, res: Response) {
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
            const nuevoEmpleado = await empleadosService.createEmpleado(tenantId, data);

            const { password_hash, ...empleadoSafe } = nuevoEmpleado;

            return res.status(201).json({
                success: true,
                message: 'Empleado creado exitosamente.',
                empleado: empleadoSafe
            });

        } catch (error: any) {
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
    async updateEmpleado(req: AuthRequest, res: Response) {
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
            const puedeGestionar = await empleadosService.puedeGestionarEmpleado(
                usuarioActualId,
                empleadoId,
                tenantId
            );

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
            const empleadoActualizado = await empleadosService.updateEmpleado(
                tenantId,
                empleadoId,
                data
            );

            const { password_hash, ...empleadoSafe } = empleadoActualizado;

            return res.status(200).json({
                success: true,
                message: 'Empleado actualizado exitosamente.',
                empleado: empleadoSafe
            });

        } catch (error: any) {
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
    async desactivarEmpleado(req: AuthRequest, res: Response) {
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
            const puedeGestionar = await empleadosService.puedeGestionarEmpleado(
                usuarioActualId,
                empleadoId,
                tenantId
            );

            if (!puedeGestionar) {
                return res.status(403).json({ 
                    error: 'No tienes permisos para desactivar a este empleado.' 
                });
            }

            // Desactivar empleado
            await empleadosService.desactivarEmpleado(tenantId, empleadoId);

            return res.status(200).json({
                success: true,
                message: 'Empleado desactivado exitosamente.'
            });

        } catch (error: any) {
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
    async activarEmpleado(req: AuthRequest, res: Response) {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = parseInt(req.params.id);

            if (!tenantId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }

            if (isNaN(empleadoId)) {
                return res.status(400).json({ error: 'ID de empleado inválido.' });
            }

            await empleadosService.activarEmpleado(tenantId, empleadoId);

            return res.status(200).json({
                success: true,
                message: 'Empleado reactivado exitosamente.'
            });

        } catch (error: any) {
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
    async resetearPassword(req: AuthRequest, res: Response) {
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
            const puedeGestionar = await empleadosService.puedeGestionarEmpleado(
                usuarioActualId,
                empleadoId,
                tenantId
            );

            if (!puedeGestionar) {
                return res.status(403).json({ 
                    error: 'No tienes permisos para resetear la contraseña de este empleado.' 
                });
            }

            const passwordTemporal = await empleadosService.resetearPassword(tenantId, empleadoId);

            return res.status(200).json({
                success: true,
                message: 'Contraseña reseteada exitosamente.',
                password_temporal: passwordTemporal // Solo en desarrollo, en producción enviar por email
            });

        } catch (error: any) {
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
    async getRoles(req: AuthRequest, res: Response) {
        try {
            const tenantId = req.user?.tenant_id;

            if (!tenantId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }

            // Obtener roles operativos (sin Propietario)
            const roles = await empleadosService.getRolesOperativos();

            return res.status(200).json({
                success: true,
                roles
            });

        } catch (error: any) {
            console.error('Error en getRoles:', error);
            return res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor.' 
            });
        }
    }
};