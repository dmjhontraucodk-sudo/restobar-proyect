// src/routes/auth.routes.ts
import { Router } from 'express';
// 1. Importamos el controlador que tiene la lógica
import { registerTenant, login } from '../controller/auth/auth.controller';

const router = Router();

/*
 * Endpoint para el "Registro de Nuevos Tenants"
 * POST /api/auth/register-tenant
 *
 * La lógica vive ahora en 'auth.controller.ts'
 */
// 2. Conectamos la ruta con el controlador
router.post('/register-tenant', registerTenant);

router.post('/login', login);

// Aquí puedes añadir más rutas de autenticación si quieres
// router.post('/login', loginController);
// router.post('/forgot-password', forgotPasswordController);

export default router;