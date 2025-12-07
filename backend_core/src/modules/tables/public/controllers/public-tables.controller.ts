import { Request, Response } from 'express';
import { prisma } from '@shared/database/prisma.service';
import { notificationService } from '@core/notifications/notification.service';

interface TenantRequest extends Request {
  tenant?: {
    id: number;
    subdominio: string;
  };
}

export const publicTablesController = {
  
  /**
   * GET /api/web/mesas/disponibles
   * Obtiene las mesas disponibles del tenant para reservas públicas
   */
  async getAvailableTables(req: TenantRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.tenant?.id;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant no identificado' });
      }

      // Obtener mesas libres
      const mesasDisponibles = await prisma.mesas.findMany({
        where: { 
          tenant_id: tenantId,
          estado: 'Libre'
        },
        select: {
          id: true,
          nombre_o_numero: true,
          capacidad: true,
          estado: true,
        },
        orderBy: { nombre_o_numero: 'asc' }
      });

      return res.json(mesasDisponibles);

    } catch (error: any) {
      console.error('Error en getAvailableTables:', error);
      return res.status(500).json({ 
        error: 'Error al obtener mesas disponibles',
        message: error.message 
      });
    }
  },

  /**
   * GET /api/web/mesas/:id
   * Obtiene detalles de una mesa específica (para la carta virtual)
   */
  async getTableDetails(req: TenantRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.tenant?.id;
      const tableId = parseInt(req.params.id);
      
      if (!tenantId) return res.status(400).json({ error: 'Tenant no identificado' });
      if (isNaN(tableId)) return res.status(400).json({ error: 'ID de mesa inválido' });

      const mesa = await prisma.mesas.findFirst({
        where: { 
          id: tableId,
          tenant_id: tenantId
        },
        select: {
          id: true,
          nombre_o_numero: true,
          estado: true,
          capacidad: true
        }
      });

      if (!mesa) {
        return res.status(404).json({ error: 'Mesa no encontrada' });
      }

      return res.json(mesa);

    } catch (error: any) {
      console.error('Error en getTableDetails:', error);
      return res.status(500).json({ 
        error: 'Error al obtener detalles de la mesa',
        message: error.message 
      });
    }
  },

  /**
   * POST /api/web/mesas/:id/call
   * Solicita atención del personal (Llamar al Mozo)
   */
  async callWaiter(req: TenantRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.tenant?.id;
      const tableId = parseInt(req.params.id);
      
      if (!tenantId) return res.status(400).json({ error: 'Tenant no identificado' });
      if (isNaN(tableId)) return res.status(400).json({ error: 'ID de mesa inválido' });

      // 1. Verificar que la mesa existe
      const mesa = await prisma.mesas.findFirst({
        where: { 
          id: tableId,
          tenant_id: tenantId
        }
      });

      if (!mesa) {
        return res.status(404).json({ error: 'Mesa no encontrada' });
      }

      // 2. Enviar notificación (Email por ahora)
      await notificationService.notificarLlamadoMozo(tenantId, mesa.nombre_o_numero);

      return res.json({ 
        success: true, 
        message: 'Personal notificado exitosamente' 
      });

    } catch (error: any) {
      console.error('Error en callWaiter:', error);
      return res.status(500).json({ 
        error: 'Error al llamar al personal',
        message: error.message 
      });
    }
  }
};