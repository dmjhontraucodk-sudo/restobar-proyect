"use strict";
// src/controller/app/tenant-config.controller.ts - CORREGIDO
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantConfigController = void 0;
const tenant_config_service_1 = require("../../services/tenant-config.service");
// ========== CONTROLLER ==========
exports.tenantConfigController = {
    /**
     * GET /api/dashboard/config
     * 🆕 Obtener configuración completa del tenant
     */
    async getConfig(req, res) {
        try {
            const tenantId = req.user.tenant_id; // ⭐ CORREGIDO: tenantId → tenant_id
            const config = await tenant_config_service_1.tenantConfigService.getConfig(tenantId);
            return res.json({
                success: true,
                config
            });
        }
        catch (error) {
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
    async updateConfig(req, res) {
        try {
            const tenantId = req.user.tenant_id; // ⭐ CORREGIDO
            const data = req.body;
            // Validar datos antes de actualizar
            const validation = tenant_config_service_1.tenantConfigService.validateConfig(data);
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos de configuración inválidos',
                    errors: validation.errors
                });
            }
            const updatedConfig = await tenant_config_service_1.tenantConfigService.updateConfig(tenantId, data);
            return res.json({
                success: true,
                message: 'Configuración actualizada exitosamente',
                config: updatedConfig
            });
        }
        catch (error) {
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
    async updateSection(req, res) {
        try {
            const tenantId = req.user.tenant_id; // ⭐ CORREGIDO
            const section = req.params.section;
            const data = req.body;
            // Validar datos antes de actualizar
            const validation = tenant_config_service_1.tenantConfigService.validateConfig(data);
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos de configuración inválidos',
                    errors: validation.errors
                });
            }
            const updatedConfig = await tenant_config_service_1.tenantConfigService.updateSection(tenantId, section, data);
            return res.json({
                success: true,
                message: `Sección '${section}' actualizada exitosamente`,
                config: updatedConfig
            });
        }
        catch (error) {
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
    async resetConfig(req, res) {
        try {
            const tenantId = req.user.tenant_id; // ⭐ CORREGIDO
            const defaultConfig = await tenant_config_service_1.tenantConfigService.resetToDefaults(tenantId);
            return res.json({
                success: true,
                message: 'Configuración restablecida a valores por defecto',
                config: defaultConfig
            });
        }
        catch (error) {
            console.error('❌ Error al resetear configuración:', error);
            return res.status(500).json({
                success: false,
                error: 'Error al restablecer la configuración',
                details: error.message
            });
        }
    }
};
