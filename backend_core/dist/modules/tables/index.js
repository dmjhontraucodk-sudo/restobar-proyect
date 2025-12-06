"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mesasService = exports.mesasController = exports.mesasRoutes = void 0;
var mesas_routes_1 = require("./routes/mesas.routes");
Object.defineProperty(exports, "mesasRoutes", { enumerable: true, get: function () { return __importDefault(mesas_routes_1).default; } });
var mesas_controller_1 = require("./controllers/mesas.controller");
Object.defineProperty(exports, "mesasController", { enumerable: true, get: function () { return mesas_controller_1.mesasController; } });
var mesas_service_1 = require("./services/mesas.service");
Object.defineProperty(exports, "mesasService", { enumerable: true, get: function () { return mesas_service_1.mesasService; } });
