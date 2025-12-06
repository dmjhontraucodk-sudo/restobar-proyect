"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const web_catalog_controller_1 = require("../controllers/web-catalog.controller");
const router = (0, express_1.Router)();
// Ruta pública - NO requiere autenticación
// Solo requiere tenantMiddleware (ya aplicado en app.ts)
router.get('/', web_catalog_controller_1.webCatalogController.getCatalog);
exports.default = router;
