"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTenant = exports.login = void 0;
const prisma_1 = require("../../lib/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const email_service_1 = require("../../services/email.service");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }
        // Consulta mejorada para incluir relaciones
        const empleado = await prisma_1.prisma.empleados.findFirst({
            where: {
                email: email,
            },
            include: {
                roles: true, // Incluir datos del rol
                tenants: true, // Incluir datos del tenant
            },
        });
        if (!empleado) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        // ✅ VALIDACIÓN NUEVA: Verificar que el empleado requiere login
        if (!empleado.requiere_login) {
            return res.status(403).json({
                error: 'Este usuario no tiene acceso al sistema.'
            });
        }
        // ✅ VALIDACIÓN NUEVA: Verificar que tiene password_hash
        if (!empleado.password_hash) {
            return res.status(500).json({
                error: 'Error de configuración del usuario. Contacte al administrador.'
            });
        }
        // ✅ VALIDACIÓN NUEVA: Verificar que el empleado está activo
        if (!empleado.is_active) {
            return res.status(403).json({
                error: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
            });
        }
        // ✅ Ahora sí es seguro comparar
        const isPasswordCorrect = await bcryptjs_1.default.compare(password, empleado.password_hash // Ya no puede ser null
        );
        if (!isPasswordCorrect) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        const payload = {
            id: empleado.id,
            email: empleado.email,
            tenant_id: empleado.tenant_id,
            rol_id: empleado.rol_id,
        };
        const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
        // Respuesta completa con todos los datos del usuario
        res.status(200).json({
            message: 'Login exitoso',
            token: token,
            user: {
                id: empleado.id.toString(),
                name: empleado.nombre || empleado.email.split('@')[0],
                email: empleado.email,
                role: empleado.roles.nombre,
                restaurantId: empleado.tenant_id.toString(),
                tenantName: empleado.tenants.nombre_empresa,
                tenantSubdomain: empleado.tenants.subdominio,
                // ✅ NUEVO: Indicar si debe cambiar contraseña
                debe_cambiar_pass: empleado.debe_cambiar_pass || false,
            }
        });
    }
    catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.login = login;
const registerTenant = async (req, res) => {
    try {
        const { nombre_empresa, subdominio, email_admin, password } = req.body;
        if (!nombre_empresa || !subdominio || !email_admin || !password) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const password_hash = await bcryptjs_1.default.hash(password, salt);
        console.log('Paso 1: Contraseña hasheada.');
        const subdominioLower = subdominio.toLowerCase();
        // 1. Crear el Tenant
        const nuevoTenant = await prisma_1.prisma.tenants.create({
            data: {
                nombre_empresa,
                subdominio: subdominioLower,
                isActive: false,
            },
        });
        console.log('Paso 2: Tenant creado en BD:', nuevoTenant.id);
        // 2. Buscar el rol de Propietario
        const rolPropietario = await prisma_1.prisma.roles.findFirst({
            where: { nombre: 'Propietario' }
        });
        if (!rolPropietario) {
            // Si no existe el rol, usar rol_id 1 por defecto (compatibilidad)
            console.warn('⚠️ No se encontró el rol "Propietario", usando rol_id: 1');
        }
        // 3. Crear el Empleado (Propietario) asociado
        await prisma_1.prisma.empleados.create({
            data: {
                tenant_id: nuevoTenant.id,
                email: email_admin,
                password_hash: password_hash,
                rol_id: rolPropietario?.id || 1, // ✅ Usar el ID del rol Propietario
                is_active: true,
                requiere_login: true, // ✅ NUEVO: El propietario siempre requiere login
                es_propietario: true, // ✅ NUEVO: Marcarlo como propietario
                debe_cambiar_pass: false, // ✅ Ya definió su contraseña
            },
        });
        console.log('Paso 3: Empleado propietario creado.');
        // 4. Enviar email de validación
        email_service_1.emailService.sendRegistrationEmail(email_admin, nombre_empresa)
            .catch(err => console.error('Fallo en envío de email (no bloqueante):', err));
        console.log('Paso 4: Email de bienvenida encolado (Resend).');
        res.status(201).json({
            message: 'Tenant registrado. Revisa tu email para validar la cuenta.',
            tenantId: nuevoTenant.id,
        });
    }
    catch (error) {
        if (error.code === 'P2002' && error.meta?.target?.includes('subdominio')) {
            return res.status(409).json({ error: 'Este subdominio ya está en uso.' });
        }
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            return res.status(409).json({ error: 'Este email ya está en uso.' });
        }
        console.error('Error en registerTenant:', error);
        res.status(500).json({ error: 'Error al registrar el tenant' });
    }
};
exports.registerTenant = registerTenant;
