import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';
import { validateToken } from '@shared/middleware/auth.middleware';
import { cronService } from '@core/cron/cron.service';

// Modules
import { authRoutes } from '@modules/auth';
import { reservationsPublicRoutes, reservationsAdminRoutes } from '@modules/reservations';
import { webPublicRoutes, webAdminRoutes, ordersRoutes } from '@modules/orders';
import { ticketRoutes, kitchenRoutes } from '@modules/kitchen';
import { inventoryRoutes, comprasRoutes } from '@modules/inventory';
import { financeRoutes, tiposGastoRoutes } from '@modules/finance';
import { reportsRoutes, rolePerformanceRoutes } from '@modules/reports';
import { employeesRoutes } from '@modules/employees';
import { mesasRoutes, tablesPublicRoutes } from '@modules/tables';
import { tenantRoutes, tenantPublicConfigRoutes } from '@modules/tenant';
import { catalogPublicRoutes, adminCatalogRoutes } from '@modules/catalog';
import { clientsRoutes, publicClientsRoutes } from '@modules/clients';
import { reviewsRoutes, reviewsAdminRoutes } from '@modules/reviews'; //Reseñas
import { billingRouter } from '@modules/billing';
import uploadRoutes from '@shared/upload/upload.routes'; // Import the new upload route
import { rbacRoutes } from '@modules/rbac';
import { provisioningRoutes } from '@modules/provisioning/routes';

dotenv.config();

const app = express();

// --- Configuración de CORS ---
const FRONTEND_PORT = (process.env.FRONTEND_URL || 'http://localhost:5174').split(':').pop();
const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'localhost';

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    try {
      const originUrl = new URL(origin);
      const hostname = originUrl.hostname;
      const port = originUrl.port;
      const isPortAllowed = (port === FRONTEND_PORT);
      const isHostnameAllowed = (hostname === ROOT_DOMAIN || hostname.endsWith(`.${ROOT_DOMAIN}`));

      if (isPortAllowed && isHostnameAllowed) {
        callback(null, true);
      } else {
        console.log('❌ CORS BLOCKED:', origin);
        callback(new Error('Origen no permitido por CORS'));
      }
    } catch (e) {
      console.log('❌ CORS ERROR:', origin);
      callback(new Error('Origen inválido'));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Subdomain', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['X-Tenant-Subdomain']
};

app.use(cors(corsOptions));
app.use((_req: Request, res: Response, __next: NextFunction) => {
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-Subdomain, X-Requested-With, Accept');
  res.header('Access-Control-Expose-Headers', 'X-Tenant-Subdomain');
  __next();
});

app.use(express.json());
app.use(morgan('dev'));

// ==================== RUTAS ====================

// 0. PROVISIONING (Private)
app.use('/api/provisioning', provisioningRoutes);

// 1. AUTH (Público)
app.use('/api/auth', authRoutes);

// 2. WEB PÚBLICA (Requiere Tenant pero no Usuario)
const webRouter = express.Router();
webRouter.use(tenantMiddleware);

webRouter.use('/orders', webPublicRoutes);
webRouter.use('/reservations', reservationsPublicRoutes);
webRouter.use('/catalog', catalogPublicRoutes);
webRouter.use('/config', tenantPublicConfigRoutes);
webRouter.use('/mesas', tablesPublicRoutes);
webRouter.use('/reviews', reviewsRoutes); // Reseñas
webRouter.use('/clients', publicClientsRoutes);
webRouter.use('/', ticketRoutes);

app.use('/api/web', webRouter);

// 3. DASHBOARD (Privado: Auth + Tenant + Access)
const dashboardRouter = express.Router();
dashboardRouter.use(validateToken);
dashboardRouter.use(tenantMiddleware);
dashboardRouter.use('/finance/tipos-gasto', tiposGastoRoutes);
dashboardRouter.use('/orders', ordersRoutes);
dashboardRouter.use('/web-orders', webAdminRoutes);
dashboardRouter.use('/reservations', reservationsAdminRoutes);
dashboardRouter.use('/kitchen', kitchenRoutes);
dashboardRouter.use('/inventory', inventoryRoutes);
dashboardRouter.use('/inventory/compras', comprasRoutes);
dashboardRouter.use('/finance', financeRoutes);
dashboardRouter.use('/finance/tipos-gasto', tiposGastoRoutes);
dashboardRouter.use('/reports', reportsRoutes);
dashboardRouter.use('/reports', rolePerformanceRoutes);
dashboardRouter.use('/employees', employeesRoutes);
dashboardRouter.use('/mesas', mesasRoutes);
dashboardRouter.use('/catalog', adminCatalogRoutes);
dashboardRouter.use('/reviews', reviewsAdminRoutes);
dashboardRouter.use('/clients', clientsRoutes);
dashboardRouter.use('/billing', billingRouter);
dashboardRouter.use('/rbac', rbacRoutes);
dashboardRouter.use('/', tenantRoutes);
dashboardRouter.use('/', reportsRoutes);
dashboardRouter.use('/', uploadRoutes); // Use the new upload route

app.use('/api/dashboard', dashboardRouter);

// ==================== DIAGNÓSTICO ====================
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Backend Core (Refactored)',
    environment: process.env.NODE_ENV
  });
});

app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: _req.originalUrl,
    method: _req.method
  });
});

app.use((error: any, _req: Request, res: Response, __next: NextFunction) => {
  console.error('💥 GLOBAL ERROR:', error);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

if (process.env.NODE_ENV !== 'test') {
  cronService.iniciarCronJobs();
}

export default app;