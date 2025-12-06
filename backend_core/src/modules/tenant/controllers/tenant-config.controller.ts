import { Response } from 'express';
import { tenantConfigService } from '../services/tenant-config.service';
import { AuthRequest } from '@shared/middleware/auth.middleware';
import { RequestWithTenant } from '@shared/middleware/tenant.middleware';

type ConfigRequest = AuthRequest & RequestWithTenant;

export const tenantConfigController = {
  
  async getConfig(req: ConfigRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      if (!tenantId) return res.status(403).json({ error: 'Acceso no autorizado' });

      const config = await tenantConfigService.getConfig(tenantId);
      res.json({ success: true, config });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async updateConfig(req: ConfigRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      if (!tenantId) return res.status(403).json({ error: 'Acceso no autorizado' });

      const validation = tenantConfigService.validateConfig(req.body);
      if (!validation.valid) return res.status(400).json({ success: false, errors: validation.errors });

      const config = await tenantConfigService.updateConfig(tenantId, req.body);
      res.json({ success: true, message: 'Configuración actualizada', config });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async updateSection(req: ConfigRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      const section = req.params.section;
      if (!tenantId) return res.status(403).json({ error: 'Acceso no autorizado' });

      const validation = tenantConfigService.validateConfig(req.body);
      if (!validation.valid) return res.status(400).json({ success: false, errors: validation.errors });

      const config = await tenantConfigService.updateSection(tenantId, section, req.body);
      res.json({ success: true, message: `Sección '${section}' actualizada`, config });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async resetConfig(req: ConfigRequest, res: Response) : Promise<any> {
    try {
      const tenantId = req.user?.tenant_id;
      if (!tenantId) return res.status(403).json({ error: 'Acceso no autorizado' });

      const config = await tenantConfigService.resetToDefaults(tenantId);
      res.json({ success: true, message: 'Configuración restablecida', config });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};
