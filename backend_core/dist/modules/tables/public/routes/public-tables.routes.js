"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const public_tables_controller_1 = require("../controllers/public-tables.controller");
const router = (0, express_1.Router)();
// Rutas públicas - NO requieren autenticación
router.get('/disponibles', public_tables_controller_1.publicTablesController.getAvailableTables);
exports.default = router;
