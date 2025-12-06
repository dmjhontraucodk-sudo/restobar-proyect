"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsService = exports.DashboardService = exports.reportsController = exports.dashboardController = exports.reportsRoutes = void 0;
var reports_routes_1 = require("./routes/reports.routes");
Object.defineProperty(exports, "reportsRoutes", { enumerable: true, get: function () { return __importDefault(reports_routes_1).default; } });
var dashboard_controller_1 = require("./controllers/dashboard.controller");
Object.defineProperty(exports, "dashboardController", { enumerable: true, get: function () { return dashboard_controller_1.dashboardController; } });
var reports_controller_1 = require("./controllers/reports.controller");
Object.defineProperty(exports, "reportsController", { enumerable: true, get: function () { return reports_controller_1.reportsController; } });
var dashboard_service_1 = require("./services/dashboard.service");
Object.defineProperty(exports, "DashboardService", { enumerable: true, get: function () { return dashboard_service_1.DashboardService; } });
var reports_service_1 = require("./services/reports.service");
Object.defineProperty(exports, "reportsService", { enumerable: true, get: function () { return reports_service_1.reportsService; } });
