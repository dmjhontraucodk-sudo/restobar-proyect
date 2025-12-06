"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.authController = exports.authRoutes = void 0;
var auth_routes_1 = require("./routes/auth.routes");
Object.defineProperty(exports, "authRoutes", { enumerable: true, get: function () { return __importDefault(auth_routes_1).default; } });
var auth_controller_1 = require("./controllers/auth.controller");
Object.defineProperty(exports, "authController", { enumerable: true, get: function () { return auth_controller_1.authController; } });
var auth_service_1 = require("./services/auth.service");
Object.defineProperty(exports, "authService", { enumerable: true, get: function () { return auth_service_1.authService; } });
