
import { Response } from 'express';
import { RequestWithTenant } from '@shared/middleware/tenant.middleware';
import { clientsService } from '../services/clients.service';
import { prisma } from '@shared/database/prisma.service'; // ✅ IMPORTAR PRISMA

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
        // ✅ ENRIQUECER CON DATOS DE LEALTAD
        const loyaltyConfig = await prisma.programa_lealtad.findUnique({
            where: { tenant_id: tenantId }
        });

        let loyaltyData = null;

        if (loyaltyConfig && loyaltyConfig.activo) {
            const puntos = client.puntos_lealtad || 0;
            const valorPunto = Number(loyaltyConfig.equivalencia_sol_por_punto);
            const montoCanje = Number(loyaltyConfig.monto_minimo_canje);
            
            loyaltyData = {
                puntos: puntos,
                valor_en_soles: puntos * valorPunto,
                puede_canjear: puntos >= montoCanje,
                config: {
                    puntos_por_sol: Number(loyaltyConfig.puntos_por_sol),
                    equivalencia: valorPunto,
                    minimo_canje: montoCanje
                }
            };
        }

        res.json({ 
            success: true, 
            client: {
                ...client,
                loyalty: loyaltyData // ✅ Campo nuevo en la respuesta
            } 
        });
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
