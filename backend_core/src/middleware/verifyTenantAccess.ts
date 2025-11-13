// src/middleware/verifyTenantAccess.ts (NUEVO)
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
  req: RequestWithUserAndTenant,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    const tenant = req.tenant;

    console.log('🔐 VERIFY TENANT ACCESS - User:', user);
    console.log('🔐 VERIFY TENANT ACCESS - Tenant:', tenant);

    // Verificaciones de seguridad
    if (!user) {
      console.log('❌ VERIFY TENANT ACCESS - Usuario no autenticado');
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!tenant) {
      console.log('❌ VERIFY TENANT ACCESS - Tenant no identificado');
      return res.status(404).json({ error: 'Restaurante no identificado' });
    }

    // Verificar que el usuario pertenezca al tenant de la solicitud
    if (user.tenant_id !== tenant.id) {
      console.log(`❌ ACCESS DENIED - User tenant: ${user.tenant_id} Request tenant: ${tenant.id}`);
      return res.status(403).json({ 
        error: 'Acceso prohibido - No tienes permisos para este restaurante',
        details: {
          user_tenant: user.tenant_id,
          request_tenant: tenant.id,
          user_email: user.email,
          tenant_subdomain: tenant.subdominio
        }
      });
    }

    console.log(`✅ ACCESS GRANTED - User ${user.email} access to tenant ${tenant.subdominio}`);
    next();
  } catch (error) {
    console.error('❌ Error en verifyTenantAccess:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};