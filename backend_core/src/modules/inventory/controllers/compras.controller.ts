import { Response } from 'express';
import { comprasService } from '../services/compras.service';
import { AuthRequest } from '@shared/middleware/auth.middleware';
import { RequestWithTenant } from '@shared/middleware/tenant.middleware';

type InventoryRequest = AuthRequest & RequestWithTenant;

export const comprasController = {
  async getAll(req: InventoryRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      if (!tenantId) return res.status(403).json({ error: 'Acceso no autorizado' });

      const compras = await comprasService.getAll(tenantId, req.query);
      res.json(compras);
    } catch (error: any) {
      console.error('Error getting compras:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: InventoryRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      const id = parseInt(req.params.id);
      if (!tenantId) return res.status(403).json({ error: 'Acceso no autorizado' });

      const compra = await comprasService.getById(tenantId, id);
      if (!compra) return res.status(404).json({ error: 'Compra no encontrada' });
      
      res.json(compra);
    } catch (error: any) {
      console.error('Error getting compra:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: InventoryRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      if (!tenantId) return res.status(403).json({ error: 'Acceso no autorizado' });

      const newCompra = await comprasService.create(tenantId, req.body);
      res.status(201).json(newCompra);
    } catch (error: any) {
      console.error('Error creating compra:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async update(req: InventoryRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      const id = parseInt(req.params.id);
      if (!tenantId) return res.status(403).json({ error: 'Acceso no autorizado' });

      const updatedCompra = await comprasService.update(tenantId, id, req.body);
      res.json(updatedCompra);
    } catch (error: any) {
      console.error('Error updating compra:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async delete(req: InventoryRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      const id = parseInt(req.params.id);
      if (!tenantId) return res.status(403).json({ error: 'Acceso no autorizado' });

      await comprasService.delete(tenantId, id);
      res.json({ message: 'Compra eliminada exitosamente' });
    } catch (error: any) {
      console.error('Error deleting compra:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async receiveCompra(req: InventoryRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      const id = parseInt(req.params.id);
      if (!tenantId) return res.status(403).json({ error: 'Acceso no autorizado' });

      const receivedCompra = await comprasService.receiveCompra(tenantId, id);
      res.json(receivedCompra);
    } catch (error: any) {
      console.error('Error receiving compra:', error);
      res.status(500).json({ error: error.message });
    }
  }
};
