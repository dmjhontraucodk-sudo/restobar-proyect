"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const validateToken = (req, res, next) => {
    try {
        // 1. Buscar el token en la cabecera 'Authorization'
        const authHeader = req.headers['authorization'];
        // El formato esperado es "Bearer TOKEN_LARGO..."
        const token = authHeader && authHeader.split(' ')[1];
        // 2. Si no hay token, rechazar la petición
        if (!token) {
            res.status(401).json({ error: 'Acceso denegado. No se proporcionó token.' });
            return;
        }
        // 3. Verificar el token
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // 4. Si el token es válido, guardamos el payload en req.user
        req.user = payload;
        // ✨ NUEVO: También exponer en el formato que esperan algunos controladores
        req.userId = payload.id;
        req.tenantId = payload.tenant_id;
        req.rolId = payload.rol_id;
        // 5. ¡Dejar pasar! Continuar al siguiente controlador
        next();
        return;
    }
    catch (error) {
        console.error('❌ AUTH MIDDLEWARE - Error:', error);
        // Manejar diferentes tipos de errores
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ error: 'Token expirado. Por favor, inicie sesión de nuevo.' });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(403).json({ error: 'Token inválido.' });
            return;
        }
        // Otro error
        res.status(500).json({ error: 'Error interno del servidor.' });
        return;
    }
};
exports.validateToken = validateToken;
