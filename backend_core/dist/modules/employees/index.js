"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolesService = exports.empleadosService = exports.rolesController = exports.empleadosController = exports.employeesRoutes = void 0;
var employees_routes_1 = require("./routes/employees.routes");
Object.defineProperty(exports, "employeesRoutes", { enumerable: true, get: function () { return __importDefault(employees_routes_1).default; } });
var empleados_controller_1 = require("./controllers/empleados.controller");
Object.defineProperty(exports, "empleadosController", { enumerable: true, get: function () { return empleados_controller_1.empleadosController; } });
var roles_controller_1 = require("./controllers/roles.controller");
Object.defineProperty(exports, "rolesController", { enumerable: true, get: function () { return roles_controller_1.rolesController; } });
var empleados_service_1 = require("./services/empleados.service");
Object.defineProperty(exports, "empleadosService", { enumerable: true, get: function () { return empleados_service_1.empleadosService; } });
var roles_service_1 = require("./services/roles.service");
Object.defineProperty(exports, "rolesService", { enumerable: true, get: function () { return roles_service_1.rolesService; } });
