"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantConfigController = void 0;
const tenant_config_service_1 = require("../services/tenant-config.service");
exports.tenantConfigController = {
    async getConfig(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso no autorizado' });
            const config = await tenant_config_service_1.tenantConfigService.getConfig(tenantId);
            res.json({ success: true, config });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
    async updateConfig(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso no autorizado' });
            const validation = tenant_config_service_1.tenantConfigService.validateConfig(req.body);
            if (!validation.valid)
                return res.status(400).json({ success: false, errors: validation.errors });
            const config = await tenant_config_service_1.tenantConfigService.updateConfig(tenantId, req.body);
            res.json({ success: true, message: 'Configuración actualizada', config });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
    async updateSection(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const section = req.params.section;
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso no autorizado' });
            const validation = tenant_config_service_1.tenantConfigService.validateConfig(req.body);
            if (!validation.valid)
                return res.status(400).json({ success: false, errors: validation.errors });
            const config = await tenant_config_service_1.tenantConfigService.updateSection(tenantId, section, req.body);
            res.json({ success: true, message: `Sección '${section}' actualizada`, config });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
    async resetConfig(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId)
                return res.status(403).json({ error: 'Acceso no autorizado' });
            const config = await tenant_config_service_1.tenantConfigService.resetToDefaults(tenantId);
            res.json({ success: true, message: 'Configuración restablecida', config });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};
