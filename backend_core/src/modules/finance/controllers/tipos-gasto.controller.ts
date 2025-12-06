import { Response } from 'express';
import { tiposGastoService } from '../services/tipos-gasto.service';
import { AuthRequest } from '@shared/middleware/auth.middleware';
import { RequestWithTenant } from '@shared/middleware/tenant.middleware';

type FinanceRequest = AuthRequest & RequestWithTenant;

export const tiposGastoController = {
  async getAll(req: FinanceRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      if (!tenantId) return res.status(403).json({ error: 'Acceso no autorizado' });

      const tiposGasto = await tiposGastoService.getAll(tenantId);
      res.json(tiposGasto);
    } catch (error: any) {
      console.error('Error getting tipos de gasto:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: FinanceRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      const id = parseInt(req.params.id);
      if (!tenantId) return res.status(403).json({ error: 'Acceso no autorizado' });

      const tipoGasto = await tiposGastoService.getById(tenantId, id);
      if (!tipoGasto) return res.status(404).json({ error: 'Tipo de gasto no encontrado' });
      
      res.json(tipoGasto);
    } catch (error: any) {
      console.error('Error getting tipo de gasto:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: FinanceRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      if (!tenantId) return res.status(403).json({ error: 'Acceso no autorizado' });

      const newTipoGasto = await tiposGastoService.create(tenantId, req.body);
      res.status(201).json(newTipoGasto);
    } catch (error: any) {
      console.error('Error creating tipo de gasto:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async update(req: FinanceRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      const id = parseInt(req.params.id);
      if (!tenantId) return res.status(403).json({ error: 'Acceso no autorizado' });

      const updatedTipoGasto = await tiposGastoService.update(tenantId, id, req.body);
      res.json(updatedTipoGasto);
    } catch (error: any) {
      console.error('Error updating tipo de gasto:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async delete(req: FinanceRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      const id = parseInt(req.params.id);
      if (!tenantId) return res.status(403).json({ error: 'Acceso no autorizado' });

      await tiposGastoService.delete(tenantId, id);
      res.json({ message: 'Tipo de gasto eliminado exitosamente' });
    } catch (error: any) {
      console.error('Error deleting tipo de gasto:', error);
      res.status(500).json({ error: error.message });
    }
  }
};
