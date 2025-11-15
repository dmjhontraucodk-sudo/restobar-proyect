// backend_core/src/controllers/app/mesas.controller.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
// import { CustomRequest } from '../../types'; // NO USAMOS ESTA RUTA ERRÓNEA
import { mesasService } from '../../services/mesas.service';


interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    tenant_id: number;
    rol_id: number;
  };
  tenant?: {
    id: number;
    subdominio: string;
    configuracion: any;
    nombre_empresa?: string;
  };
}
// --- FIN AuthRequest ---
export const mesasController = {

    // GET /api/dashboard/mesas
    async getAllMesas(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            // Usamos req.user?.tenant_id ya que la ruta está protegida por validateToken
            const tenantId = req.user?.tenant_id;
            
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }

            const mesas = await mesasService.getAllMesas(tenantId);
            res.json(mesas);
        } catch (error) {
            next(error);
        }
    },

    // POST /api/dashboard/mesas
    async createMesa(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const tenantId = req.user?.tenant_id;
            
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            const mesa = await mesasService.createMesa(tenantId, req.body);
            res.status(201).json(mesa);
        } catch (error) {
            next(error);
        }
    },

    // PATCH /api/dashboard/mesas/:id
    async updateMesa(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const tenantId = req.user?.tenant_id;
            const mesaId = parseInt(req.params.id, 10);
            
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            if (req.body.estado) {
                const updatedMesa = await mesasService.updateMesaState(tenantId, mesaId, req.body.estado);
                return res.json(updatedMesa);
            }
            const updatedMesa = await mesasService.updateMesa(tenantId, mesaId, req.body);
            res.json(updatedMesa);
        } catch (error) {
            next(error);
        }
    },

    // DELETE /api/dashboard/mesas/:id
    async deleteMesa(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const tenantId = req.user?.tenant_id;
            const mesaId = parseInt(req.params.id, 10);
            
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
        
            const deletedMesa = await mesasService.deleteMesa(tenantId, mesaId);
            res.json({ message: 'Mesa eliminada correctamente', mesa: deletedMesa });
        } catch (error) {
            next(error);
        }
    }

};