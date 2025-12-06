"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantConfigService = exports.tenantConfigController = exports.tenantRoutes = void 0;
var tenant_routes_1 = require("./routes/tenant.routes");
Object.defineProperty(exports, "tenantRoutes", { enumerable: true, get: function () { return __importDefault(tenant_routes_1).default; } });
var tenant_config_controller_1 = require("./controllers/tenant-config.controller");
Object.defineProperty(exports, "tenantConfigController", { enumerable: true, get: function () { return tenant_config_controller_1.tenantConfigController; } });
var tenant_config_service_1 = require("./services/tenant-config.service");
Object.defineProperty(exports, "tenantConfigService", { enumerable: true, get: function () { return tenant_config_service_1.tenantConfigService; } });
