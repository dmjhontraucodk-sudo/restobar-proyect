
import { Response } from 'express';
import { RequestWithTenant } from '@shared/middleware/tenant.middleware';
import { clientsService } from '../services/clients.service';

export const clientsController = {
  async findClientByPhone(req: RequestWithTenant, res: Response): Promise<any> {
    try {
      const { telefono } = req.params;
      const tenantId = req.tenant!.id;

      if (!telefono) {
        return res.status(400).json({ success: false, error: 'Phone number is required' });
      }

      const client = await clientsService.findClientByPhone(tenantId, telefono);

      if (client) {
        res.json({ success: true, client });
      } else {
        res.status(404).json({ success: false, error: 'Client not found' });
      }
    } catch (error: any) {
      console.error('Error finding client by phone:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  },

  async findClientByDocument(req: RequestWithTenant, res: Response): Promise<any> {
    try {
      const { documento_identidad } = req.params;
      const tenantId = req.tenant!.id;

      if (!documento_identidad) {
        return res.status(400).json({ success: false, error: 'Document ID is required' });
      }

      const client = await clientsService.findClientByDocument(tenantId, documento_identidad);

      if (client) {
        res.json({ success: true, client });
      } else {
        res.status(404).json({ success: false, error: 'Client not found' });
      }
    } catch (error: any) {
      console.error('Error finding client by document:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  },

  async findClientForReview(req: RequestWithTenant, res: Response): Promise<any> {
    try {
      const { documento_identidad } = req.params;
      const tenantId = req.tenant!.id;

      if (!documento_identidad) {
        return res.status(400).json({ success: false, error: 'Document ID is required' });
      }

      const result = await clientsService.findClientForReview(tenantId, documento_identidad);

      res.json(result);

    } catch (error: any) {
      console.error('Error finding client for review:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }
};
