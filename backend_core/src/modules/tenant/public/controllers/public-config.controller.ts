import { Request, Response } from 'express';
import { prisma } from '@shared/database/prisma.service';

interface TenantRequest extends Request {
  tenant?: {
    id: number;
    subdominio: string;
  };
}

export const publicConfigController = {
  async getPublicConfig(req: TenantRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.tenant?.id;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant no identificado' });
      }

      const tenant = await prisma.tenants.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          subdominio: true,
          nombre_empresa: true,
          configuracion: true,
        }
      });

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant no encontrado' });
      }

      return res.json({
        nombre_empresa: tenant.nombre_empresa,
        subdominio: tenant.subdominio,
        configuracion: tenant.configuracion || {}
      });

    } catch (error: any) {
      console.error('Error en getPublicConfig:', error);
      return res.status(500).json({ 
        error: 'Error al obtener configuración',
        message: error.message 
      });
    }
  }
};