// backend_core/src/controller/app/cocina.controller.ts - ✅ CORREGIDO

import { Request, Response } from 'express';
import { z } from 'zod';
import { webpedidos_estado } from '@prisma/client';
import { pedidosWebFlowService } from '../../services/pedidos-web-flow.service';

// --- Interfaz de Autenticación (Dashboard) ---
interface AuthRequest extends Request {
  user?: {
    id: number;
    tenant_id: number;
    rol_id: number;
  };
  tenant?: {
    id: number;
  };
}

// Esquema Zod para actualizar el estado
const updateEstadoSchema = z.object({
  estado: z.nativeEnum(webpedidos_estado),
});


export const cocinaController = {
    /**
    * GET /api/dashboard/cocina/pedidos - Obtiene los pedidos para la interfaz de Cocina.
    */
    async getPedidosCocina(req: AuthRequest, res: Response) {
        try {
            const tenantId = req.user?.tenant_id;
            
            // ✅ Validación de seguridad
            if (!tenantId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }

            const pedidos = await pedidosWebFlowService.obtenerPedidosParaCocina(tenantId);
            
            return res.status(200).json(pedidos);

        } catch (error: any) {
            console.error('Error en getPedidosCocina:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    /**
    * PATCH /api/dashboard/cocina/pedidos/:id/estado - Actualiza el estado de un pedido (acción del cocinero).
    */
    async updateEstadoPedido(req: AuthRequest, res: Response) {
        try {
            const tenantId = req.user?.tenant_id;
            const pedidoId = parseInt(req.params.id);

            // ✅ Validación de seguridad
            if (!tenantId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }
            
            if (isNaN(pedidoId)) {
                return res.status(400).json({ error: 'ID de pedido inválido.' });
            }

            // ✅ Validación del body con Zod
            const validation = updateEstadoSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({ 
                    error: 'Datos inválidos', 
                    details: validation.error.issues 
                });
            }

            const { estado } = validation.data;

            // ✅ IMPORTANTE: El servicio debe validar que el pedido pertenece al tenant
            const updatedPedido = await pedidosWebFlowService.actualizarEstadoPedido(
                tenantId, 
                pedidoId, 
                estado
            );

            return res.status(200).json(updatedPedido);

        } catch (error: any) {
            console.error('Error en updateEstadoPedido:', error);
            
            // Manejo de errores específicos
            if (error.message.includes('no encontrado') || error.message.includes('not found')) {
                return res.status(404).json({ error: error.message });
            }
            
            if (error.message.includes('no pertenece') || error.message.includes('Acceso no autorizado')) {
                return res.status(403).json({ error: error.message });
            }
            
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
    },
};