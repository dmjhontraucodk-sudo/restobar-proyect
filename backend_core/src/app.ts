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
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Si no hay origen (Postman) o es cualquier variante de localhost, permitir
    if (!origin || origin.includes('localhost')) {
      return callback(null, true);
    }
    
    console.error('❌ CORS BLOCKED:', origin);
    return callback(new Error('Origen no permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Subdomain', 'Accept'],
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
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