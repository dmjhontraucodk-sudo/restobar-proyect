"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const reports_controller_1 = require("../controllers/reports.controller");
const auth_middleware_1 = require("@shared/middleware/auth.middleware");
const tenant_middleware_1 = require("@shared/middleware/tenant.middleware");
const verifyTenantAccess_1 = require("@shared/middleware/verifyTenantAccess");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.validateToken, tenant_middleware_1.tenantMiddleware, verifyTenantAccess_1.verifyTenantAccess);
// Dashboard General
router.get('/info', dashboard_controller_1.dashboardController.getDashboardInfo);
router.get('/overview', dashboard_controller_1.dashboardController.getOverviewData);
// Reportes Específicos
router.get('/sales/summary', reports_controller_1.reportsController.getSalesSummary);
router.get('/inventory/summary', reports_controller_1.reportsController.getInventorySummary);
router.get('/finance/summary', reports_controller_1.reportsController.getFinanceSummary);
exports.default = router;
