import { Request, Response } from 'express';
import { provisioningService } from '../services/provisioning.service';

class ProvisioningController {
  async createTenant(req: Request, res: Response) {
    try {
      const { subdomain, tenantName, adminEmail, adminPassword } = req.body;
      const tenant = await provisioningService.createTenant(
        subdomain,
        tenantName,
        adminEmail,
        adminPassword
      );
      res.status(201).json(tenant);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create tenant' });
    }
  }
}

export const provisioningController = new ProvisioningController();
