"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCatalogController = exports.webCatalogController = exports.adminCatalogRoutes = exports.catalogPublicRoutes = void 0;
var web_catalog_routes_1 = require("./routes/web-catalog.routes");
Object.defineProperty(exports, "catalogPublicRoutes", { enumerable: true, get: function () { return __importDefault(web_catalog_routes_1).default; } });
var admin_catalog_routes_1 = require("./routes/admin-catalog.routes");
Object.defineProperty(exports, "adminCatalogRoutes", { enumerable: true, get: function () { return __importDefault(admin_catalog_routes_1).default; } });
var web_catalog_controller_1 = require("./controllers/web-catalog.controller");
Object.defineProperty(exports, "webCatalogController", { enumerable: true, get: function () { return web_catalog_controller_1.webCatalogController; } });
var admin_catalog_controller_1 = require("./controllers/admin-catalog.controller");
Object.defineProperty(exports, "adminCatalogController", { enumerable: true, get: function () { return admin_catalog_controller_1.adminCatalogController; } });
