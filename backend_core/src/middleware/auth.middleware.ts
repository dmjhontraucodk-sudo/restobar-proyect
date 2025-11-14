// src/middleware/auth.middleware.ts (VERSIÓN CORREGIDA)
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Interfaz extendida para el payload del JWT
interface JwtPayload {
  id: number;
  email: string;
  tenant_id: number;
  rol_id: number;
  iat?: number;
  exp?: number;
}

// Extendemos el tipo 'Request' de Express
interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const validateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // 1. Buscar el token en la cabecera 'Authorization'
    const authHeader = req.headers['authorization'];
    
    // El formato esperado es "Bearer TOKEN_LARGO..."
    const token = authHeader && authHeader.split(' ')[1];

    // 2. Si no hay token, rechazar la petición
    if (!token) {
      return res.status(401).json({ error: 'Acceso denegado. No se proporcionó token.' });
    }

    // 3. Verificar el token
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    // 4. Si el token es válido, guardamos el payload (info del usuario) en req.user
    req.user = payload;
    
    console.log('🔐 AUTH MIDDLEWARE - User authenticated:', {
      id: payload.id,
      email: payload.email,
      tenant_id: payload.tenant_id,
      rol_id: payload.rol_id
    });
    
    // 5. ¡Dejar pasar! Continuar al siguiente controlador
    next();

  } catch (error) {
    console.error('❌ AUTH MIDDLEWARE - Error:', error);
    
    // Manejar diferentes tipos de errores
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expirado. Por favor, inicie sesión de nuevo.' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ error: 'Token inválido.' });
    }
    // Otro error
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
};