import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/prisma.service';

export interface TenantInfo {
  id: number;
  subdominio: string;
  configuracion: any;
  nombre_empresa?: string; 
}

export interface RequestWithTenant extends Request {
  tenant?: TenantInfo;
}

export const tenantMiddleware = async (
  req: RequestWithTenant,
  res: Response,
  next: NextFunction,
) => {
  
  const hostname = req.hostname; 
  const rootDomain = process.env.ROOT_DOMAIN || 'localhost';

  // 🔧 DETECCIÓN MEJORADA - SIEMPRE USAR HEADER SI ESTÁ PRESENTE
  const tenantFromHeader = req.headers['x-tenant-subdomain'] as string;
  
  // 🚨 PRIORIDAD 1: HEADER X-TENANT-SUBDOMAIN (SIEMPRE)
  if (tenantFromHeader) {
    try {
      const tenant = await prisma.tenants.findUnique({
        where: {
          subdominio: tenantFromHeader,
          isActive: true,
        },
        select: { 
          id: true,
          subdominio: true,
          nombre_empresa: true, 
          configuracion: true,
        }
      });

      if (tenant) {
        req.tenant = tenant;
        return next();
      } else {
        return res.status(404).json({ 
          error: 'Restaurante no encontrado.',
          subdominio_buscado: tenantFromHeader 
        });
      }
    } catch (error) {
      console.error('❌ Error buscando tenant:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // 🚨 PRIORIDAD 2: LÓGICA DE SUBDOMINIOS (SOLO SI NO HAY HEADER)
  let subdominio: string | null = null;
  
  if (hostname.endsWith(`.${rootDomain}`)) {
    const parts = hostname.split('.');
    subdominio = parts[0].toLowerCase();
  } else if (hostname === rootDomain) {
    subdominio = 'rb'; // Solo usar por defecto si no hay header
  } else {
    return res.status(403).json({ error: 'Host desconocido.' });
  }

  if (!subdominio) {
    return res.status(404).json({ error: 'Ruta no encontrada en el dominio raíz.' });
  }

  try {
    const tenant = await prisma.tenants.findUnique({
      where: {
        subdominio: subdominio,
        isActive: true,
      },
      select: { 
        id: true,
        subdominio: true,
        nombre_empresa: true, 
        configuracion: true,
      }
    });

    if (!tenant) {
      return res.status(404).json({ 
        error: 'Restaurante no encontrado.',
        subdominio_buscado: subdominio 
      });
    }

    req.tenant = {
      id: tenant.id,
      subdominio: tenant.subdominio,
      nombre_empresa: tenant.nombre_empresa, 
      configuracion: tenant.configuracion,
    };
    
    next();
    
  } catch (error) {
    console.error("❌ TENANT MIDDLEWARE - Error:", error);
    return res.status(500).json({ error: 'Error interno del servidor al procesar el tenant.' });
  }
};
