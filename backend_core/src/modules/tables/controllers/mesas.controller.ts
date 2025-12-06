import { Response, NextFunction } from 'express';
import { prisma } from '@shared/database/prisma.service';
import { mesasService } from '../services/mesas.service';
import { z } from 'zod';
import { mesas_estado } from '@prisma/client';
import { AuthRequest } from '@shared/middleware/auth.middleware';

interface RequestWithTenant extends AuthRequest {
  tenant?: {
    id: number;
    subdominio: string;
    configuracion: any;
    nombre_empresa?: string;
  };
}

// Esquemas de validación con Zod
const createMesaSchema = z.object({
    nombre_o_numero: z.string().min(1, "El nombre o número es requerido."),
    capacidad: z.number().int().positive("La capacidad debe ser un número positivo.").nullable().optional().transform(e => e === undefined ? null : e),
}).strict();

const updateMesaSchema = z.object({
    nombre_o_numero: z.string().min(1).optional(),
    capacidad: z.number().int().positive().nullable().optional().transform(e => e === undefined ? null : e),
    estado: z.nativeEnum(mesas_estado).nullable().optional().transform(e => e === undefined ? null : e),
}).strict();


export const mesasController = {
    /**
     * GET /api/dashboard/mesas - Obtiene todas las mesas de un tenant
     */
    async getAllMesas(req: AuthRequest, res: Response) : Promise<any> {
        try {
            const tenantId = req.user?.tenant_id;
            
            if (!tenantId || tenantId !== (req as RequestWithTenant).tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }

            const mesas = await prisma.mesas.findMany({
                where: {
                    tenant_id: tenantId,
                },
                select: {
                    id: true,
                    nombre_o_numero: true,
                    capacidad: true,
                    estado: true,
                },
                orderBy: {
                    nombre_o_numero: 'asc',
                }
            });

            return res.status(200).json(mesas || []);

        } catch (error: any) {
            console.error('Error en mesasController.getAllMesas:', error);
            return res.status(500).json({ 
                error: 'Error interno del servidor al cargar las mesas.', 
                details: error.message 
            });
        }
    },

    // POST /api/dashboard/mesas
    async createMesa(req: AuthRequest, res: Response, next: NextFunction) : Promise<any> {
        try {
            const tenantId = req.user?.tenant_id;
            
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }

            const validation = createMesaSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
            }

            const mesa = await mesasService.createMesa(tenantId, validation.data);
            res.status(201).json(mesa);
        } catch (error) {
            next(error);
        }
    },

    // PATCH /api/dashboard/mesas/:id
    async updateMesa(req: AuthRequest, res: Response, next: NextFunction) : Promise<any> {
        try {
            const tenantId = req.user?.tenant_id;
            const mesaId = parseInt(req.params.id, 10);
            
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            if (isNaN(mesaId)) {
                return res.status(400).json({ error: 'ID de mesa inválido.' });
            }

            const validation = updateMesaSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
            }

            if (Object.keys(validation.data).length === 0) {
                return res.status(400).json({ error: 'No se proporcionaron datos para actualizar.' });
            }

            const updatedMesa = await mesasService.updateMesa(tenantId, mesaId, validation.data);
            res.json(updatedMesa);
        } catch (error) {
            next(error);
        }
    },

    // DELETE /api/dashboard/mesas/:id
    async deleteMesa(req: AuthRequest, res: Response, next: NextFunction) : Promise<any> {
        try {
            const tenantId = req.user?.tenant_id;
            const mesaId = parseInt(req.params.id, 10);
            
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            if (isNaN(mesaId)) {
                return res.status(400).json({ error: 'ID de mesa inválido.' });
            }
        
            const deletedMesa = await mesasService.deleteMesa(tenantId, mesaId);
            res.json({ message: 'Mesa eliminada correctamente', mesa: deletedMesa });
        } catch (error) {
            next(error);
        }
    }
};
