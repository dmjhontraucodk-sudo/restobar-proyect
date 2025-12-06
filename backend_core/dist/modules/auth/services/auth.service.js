"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const prisma_service_1 = require("@shared/database/prisma.service");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const email_service_1 = require("@core/email/email.service");
exports.authService = {
    async login(email, password) {
        try {
            const empleado = await prisma_service_1.prisma.empleados.findFirst({
                where: { email },
                include: {
                    roles: true,
                    tenants: true,
                },
            });
            if (!empleado)
                throw new Error('Usuario no encontrado');
            if (!empleado.requiere_login)
                throw new Error('Este usuario no tiene acceso al sistema.');
            if (!empleado.password_hash)
                throw new Error('Error de configuración del usuario.');
            if (!empleado.is_active)
                throw new Error('Tu cuenta ha sido desactivada.');
            const isPasswordCorrect = await bcryptjs_1.default.compare(password, empleado.password_hash);
            if (!isPasswordCorrect)
                throw new Error('Credenciales inválidas');
            const payload = {
                id: empleado.id,
                email: empleado.email,
                tenant_id: empleado.tenant_id,
                rol_id: empleado.rol_id,
            };
            const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
            return {
                token,
                user: {
                    id: empleado.id.toString(),
                    name: empleado.nombre || empleado.email.split('@')[0],
                    email: empleado.email,
                    role: empleado.roles.nombre,
                    restaurantId: empleado.tenant_id.toString(),
                    tenantName: empleado.tenants.nombre_empresa,
                    tenantSubdomain: empleado.tenants.subdominio,
                    debe_cambiar_pass: empleado.debe_cambiar_pass || false,
                }
            };
        }
        catch (error) {
            throw new Error(error.message || 'Error en el login');
        }
    },
    async registerTenant(data) {
        try {
            const { nombre_empresa, subdominio, email_admin, password } = data;
            const existingSubdomain = await prisma_service_1.prisma.tenants.findUnique({ where: { subdominio } });
            if (existingSubdomain)
                throw new Error('Este subdominio ya está en uso.');
            // Comentamos la variable no usada o la eliminamos
            // const ____existingEmail = await prisma.empleados.findUnique({ 
            //     where: { 
            //         tenant_id_email: { tenant_id: 0, email: email_admin }
            //     }
            // });
            const salt = await bcryptjs_1.default.genSalt(10);
            const password_hash = await bcryptjs_1.default.hash(password, salt);
            const nuevoTenant = await prisma_service_1.prisma.tenants.create({
                data: {
                    nombre_empresa,
                    subdominio: subdominio.toLowerCase(),
                    isActive: false,
                },
            });
            const rolPropietario = await prisma_service_1.prisma.roles.findFirst({ where: { nombre: 'Propietario' } });
            await prisma_service_1.prisma.empleados.create({
                data: {
                    tenant_id: nuevoTenant.id,
                    email: email_admin,
                    password_hash: password_hash,
                    rol_id: rolPropietario?.id || 1,
                    is_active: true,
                    requiere_login: true,
                    es_propietario: true,
                    debe_cambiar_pass: false,
                },
            });
            await email_service_1.emailService.sendRegistrationEmail(email_admin, nombre_empresa).catch(console.error);
            return nuevoTenant;
        }
        catch (error) {
            throw new Error(error.message || 'Error registrando tenant');
        }
    }
};
