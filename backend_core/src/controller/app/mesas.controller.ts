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
    /**
     * GET /api/dashboard/mesas - Obtiene todas las mesas de un tenant
     * El Front-end (useOrdersApi) filtra esto a estado 'Libre'.
     */
    async getAllMesas(req: AuthRequest, res: Response) {
        try {
            const tenantId = req.user?.tenant_id;
            
            if (!tenantId || tenantId !== req.tenant?.id) {
                // Si el token no coincide con el subdominio, denegar
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }

            const mesas = await prisma.mesas.findMany({
                where: {
                    tenant_id: tenantId,
                    // Devolvemos todas las mesas para que el Front-end decida si están 'Libre'
                },
                select: {
                    id: true,
                    nombre_o_numero: true,
                    capacidad: true,
                    estado: true, // Debe devolver 'Libre', 'Ocupada', 'Reservada'
                },
                orderBy: {
                    nombre_o_numero: 'asc',
                }
            });

            // Si no hay mesas configuradas, devolver un array vacío (esto es crucial para evitar errores)
            return res.status(200).json(mesas || []);

        } catch (error: any) {
            console.error('Error en mesasController.getAllMesas:', error);
            // Si hay un error de base de datos, devolver 500
            return res.status(500).json({ 
                error: 'Error interno del servidor al cargar las mesas.', 
                details: error.message 
            });
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