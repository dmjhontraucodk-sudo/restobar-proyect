// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extendemos el tipo 'Request' de Express para añadir nuestra propiedad 'user'
// Esto es para que TypeScript sepa que 'req.user' existe.
interface AuthRequest extends Request {
  user?: string | jwt.JwtPayload; // 'user' contendrá el payload del token decodificado
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
    );

    // 4. Si el token es válido, guardamos el payload (info del usuario) en req.user
    req.user = payload;
    
    // 5. ¡Dejar pasar! Continuar al siguiente controlador
    next();

  } catch (error) {
    // 4. Si el token es inválido o expiró
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