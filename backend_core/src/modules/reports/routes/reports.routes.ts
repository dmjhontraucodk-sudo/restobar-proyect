import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { reportsController } from '../controllers/reports.controller';
import { validateToken } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';
import { verifyTenantAccess } from '@shared/middleware/verifyTenantAccess';

const router = Router();

router.use(validateToken, tenantMiddleware, verifyTenantAccess);

// Dashboard General
router.get('/info', dashboardController.getDashboardInfo);
router.get('/overview', dashboardController.getOverviewData);

// Reportes Específicos
router.get('/sales/summary', reportsController.getSalesSummary);
router.get('/inventory/summary', reportsController.getInventorySummary);
router.get('/finance/summary', reportsController.getFinanceSummary);

export default router;
