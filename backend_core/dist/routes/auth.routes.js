"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/auth.routes.ts
const express_1 = require("express");
// 1. Importamos el controlador que tiene la lógica
const auth_controller_1 = require("../controller/auth/auth.controller");
const router = (0, express_1.Router)();
/*
 * Endpoint para el "Registro de Nuevos Tenants"
 * POST /api/auth/register-tenant
 *
 * La lógica vive ahora en 'auth.controller.ts'
 */
// 2. Conectamos la ruta con el controlador
router.post('/register-tenant', auth_controller_1.registerTenant);
router.post('/login', auth_controller_1.login);
// Aquí puedes añadir más rutas de autenticación si quieres
// router.post('/login', loginController);
// router.post('/forgot-password', forgotPasswordController);
exports.default = router;
