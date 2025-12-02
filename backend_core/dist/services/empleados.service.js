"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.empleadosService = void 0;
// backend_core/src/services/empleados.service.ts - ACTUALIZADO CON SALARIO
const prisma_1 = require("../lib/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const library_1 = require("@prisma/client/runtime/library");
exports.empleadosService = {
    // ==================== OBTENER ====================
    /**
     * Obtiene todos los empleados de un tenant con su rol
     */
    async getAllEmpleados(tenantId) {
        return prisma_1.prisma.empleados.findMany({
            where: { tenant_id: tenantId },
            include: {
                roles: true
            },
            orderBy: [
                { es_propietario: 'desc' },
                { created_at: 'desc' }
            ]
        });
    },
    /**
     * Obtiene solo empleados que requieren login
     */
    async getEmpleadosConAcceso(tenantId) {
        return prisma_1.prisma.empleados.findMany({
            where: {
                tenant_id: tenantId,
                requiere_login: true
            },
            include: {
                roles: true
            },
            orderBy: { created_at: 'desc' }
        });
    },
    /**
     * Obtiene un empleado por ID
     */
    async getEmpleadoById(tenantId, empleadoId) {
        return prisma_1.prisma.empleados.findFirst({
            where: {
                id: empleadoId,
                tenant_id: tenantId
            },
            include: {
                roles: true
            }
        });
    },
    /**
     * Obtiene el propietario del tenant
     */
    async getPropietario(tenantId) {
        return prisma_1.prisma.empleados.findFirst({
            where: {
                tenant_id: tenantId,
                es_propietario: true
            },
            include: {
                roles: true
            }
        });
    },
    // ==================== CREAR ====================
    /**
     * Crea un nuevo empleado CON SOPORTE DE SALARIO
     */
    async createEmpleado(tenantId, data) {
        // Validar que el email no exista
        const existingEmail = await prisma_1.prisma.empleados.findFirst({
            where: {
                tenant_id: tenantId,
                email: data.email
            }
        });
        if (existingEmail) {
            throw new Error(`Ya existe un empleado con el email "${data.email}".`);
        }
        // Validar que el rol exista
        const rol = await prisma_1.prisma.roles.findUnique({
            where: { id: data.rol_id }
        });
        if (!rol) {
            throw new Error('El rol especificado no existe.');
        }
        // Si el rol es "Administrador", validar que no exista otro
        if (rol.nombre === 'Administrador') {
            const existingPropietario = await this.getPropietario(tenantId);
            if (existingPropietario) {
                throw new Error('Ya existe un Administrador para este restaurante.');
            }
        }
        // Generar contraseña si requiere login y no se proporcionó
        let passwordHash = null;
        let passwordTemporal = null;
        if (data.requiere_login) {
            if (data.password) {
                passwordHash = await bcryptjs_1.default.hash(data.password, 10);
            }
            else {
                passwordTemporal = this.generarPasswordTemporal();
                passwordHash = await bcryptjs_1.default.hash(passwordTemporal, 10);
            }
        }
        // ✅ Convertir salario a Decimal si se proporciona
        const salarioDecimal = data.salario
            ? new library_1.Decimal(data.salario.toString())
            : null;
        // ✅ Convertir fecha_ingreso a Date si se proporciona
        const fechaIngresoDate = data.fecha_ingreso
            ? new Date(data.fecha_ingreso)
            : null;
        // Crear empleado
        const nuevoEmpleado = await prisma_1.prisma.empleados.create({
            data: {
                tenant_id: tenantId,
                nombre: data.nombre,
                email: data.email,
                rol_id: data.rol_id,
                documento_identidad: data.documento_identidad || null,
                telefono: data.telefono || null,
                requiere_login: data.requiere_login,
                password_hash: passwordHash,
                es_propietario: rol.nombre === 'Administrador',
                debe_cambiar_pass: data.requiere_login && !data.password,
                is_active: true,
                salario: salarioDecimal, // ✅ NUEVO
                fecha_ingreso: fechaIngresoDate, // ✅ NUEVO
            },
            include: {
                roles: true
            }
        });
        // TODO: Enviar email con credenciales
        if (passwordTemporal) {
            console.log(`📧 [TODO] Enviar email a ${data.email} con contraseña: ${passwordTemporal}`);
        }
        return nuevoEmpleado;
    },
    // ==================== ACTUALIZAR ====================
    /**
     * Actualiza un empleado CON SOPORTE DE SALARIO
     */
    async updateEmpleado(tenantId, empleadoId, data) {
        const empleado = await this.getEmpleadoById(tenantId, empleadoId);
        if (!empleado) {
            throw new Error('Empleado no encontrado.');
        }
        if (empleado.es_propietario) {
            throw new Error('No se puede modificar al Administrador del restaurante.');
        }
        // Validar email único
        if (data.email && data.email !== empleado.email) {
            const existingEmail = await prisma_1.prisma.empleados.findFirst({
                where: {
                    tenant_id: tenantId,
                    email: data.email,
                    id: { not: empleadoId }
                }
            });
            if (existingEmail) {
                throw new Error(`Ya existe un empleado con el email "${data.email}".`);
            }
        }
        // ✅ Convertir salario a Decimal si se proporciona
        const salarioDecimal = data.salario !== undefined
            ? (data.salario ? new library_1.Decimal(data.salario.toString()) : null)
            : undefined;
        // ✅ Convertir fecha_ingreso a Date si se proporciona
        const fechaIngresoDate = data.fecha_ingreso !== undefined
            ? (data.fecha_ingreso ? new Date(data.fecha_ingreso) : null)
            : undefined;
        return prisma_1.prisma.empleados.update({
            where: { id: empleadoId },
            data: {
                nombre: data.nombre,
                email: data.email,
                rol_id: data.rol_id,
                documento_identidad: data.documento_identidad,
                telefono: data.telefono,
                is_active: data.is_active,
                salario: salarioDecimal, // ✅ NUEVO
                fecha_ingreso: fechaIngresoDate, // ✅ NUEVO
                updated_at: new Date()
            },
            include: {
                roles: true
            }
        });
    },
    /**
     * Desactiva un empleado
     */
    async desactivarEmpleado(tenantId, empleadoId) {
        const empleado = await this.getEmpleadoById(tenantId, empleadoId);
        if (!empleado) {
            throw new Error('Empleado no encontrado.');
        }
        if (empleado.es_propietario) {
            throw new Error('No se puede desactivar al Administrador del restaurante.');
        }
        return prisma_1.prisma.empleados.update({
            where: { id: empleadoId },
            data: {
                is_active: false,
                updated_at: new Date()
            },
            include: {
                roles: true
            }
        });
    },
    /**
     * Reactiva un empleado
     */
    async activarEmpleado(tenantId, empleadoId) {
        return prisma_1.prisma.empleados.update({
            where: {
                id: empleadoId,
                tenant_id: tenantId
            },
            data: {
                is_active: true,
                updated_at: new Date()
            },
            include: {
                roles: true
            }
        });
    },
    // ==================== CONTRASEÑAS ====================
    async cambiarPassword(tenantId, empleadoId, nuevaPassword) {
        const empleado = await this.getEmpleadoById(tenantId, empleadoId);
        if (!empleado || !empleado.requiere_login) {
            throw new Error('Empleado no encontrado o no requiere login.');
        }
        const passwordHash = await bcryptjs_1.default.hash(nuevaPassword, 10);
        await prisma_1.prisma.empleados.update({
            where: { id: empleadoId },
            data: {
                password_hash: passwordHash,
                debe_cambiar_pass: false,
                updated_at: new Date()
            }
        });
    },
    async resetearPassword(tenantId, empleadoId) {
        const empleado = await this.getEmpleadoById(tenantId, empleadoId);
        if (!empleado || !empleado.requiere_login) {
            throw new Error('Empleado no encontrado o no requiere login.');
        }
        const passwordTemporal = this.generarPasswordTemporal();
        const passwordHash = await bcryptjs_1.default.hash(passwordTemporal, 10);
        await prisma_1.prisma.empleados.update({
            where: { id: empleadoId },
            data: {
                password_hash: passwordHash,
                debe_cambiar_pass: true,
                updated_at: new Date()
            }
        });
        console.log(`📧 [TODO] Enviar email a ${empleado.email} con contraseña: ${passwordTemporal}`);
        return passwordTemporal;
    },
    // ==================== ROLES ====================
    async getAllRoles() {
        return prisma_1.prisma.roles.findMany({
            orderBy: { id: 'asc' }
        });
    },
    async getRolesOperativos() {
        return prisma_1.prisma.roles.findMany({
            where: {
                nombre: { not: 'Administrador' }
            },
            orderBy: { id: 'asc' }
        });
    },
    // ==================== UTILIDADES ====================
    generarPasswordTemporal() {
        const length = 12;
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            password += charset[randomIndex];
        }
        return password;
    },
    async puedeGestionarEmpleado(usuarioActualId, empleadoObjetivoId, tenantId) {
        const usuarioActual = await this.getEmpleadoById(tenantId, usuarioActualId);
        const empleadoObjetivo = await this.getEmpleadoById(tenantId, empleadoObjetivoId);
        if (!usuarioActual || !empleadoObjetivo) {
            return false;
        }
        // El Administrador puede gestionar a todos (excepto a sí mismo si es propietario)
        if (usuarioActual.es_propietario) {
            return true;
        }
        // Nadie puede gestionar al Administrador
        if (empleadoObjetivo.es_propietario) {
            return false;
        }
        // Gerentes pueden gestionar a empleados operativos
        if (usuarioActual.roles.nombre === 'Gerente') {
            return empleadoObjetivo.roles.nombre !== 'Gerente';
        }
        return false;
    }
};
