"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const auth_service_1 = require("../services/auth.service");
exports.authController = {
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password)
                return res.status(400).json({ error: 'Email y contraseña son requeridos' });
            const result = await auth_service_1.authService.login(email, password);
            res.status(200).json({ message: 'Login exitoso', ...result });
        }
        catch (error) {
            const status = error.message === 'Credenciales inválidas' ? 401 :
                error.message === 'Usuario no encontrado' ? 404 : 400;
            res.status(status).json({ error: error.message });
        }
    },
    async registerTenant(req, res) {
        try {
            const { nombre_empresa, subdominio, email_admin, password } = req.body;
            if (!nombre_empresa || !subdominio || !email_admin || !password) {
                return res.status(400).json({ error: 'Faltan campos requeridos' });
            }
            const tenant = await auth_service_1.authService.registerTenant(req.body);
            res.status(201).json({
                message: 'Tenant registrado. Revisa tu email para validar la cuenta.',
                tenantId: tenant.id,
            });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};
