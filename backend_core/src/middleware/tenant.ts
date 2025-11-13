// src/middleware/tenant.ts (VERSIÓN COMPLETAMENTE REPARADA)
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

interface TenantInfo {
  id: number;
  subdominio: string;
  configuracion: any;
  nombre_empresa?: string; 
}

interface RequestWithTenant extends Request {
  tenant?: TenantInfo;
}

export const tenantMiddleware = async (
  req: RequestWithTenant,
  res: Response,
  next: NextFunction,
) => {
  
  const hostname = req.hostname; 
  const rootDomain = process.env.ROOT_DOMAIN || 'localhost';

  console.log('🔍 TENANT MIDDLEWARE - Hostname:', hostname);
  console.log('🔍 TENANT MIDDLEWARE - Original URL:', req.originalUrl);

  // 🔧 DETECCIÓN MEJORADA - SIEMPRE USAR HEADER SI ESTÁ PRESENTE
  const tenantFromHeader = req.headers['x-tenant-subdomain'] as string;
  
  console.log('🔍 TENANT MIDDLEWARE - Header X-Tenant-Subdomain:', tenantFromHeader);
  console.log('🔍 TENANT MIDDLEWARE - ALL HEADERS:', Object.keys(req.headers).map(key => ({
    key,
    value: req.headers[key]
  })));

  // 🚨 PRIORIDAD 1: HEADER X-TENANT-SUBDOMAIN (SIEMPRE)
  if (tenantFromHeader) {
    console.log('🎯 TENANT MIDDLEWARE - Usando tenant desde header:', tenantFromHeader);
    
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
        console.log('✅ TENANT MIDDLEWARE - Tenant configurado desde header:', {
          id: tenant.id,
          subdominio: tenant.subdominio,
          nombre_empresa: tenant.nombre_empresa
        });
        return next();
      } else {
        console.log('❌ TENANT MIDDLEWARE - Tenant no encontrado en BD:', tenantFromHeader);
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

  console.log('🔍 TENANT MIDDLEWARE - No se recibió header, usando lógica de subdominios...');

  // 🚨 PRIORIDAD 2: LÓGICA DE SUBDOMINIOS (SOLO SI NO HAY HEADER)
  let subdominio: string | null = null;
  
  if (hostname.endsWith(`.${rootDomain}`)) {
    const parts = hostname.split('.');
    subdominio = parts[0].toLowerCase();
  } else if (hostname === rootDomain) {
    subdominio = 'rb'; // Solo usar por defecto si no hay header
    console.log('🔍 TENANT MIDDLEWARE - Usando subdominio por defecto:', subdominio);
  } else {
    return res.status(403).json({ error: 'Host desconocido.' });
  }

  if (!subdominio) {
    return res.status(404).json({ error: 'Ruta no encontrada en el dominio raíz.' });
  }

  try {
    console.log('🔍 TENANT MIDDLEWARE - Buscando tenant por subdominio:', subdominio);
    
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

    console.log('🔍 TENANT MIDDLEWARE - Tenant encontrado:', tenant);

    if (!tenant) {
      console.log('❌ TENANT MIDDLEWARE - Tenant no encontrado para:', subdominio);
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
    
    console.log('✅ TENANT MIDDLEWARE - Tenant configurado desde subdominio:', req.tenant.nombre_empresa);
    next();



    
  } catch (error) {
    console.error("❌ TENANT MIDDLEWARE - Error:", error);
    return res.status(500).json({ error: 'Error interno del servidor al procesar el tenant.' });
  }
};