import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Interfaz extendida para el payload del JWT
export interface JwtPayload {
  id: number;
  email: string;
  tenant_id: number;
  rol_id: number;
  iat?: number;
  exp?: number;
}

// Extendemos el tipo 'Request' de Express
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const validateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    // 1. Buscar el token en la cabecera 'Authorization'
    const authHeader = req.headers['authorization'];
    
    // El formato esperado es "Bearer TOKEN_LARGO..."
    const token = authHeader && authHeader.split(' ')[1];

    // 2. Si no hay token, rechazar la petición
    if (!token) {
      res.status(401).json({ error: 'Acceso denegado. No se proporcionó token.' });
      return;
    }

    // 3. Verificar el token
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    // 4. Si el token es válido, guardamos el payload en req.user
    req.user = payload;
    
    // ✨ NUEVO: También exponer en el formato que esperan algunos controladores
    (req as any).userId = payload.id;
    (req as any).tenantId = payload.tenant_id;
    (req as any).rolId = payload.rol_id;
    
    // 5. ¡Dejar pasar! Continuar al siguiente controlador
    next();
    return;

  } catch (error: any) {
    console.error('❌ AUTH MIDDLEWARE - Error:', error);
    
    // Manejar diferentes tipos de errores
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expirado. Por favor, inicie sesión de nuevo.' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ error: 'Token inválido.' });
      return;
    }
    // Otro error
    res.status(500).json({ error: 'Error interno del servidor.' });
    return;
  }
};