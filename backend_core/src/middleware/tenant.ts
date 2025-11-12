// src/middleware/tenant.ts - VERSIÓN CORREGIDA
import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { Request } from 'express';

interface RequestWithTenant extends Request {
  tenant?: {
    id: number;
    subdominio: string;
    configuracion: any;
    nombre_empresa?: string; 
  };
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

  let subdominio: string | null = null;
  
  if (hostname.endsWith(`.${rootDomain}`)) {
    const parts = hostname.split('.');
    subdominio = parts[0].toLowerCase();
  } else if (hostname === rootDomain) {
    subdominio = 'rb';
    console.log('🔍 TENANT MIDDLEWARE - Usando subdominio por defecto:', subdominio);
  } else {
    return res.status(403).json({ error: 'Host desconocido.' });
  }

  if (!subdominio) {
    return res.status(404).json({ error: 'Ruta no encontrada en el dominio raíz.' });
  }

  try {
    console.log('🔍 TENANT MIDDLEWARE - Buscando tenant:', subdominio);
    
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
    
    console.log('✅ TENANT MIDDLEWARE - Tenant configurado:', req.tenant.nombre_empresa);
    next();

  } catch (error) {
    console.error("❌ TENANT MIDDLEWARE - Error:", error);
    return res.status(500).json({ error: 'Error interno del servidor al procesar el tenant.' });
  }
};