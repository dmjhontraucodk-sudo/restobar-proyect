"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
router.post('/login', auth_controller_1.authController.login);
router.post('/register-tenant', auth_controller_1.authController.registerTenant);
exports.default = router;
