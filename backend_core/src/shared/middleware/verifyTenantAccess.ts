import { Request, Response, NextFunction } from 'express';

// Interfaces para TypeScript
interface JwtPayload {
  id: number;
  email: string;
  tenant_id: number;
  rol_id: number;
}

interface TenantInfo {
  id: number;
  subdominio: string;
  nombre_empresa?: string;
  configuracion: any;
}

interface RequestWithUserAndTenant extends Request {
  user?: JwtPayload;
  tenant?: TenantInfo;
}

export const verifyTenantAccess = (
  _req: RequestWithUserAndTenant,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const user = _req.user;
    const tenant = _req.tenant;

    // Verificaciones de seguridad
    if (!user) {
      _res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    if (!tenant) {
      _res.status(404).json({ error: 'Restaurante no identificado' });
      return;
    }

    // Verificar que el usuario pertenezca al tenant de la solicitud
    if (user.tenant_id !== tenant.id) {
      _res.status(403).json({ 
        error: 'Acceso prohibido - No tienes permisos para este restaurante',
        details: {
          user_tenant: user.tenant_id,
          request_tenant: tenant.id,
          user_email: user.email,
          tenant_subdomain: tenant.subdominio
        }
      });
      return;
    }

    next();
    return;
  } catch (error: any) {
    console.error('❌ Error en verifyTenantAccess:', error);
    _res.status(500).json({ error: 'Error interno del servidor' });
    return;
  }
};