// backend_core/src/controller/app/roles.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { rolesService } from '../../services/roles.service';

// --- Interfaz de Autenticación ---
interface AuthRequest extends Request {
    user?: {
        id: number;
        tenant_id: number;
        rol_id: number;
        email: string;
        es_propietario?: boolean;
    };
    tenant?: {
        id: number;
        subdominio: string;
    };
}

// ==================== SCHEMAS ZOD ====================

const createRolSchema = z.object({
    nombre: z.string().min(1, 'El nombre del rol es requerido'),
    descripcion: z.string().optional(),
});

const updateRolSchema = z.object({
    nombre: z.string().min(1).optional(),
    descripcion: z.string().optional(),
    activo: z.boolean().optional(),
});

// ==================== CONTROLLER ====================

export const rolesController = {
    
    /**
     * GET /api/dashboard/roles/todos - Obtiene TODOS los roles (para Administrador)
     */
    async getAllRoles(req: AuthRequest, res: Response) {
        try {
            const usuarioActual = await rolesService.getEmpleadoById(req.user!.id);

            // Solo el Administrador (propietario) puede ver todos los roles
            if (!usuarioActual?.es_propietario) {
                return res.status(403).json({ 
                    error: 'Solo el Administrador puede gestionar roles.' 
                });
            }

            const roles = await rolesService.getAllRoles();

            return res.status(200).json({
                success: true,
                roles
            });

        } catch (error: any) {
            console.error('Error en getAllRoles:', error);
            return res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor.' 
            });
        }
    },

    /**
     * POST /api/dashboard/roles/crear - Crea un nuevo rol (solo Administrador)
     */
    async createRol(req: AuthRequest, res: Response) {
        try {
            const usuarioActual = await rolesService.getEmpleadoById(req.user!.id);

            if (!usuarioActual?.es_propietario) {
                return res.status(403).json({ 
                    error: 'Solo el Administrador puede crear roles.' 
                });
            }

            // Validar datos
            const validation = createRolSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({ 
                    error: 'Datos inválidos', 
                    details: validation.error.issues 
                });
            }

            const data = validation.data;

            // Crear rol
            const nuevoRol = await rolesService.createRol(data);

            return res.status(201).json({
                success: true,
                message: 'Rol creado exitosamente.',
                rol: nuevoRol
            });

        } catch (error: any) {
            console.error('Error en createRol:', error);
            
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
     * PATCH /api/dashboard/roles/:id - Actualiza un rol (solo Administrador)
     */
    async updateRol(req: AuthRequest, res: Response) {
        try {
            const usuarioActual = await rolesService.getEmpleadoById(req.user!.id);
            const rolId = parseInt(req.params.id);

            if (!usuarioActual?.es_propietario) {
                return res.status(403).json({ 
                    error: 'Solo el Administrador puede modificar roles.' 
                });
            }

            if (isNaN(rolId)) {
                return res.status(400).json({ error: 'ID de rol inválido.' });
            }

            // Validar datos
            const validation = updateRolSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({ 
                    error: 'Datos inválidos', 
                    details: validation.error.issues 
                });
            }

            const data = validation.data;

            // Actualizar rol
            const rolActualizado = await rolesService.updateRol(rolId, data);

            return res.status(200).json({
                success: true,
                message: 'Rol actualizado exitosamente.',
                rol: rolActualizado
            });

        } catch (error: any) {
            console.error('Error en updateRol:', error);
            
            if (error.message.includes('no encontrado') || error.message.includes('No se puede')) {
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
     * DELETE /api/dashboard/roles/:id - Desactiva un rol (solo Administrador)
     */
    async desactivarRol(req: AuthRequest, res: Response) {
        try {
            const usuarioActual = await rolesService.getEmpleadoById(req.user!.id);
            const rolId = parseInt(req.params.id);

            if (!usuarioActual?.es_propietario) {
                return res.status(403).json({ 
                    error: 'Solo el Administrador puede desactivar roles.' 
                });
            }

            if (isNaN(rolId)) {
                return res.status(400).json({ error: 'ID de rol inválido.' });
            }

            await rolesService.desactivarRol(rolId);

            return res.status(200).json({
                success: true,
                message: 'Rol desactivado exitosamente.'
            });

        } catch (error: any) {
            console.error('Error en desactivarRol:', error);
            
            if (error.message.includes('no encontrado') || error.message.includes('No se puede')) {
                return res.status(403).json({ error: error.message });
            }

            return res.status(500).json({ 
                success: false,
                error: error.message || 'Error interno del servidor.' 
            });
        }
    },

    /**
     * POST /api/dashboard/roles/:id/activar - Reactiva un rol
     */
    async activarRol(req: AuthRequest, res: Response) {
        try {
            const usuarioActual = await rolesService.getEmpleadoById(req.user!.id);
            const rolId = parseInt(req.params.id);

            if (!usuarioActual?.es_propietario) {
                return res.status(403).json({ 
                    error: 'Solo el Administrador puede reactivar roles.' 
                });
            }

            if (isNaN(rolId)) {
                return res.status(400).json({ error: 'ID de rol inválido.' });
            }

            await rolesService.activarRol(rolId);

            return res.status(200).json({
                success: true,
                message: 'Rol reactivado exitosamente.'
            });

        } catch (error: any) {
            console.error('Error en activarRol:', error);
            return res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor.' 
            });
        }
    },
};