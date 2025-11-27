// src/controller/app/tenant-config.controller.ts - CORREGIDO

import { Request, Response } from 'express';
import { tenantConfigService } from '../../services/tenant-config.service';

// ========== EXTENDER TIPOS DE EXPRESS ==========
// ✅ CORREGIDO: Usar snake_case como el resto del sistema

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    tenant_id: number;      // ⭐ CAMBIADO: tenantId → tenant_id
    email: string;
    rol_id: number;         // ⭐ CAMBIADO: rolId → rol_id
    [key: string]: any;
  };
}

// ========== CONTROLLER ==========

export const tenantConfigController = {
  
  /**
   * GET /api/dashboard/config
   * 🆕 Obtener configuración completa del tenant
   */
  async getConfig(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user!.tenant_id; // ⭐ CORREGIDO: tenantId → tenant_id

      const config = await tenantConfigService.getConfig(tenantId);

      return res.json({
        success: true,
        config
      });
    } catch (error: any) {
      console.error('❌ Error al obtener configuración:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener la configuración',
        details: error.message
      });
    }
  },

  /**
   * PUT /api/dashboard/config
   * 🆕 Actualizar configuración completa
   */
  async updateConfig(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user!.tenant_id; // ⭐ CORREGIDO
      const data = req.body;

      // Validar datos antes de actualizar
      const validation = tenantConfigService.validateConfig(data);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Datos de configuración inválidos',
          errors: validation.errors
        });
      }

      const updatedConfig = await tenantConfigService.updateConfig(tenantId, data);

      return res.json({
        success: true,
        message: 'Configuración actualizada exitosamente',
        config: updatedConfig
      });
    } catch (error: any) {
      console.error('❌ Error al actualizar configuración:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al actualizar la configuración',
        details: error.message
      });
    }
  },

  /**
   * PUT /api/dashboard/config/:section
   * 🆕 Actualizar una sección específica de la configuración
   */
  async updateSection(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user!.tenant_id; // ⭐ CORREGIDO
      const section = req.params.section;
      const data = req.body;

      // Validar datos antes de actualizar
      const validation = tenantConfigService.validateConfig(data);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Datos de configuración inválidos',
          errors: validation.errors
        });
      }

      const updatedConfig = await tenantConfigService.updateSection(
        tenantId,
        section,
        data
      );

      return res.json({
        success: true,
        message: `Sección '${section}' actualizada exitosamente`,
        config: updatedConfig
      });
    } catch (error: any) {
      console.error('❌ Error al actualizar sección:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al actualizar la sección',
        details: error.message
      });
    }
  },

  /**
   * POST /api/dashboard/config/reset
   * 🆕 Resetear configuración a valores por defecto
   */
  async resetConfig(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user!.tenant_id; // ⭐ CORREGIDO

      const defaultConfig = await tenantConfigService.resetToDefaults(tenantId);

      return res.json({
        success: true,
        message: 'Configuración restablecida a valores por defecto',
        config: defaultConfig
      });
    } catch (error: any) {
      console.error('❌ Error al resetear configuración:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al restablecer la configuración',
        details: error.message
      });
    }
  }
};