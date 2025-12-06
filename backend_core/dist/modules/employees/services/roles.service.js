"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolesService = void 0;
const prisma_service_1 = require("@shared/database/prisma.service");
exports.rolesService = {
    // ==================== OBTENER ====================
    /**
     * Obtiene todos los roles del sistema
     */
    async getAllRoles() {
        return prisma_service_1.prisma.roles.findMany({
            orderBy: { id: 'asc' }
        });
    },
    /**
     * Obtiene un rol por ID
     */
    async getRolById(rolId) {
        return prisma_service_1.prisma.roles.findUnique({
            where: { id: rolId }
        });
    },
    /**
     * Obtiene un empleado por ID (para validaciones)
     */
    async getEmpleadoById(empleadoId) {
        return prisma_service_1.prisma.empleados.findUnique({
            where: { id: empleadoId }
        });
    },
    /**
     * Cuenta cuántos empleados tienen un rol específico
     */
    async contarEmpleadosPorRol(rolId, tenantId) {
        return prisma_service_1.prisma.empleados.count({
            where: {
                rol_id: rolId,
                tenant_id: tenantId
            }
        });
    },
    // ==================== CREAR ====================
    /**
     * Crea un nuevo rol
     * @throws Error si el nombre ya existe
     */
    async createRol(data) {
        // Validar que el nombre no exista (MySQL es case-insensitive por defecto en comparaciones de string)
        const existingRol = await prisma_service_1.prisma.roles.findFirst({
            where: {
                nombre: data.nombre
            }
        });
        if (existingRol) {
            throw new Error(`Ya existe un rol con el nombre "${data.nombre}".`);
        }
        // Crear rol
        return prisma_service_1.prisma.roles.create({
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion || null,
                activo: true
            }
        });
    },
    // ==================== ACTUALIZAR ====================
    /**
     * Actualiza un rol existente
     * @throws Error si intenta modificar rol del sistema (Administrador)
     */
    async updateRol(rolId, data) {
        // Verificar que el rol existe
        const rol = await this.getRolById(rolId);
        if (!rol) {
            throw new Error('Rol no encontrado.');
        }
        // No se puede modificar el rol "Administrador"
        if (rol.nombre === 'Administrador') {
            throw new Error('No se puede modificar el rol de Administrador del sistema.');
        }
        // Si se intenta cambiar el nombre, verificar que no exista
        if (data.nombre && data.nombre !== rol.nombre) {
            const existingRol = await prisma_service_1.prisma.roles.findFirst({
                where: {
                    nombre: data.nombre,
                    id: { not: rolId }
                }
            });
            if (existingRol) {
                throw new Error(`Ya existe un rol con el nombre "${data.nombre}".`);
            }
        }
        // Actualizar rol
        return prisma_service_1.prisma.roles.update({
            where: { id: rolId },
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion,
                activo: data.activo
            }
        });
    },
    /**
     * Desactiva un rol (soft delete)
     * @throws Error si intenta desactivar rol del sistema o si tiene empleados activos
     */
    async desactivarRol(rolId) {
        const rol = await this.getRolById(rolId);
        if (!rol) {
            throw new Error('Rol no encontrado.');
        }
        // No se puede desactivar el rol "Administrador"
        if (rol.nombre === 'Administrador') {
            throw new Error('No se puede desactivar el rol de Administrador del sistema.');
        }
        // Verificar que no haya empleados activos con este rol
        const empleadosActivos = await prisma_service_1.prisma.empleados.count({
            where: {
                rol_id: rolId,
                is_active: true
            }
        });
        if (empleadosActivos > 0) {
            throw new Error(`No se puede desactivar este rol porque tiene ${empleadosActivos} empleado(s) activo(s) asignado(s).`);
        }
        return prisma_service_1.prisma.roles.update({
            where: { id: rolId },
            data: { activo: false }
        });
    },
    /**
     * Reactiva un rol
     */
    async activarRol(rolId) {
        return prisma_service_1.prisma.roles.update({
            where: { id: rolId },
            data: { activo: true }
        });
    },
};
