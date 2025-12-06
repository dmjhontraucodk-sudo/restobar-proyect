"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_middleware_1 = require("@shared/middleware/auth.middleware");
const tenant_middleware_1 = require("@shared/middleware/tenant.middleware");
const verifyTenantAccess_1 = require("@shared/middleware/verifyTenantAccess");
const cron_service_1 = require("@core/cron/cron.service");
// Modules
const auth_1 = require("@modules/auth");
const reservations_1 = require("@modules/reservations");
const orders_1 = require("@modules/orders");
const kitchen_1 = require("@modules/kitchen");
const inventory_1 = require("@modules/inventory");
const finance_1 = require("@modules/finance");
const reports_1 = require("@modules/reports");
const employees_1 = require("@modules/employees");
const tables_1 = require("@modules/tables");
const tenant_1 = require("@modules/tenant");
dotenv_1.default.config();
const app = (0, express_1.default)();
// --- Configuración de CORS ---
const FRONTEND_PORT = (process.env.FRONTEND_URL || 'http://localhost:5174').split(':').pop();
const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'localhost';
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
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
                console.log('❌ CORS BLOCKED:', origin);
                callback(new Error('Origen no permitido por CORS'));
            }
        }
        catch (e) {
            console.log('❌ CORS ERROR:', origin);
            callback(new Error('Origen inválido'));
        }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Subdomain', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['X-Tenant-Subdomain']
};
app.use((0, cors_1.default)(corsOptions));
app.use((_req, res, _next) => {
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-Subdomain, X-Requested-With, Accept');
    res.header('Access-Control-Expose-Headers', 'X-Tenant-Subdomain');
    _next();
});
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
// ==================== RUTAS ====================
// 1. AUTH (Público)
app.use('/api/auth', auth_1.authRoutes);
// 2. WEB PÚBLICA (Requiere Tenant pero no Usuario)
// Montamos todas las rutas públicas bajo /api/web
const webRouter = express_1.default.Router();
webRouter.use(tenant_middleware_1.tenantMiddleware); // Aplicar middleware de tenant
webRouter.use('/orders', orders_1.webPublicRoutes); // /api/web/orders
webRouter.use('/reservations', reservations_1.reservationsPublicRoutes); // /api/web/reservations
webRouter.use('/', kitchen_1.ticketRoutes); // /api/web/orders/:n/ticket (Ticket route is /orders/:n/ticket in module)
app.use('/api/web', webRouter);
// 3. DASHBOARD (Privado: Auth + Tenant + Access)
const dashboardRouter = express_1.default.Router();
dashboardRouter.use(auth_middleware_1.validateToken, tenant_middleware_1.tenantMiddleware, verifyTenantAccess_1.verifyTenantAccess);
dashboardRouter.use('/orders', orders_1.ordersRoutes); // POS Orders
dashboardRouter.use('/web-orders', orders_1.webAdminRoutes); // Web Orders Admin
dashboardRouter.use('/reservations', reservations_1.reservationsAdminRoutes);
dashboardRouter.use('/kitchen', kitchen_1.kitchenRoutes); // /api/dashboard/kitchen/pedidos
dashboardRouter.use('/inventory', inventory_1.inventoryRoutes); // /api/dashboard/inventory/productos...
dashboardRouter.use('/finance', finance_1.financeRoutes); // /api/dashboard/finance/caja...
dashboardRouter.use('/reports', reports_1.reportsRoutes); // /api/dashboard/reports/sales...
dashboardRouter.use('/employees', employees_1.employeesRoutes);
dashboardRouter.use('/mesas', tables_1.mesasRoutes);
dashboardRouter.use('/config', tenant_1.tenantRoutes); // /api/dashboard/config/config... (Check path)
// tenantRoutes has /config, so /api/dashboard/config/config -> let's check tenantRoutes
// tenantRoutes: get('/config', ...). So /api/dashboard/config/config. 
// Maybe mount at /api/dashboard/tenant? 
// dashboard.routes.ts had: router.get('/config', ...). So it was /api/dashboard/config
// Let's mount tenantRoutes at root of dashboard? No, conflicts.
// Let's mount at / (root of dashboard)?
// If I mount tenantRoutes at /api/dashboard/tenant, the route becomes /api/dashboard/tenant/config.
// Frontend likely expects /api/dashboard/config.
// Let's change tenantRoutes to NOT have /config prefix inside?
// tenantRoutes has: router.get('/config', ...).
// So if I mount it at /api/dashboard, it matches /api/dashboard/config.
// Perfect.
dashboardRouter.use('/', tenant_1.tenantRoutes);
// Inventory routes has /productos, /categorias... so /api/dashboard/inventory/productos. Correct.
// Finance routes: /caja/estado... so /api/dashboard/finance/caja/estado. Correct.
// Kitchen routes: /pedidos... so /api/dashboard/kitchen/pedidos. Correct.
// Employees routes: / (get all), /:id... so /api/dashboard/employees/. Correct.
// Mesas routes: / (get all)... so /api/dashboard/mesas/. Correct.
// Dashboard Info & Overview (Reports module)
// reportsRoutes has /info, /overview.
// Mount at /api/dashboard?
// Then /api/dashboard/info. Correct.
dashboardRouter.use('/', reports_1.reportsRoutes);
app.use('/api/dashboard', dashboardRouter);
// ==================== DIAGNÓSTICO ====================
app.get('/health', (_req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Backend Core (Refactored)',
        environment: process.env.NODE_ENV
    });
});
app.use('*', (_req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: _req.originalUrl,
        method: _req.method
    });
});
app.use((error, _req, res, _next) => {
    console.error('💥 GLOBAL ERROR:', error);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});
if (process.env.NODE_ENV !== 'test') {
    cron_service_1.cronService.iniciarCronJobs();
}
exports.default = app;
