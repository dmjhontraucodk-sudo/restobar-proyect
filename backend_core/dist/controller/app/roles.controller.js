"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolesController = void 0;
const zod_1 = require("zod");
const roles_service_1 = require("../../services/roles.service");
// ==================== SCHEMAS ZOD ====================
const createRolSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, 'El nombre del rol es requerido'),
    descripcion: zod_1.z.string().optional(),
});
const updateRolSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1).optional(),
    descripcion: zod_1.z.string().optional(),
    activo: zod_1.z.boolean().optional(),
});
// ==================== CONTROLLER ====================
exports.rolesController = {
    /**
     * GET /api/dashboard/roles/todos - Obtiene TODOS los roles (para Administrador)
     */
    async getAllRoles(req, res) {
        try {
            const usuarioActual = await roles_service_1.rolesService.getEmpleadoById(req.user.id);
            // Solo el Administrador (propietario) puede ver todos los roles
            if (!usuarioActual?.es_propietario) {
                return res.status(403).json({
                    error: 'Solo el Administrador puede gestionar roles.'
                });
            }
            const roles = await roles_service_1.rolesService.getAllRoles();
            return res.status(200).json({
                success: true,
                roles
            });
        }
        catch (error) {
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
    async createRol(req, res) {
        try {
            const usuarioActual = await roles_service_1.rolesService.getEmpleadoById(req.user.id);
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
            const nuevoRol = await roles_service_1.rolesService.createRol(data);
            return res.status(201).json({
                success: true,
                message: 'Rol creado exitosamente.',
                rol: nuevoRol
            });
        }
        catch (error) {
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
    async updateRol(req, res) {
        try {
            const usuarioActual = await roles_service_1.rolesService.getEmpleadoById(req.user.id);
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
            const rolActualizado = await roles_service_1.rolesService.updateRol(rolId, data);
            return res.status(200).json({
                success: true,
                message: 'Rol actualizado exitosamente.',
                rol: rolActualizado
            });
        }
        catch (error) {
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
    async desactivarRol(req, res) {
        try {
            const usuarioActual = await roles_service_1.rolesService.getEmpleadoById(req.user.id);
            const rolId = parseInt(req.params.id);
            if (!usuarioActual?.es_propietario) {
                return res.status(403).json({
                    error: 'Solo el Administrador puede desactivar roles.'
                });
            }
            if (isNaN(rolId)) {
                return res.status(400).json({ error: 'ID de rol inválido.' });
            }
            await roles_service_1.rolesService.desactivarRol(rolId);
            return res.status(200).json({
                success: true,
                message: 'Rol desactivado exitosamente.'
            });
        }
        catch (error) {
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
    async activarRol(req, res) {
        try {
            const usuarioActual = await roles_service_1.rolesService.getEmpleadoById(req.user.id);
            const rolId = parseInt(req.params.id);
            if (!usuarioActual?.es_propietario) {
                return res.status(403).json({
                    error: 'Solo el Administrador puede reactivar roles.'
                });
            }
            if (isNaN(rolId)) {
                return res.status(400).json({ error: 'ID de rol inválido.' });
            }
            await roles_service_1.rolesService.activarRol(rolId);
            return res.status(200).json({
                success: true,
                message: 'Rol reactivado exitosamente.'
            });
        }
        catch (error) {
            console.error('Error en activarRol:', error);
            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor.'
            });
        }
    },
};
