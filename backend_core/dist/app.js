"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const tenant_middleware_1 = require("@shared/middleware/tenant.middleware");
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
const catalog_1 = require("@modules/catalog");
const reviews_1 = require("@modules/reviews"); //Reseñas
const upload_routes_1 = __importDefault(require("@shared/upload/upload.routes")); // Import the new upload route
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
app.use((_req, res, __next) => {
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-Subdomain, X-Requested-With, Accept');
    res.header('Access-Control-Expose-Headers', 'X-Tenant-Subdomain');
    __next();
});
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
// ==================== RUTAS ====================
// 1. AUTH (Público)
app.use('/api/auth', auth_1.authRoutes);
// 2. WEB PÚBLICA (Requiere Tenant pero no Usuario)
const webRouter = express_1.default.Router();
webRouter.use(tenant_middleware_1.tenantMiddleware);
webRouter.use('/orders', orders_1.webPublicRoutes);
webRouter.use('/reservations', reservations_1.reservationsPublicRoutes);
webRouter.use('/catalog', catalog_1.catalogPublicRoutes);
webRouter.use('/config', tenant_1.tenantPublicConfigRoutes);
webRouter.use('/mesas', tables_1.tablesPublicRoutes);
webRouter.use('/reviews', reviews_1.reviewsRoutes); // Reseñas
webRouter.use('/', kitchen_1.ticketRoutes);
app.use('/api/web', webRouter);
// 3. DASHBOARD (Privado: Auth + Tenant + Access)
const dashboardRouter = express_1.default.Router();
dashboardRouter.use('/finance/tipos-gasto', finance_1.tiposGastoRoutes);
dashboardRouter.use('/orders', orders_1.ordersRoutes);
dashboardRouter.use('/web-orders', orders_1.webAdminRoutes);
dashboardRouter.use('/reservations', reservations_1.reservationsAdminRoutes);
dashboardRouter.use('/kitchen', kitchen_1.kitchenRoutes);
dashboardRouter.use('/inventory', inventory_1.inventoryRoutes);
dashboardRouter.use('/inventory/compras', inventory_1.comprasRoutes);
dashboardRouter.use('/finance', finance_1.financeRoutes);
dashboardRouter.use('/finance/tipos-gasto', finance_1.tiposGastoRoutes);
dashboardRouter.use('/reports', reports_1.reportsRoutes);
dashboardRouter.use('/employees', employees_1.employeesRoutes);
dashboardRouter.use('/mesas', tables_1.mesasRoutes);
dashboardRouter.use('/catalog', catalog_1.adminCatalogRoutes);
dashboardRouter.use('/', tenant_1.tenantRoutes);
dashboardRouter.use('/', reports_1.reportsRoutes);
dashboardRouter.use('/', upload_routes_1.default); // Use the new upload route
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
app.use((error, _req, res, __next) => {
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
