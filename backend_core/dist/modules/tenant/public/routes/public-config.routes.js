"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const public_config_controller_1 = require("../controllers/public-config.controller");
const router = (0, express_1.Router)();
// Ruta pública - NO requiere autenticación
router.get('/', public_config_controller_1.publicConfigController.getPublicConfig);
exports.default = router; // ✅ DEBE TENER ESTA LÍNEA
