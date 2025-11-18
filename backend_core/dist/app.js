"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts (VERSIÓN COMPLETAMENTE CORREGIDA)
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const tenant_1 = require("./middleware/tenant");
const auth_middleware_1 = require("./middleware/auth.middleware");
const verifyTenantAccess_1 = require("./middleware/verifyTenantAccess");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const web_routes_1 = __importDefault(require("./routes/web.routes"));
dotenv_1.default.config();
// Crea la instancia de la aplicación Express
const app = (0, express_1.default)();
// --- Configuración de CORS MEJORADA ---
const FRONTEND_PORT = (process.env.FRONTEND_URL || 'http://localhost:5174').split(':').pop();
const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'localhost';
const corsOptions = {
    origin: (origin, callback) => {
        // Permitir peticiones sin origen (como Postman o apps móviles)
        if (!origin) {
            return callback(null, true);
        }
        try {
            const originUrl = new URL(origin);
            const hostname = originUrl.hostname;
            const port = originUrl.port;
            const isPortAllowed = (port === FRONTEND_PORT);
            const isHostnameAllowed = (hostname === ROOT_DOMAIN || hostname.endsWith(`.${ROOT_DOMAIN}`));
            if (isPortAllowed && isHostnameAllowed) {
                callback(null, true);
            }
            else {
                console.log('❌ CORS BLOCKED - Origin not allowed:', origin);
                callback(new Error('Origen no permitido por CORS'));
            }
        }
        catch (e) {
            console.log('❌ CORS ERROR - Invalid origin:', origin);
            callback(new Error('Origen inválido'));
        }
    },
    credentials: true,
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Tenant-Subdomain',
        'X-Requested-With',
        'Accept'
    ],
    exposedHeaders: ['X-Tenant-Subdomain']
};
app.use((0, cors_1.default)(corsOptions));
// ✨ MIDDLEWARE ADICIONAL PARA HEADERS CORS ✨
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-Subdomain, X-Requested-With, Accept');
    res.header('Access-Control-Expose-Headers', 'X-Tenant-Subdomain');
    next();
});
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
// --- RUTAS PÚBLICAS (Globales) ---
app.use('/api/auth', auth_routes_1.default);
// --- RUTAS PÚBLICAS WEB (Por Tenant) ---
app.use('/api/web', tenant_1.tenantMiddleware, web_routes_1.default);
// --- RUTAS PRIVADAS DASHBOARD (Con auth + tenant + verificación) ---
app.use('/api/dashboard', [
    auth_middleware_1.validateToken, // 1º: Verificar JWT y cargar usuario en req.user
    tenant_1.tenantMiddleware, // 2º: Identificar tenant y cargar en req.tenant
    verifyTenantAccess_1.verifyTenantAccess // 3º: Verificar que usuario pertenezca al tenant
], dashboard_routes_1.default);
// --- RUTAS DE PRUEBA Y DIAGNÓSTICO ---
// Ruta para probar solo el tenant middleware
app.get('/api/tenant-check', tenant_1.tenantMiddleware, (req, res) => {
    res.json({
        message: 'Tenant middleware funciona',
        tenant: req.tenant,
        headers_received: {
            'x-tenant-subdomain': req.headers['x-tenant-subdomain'],
            host: req.headers.host
        }
    });
});
// Ruta para probar solo el auth middleware
app.get('/api/auth-check', auth_middleware_1.validateToken, (req, res) => {
    res.json({
        message: 'Auth middleware funciona',
        user: req.user
    });
});
// Ruta para probar el flujo completo
app.get('/api/full-check', [
    auth_middleware_1.validateToken,
    tenant_1.tenantMiddleware,
    verifyTenantAccess_1.verifyTenantAccess
], (req, res) => {
    res.json({
        message: 'Flujo completo funciona',
        user: req.user,
        tenant: req.tenant,
        access: 'GRANTED'
    });
});
// Ruta de salud para verificar que el servidor está funcionando
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Backend Core',
        environment: process.env.NODE_ENV
    });
});
// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.originalUrl,
        method: req.method
    });
});
// Manejo global de errores - CORREGIDO
app.use((error, req, res, next) => {
    console.error('💥 GLOBAL ERROR HANDLER:', error);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Contacte al administrador'
    });
});
exports.default = app;
