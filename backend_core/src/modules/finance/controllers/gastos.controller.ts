import { Response } from 'express';
import { gastosService } from '../services/gastos.service';
import { AuthRequest } from '@shared/middleware/auth.middleware';
import { RequestWithTenant } from '@shared/middleware/tenant.middleware';

type FinanceRequest = AuthRequest & RequestWithTenant;

export const gastosController = {
    async getAll(req: FinanceRequest, res: Response): Promise<any> {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId) return res.status(403).json({ error: 'Acceso no autorizado' });
            const gastos = await gastosService.getAll(tenantId);
            return res.json(gastos);
        } catch (error: any) {
            return res.status(500).json({ error: 'Error al obtener gastos' });
        }
    },

    async getById(req: FinanceRequest, res: Response): Promise<any> {
        try {
            const tenantId = req.user?.tenant_id;
            const id = parseInt(req.params.id);
            if (!tenantId) return res.status(403).json({ error: 'Acceso no autorizado' });
            
            const gasto = await gastosService.getById(tenantId, id);
            if (!gasto) return res.status(404).json({ error: 'Gasto no encontrado' });
            return res.json(gasto);
        } catch (error: any) {
            return res.status(500).json({ error: 'Error al obtener gasto' });
        }
    },

    async create(req: FinanceRequest, res: Response): Promise<any> {
        try {
            const tenantId = req.user?.tenant_id;
            const userId = req.user?.id;
            if (!tenantId || !userId) return res.status(403).json({ error: 'Acceso no autorizado' });

            const gasto = await gastosService.create(tenantId, userId, req.body);
            return res.status(201).json(gasto);
        } catch (error: any) {
            console.error('Error al crear gasto:', error);
            return res.status(500).json({ error: 'Error al crear gasto' });
        }
    },

    async update(req: FinanceRequest, res: Response): Promise<any> {
        try {
            const tenantId = req.user?.tenant_id;
            const id = parseInt(req.params.id);
            if (!tenantId) return res.status(403).json({ error: 'Acceso no autorizado' });

            const gasto = await gastosService.update(tenantId, id, req.body);
            return res.json(gasto);
        } catch (error: any) {
            return res.status(500).json({ error: 'Error al actualizar gasto' });
        }
    },

    async delete(req: FinanceRequest, res: Response): Promise<any> {
        try {
            const tenantId = req.user?.tenant_id;
            const id = parseInt(req.params.id);
            if (!tenantId) return res.status(403).json({ error: 'Acceso no autorizado' });

            await gastosService.delete(tenantId, id);
            return res.json({ message: 'Gasto eliminado correctamente' });
        } catch (error: any) {
            return res.status(500).json({ error: 'Error al eliminar gasto' });
        }
    },

    async getEstadisticas(req: FinanceRequest, res: Response): Promise<any> {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId) return res.status(403).json({ error: 'Acceso no autorizado' });
            
            // Extraer parámetros del query (agregamos guion bajo para indicar que no se usan aún)
            const { fechaInicio: _fechaInicio, fechaFin: _fechaFin } = req.query as { fechaInicio?: string; fechaFin?: string };
            
            // Por ahora retornamos un placeholder o implementamos la lógica
            const estadisticas = await gastosService.getEstadisticas(tenantId, {
                fechaInicio: _fechaInicio,
                fechaFin: _fechaFin
            });
            
            return res.json(estadisticas);
        } catch (error: any) {
            return res.status(500).json({ error: 'Error al obtener estadísticas' });
        }
    }
};