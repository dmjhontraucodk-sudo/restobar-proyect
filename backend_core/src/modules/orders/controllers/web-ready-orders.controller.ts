import { Response } from 'express';
import { z } from 'zod';
import { webpedidos_estado as WebPedidoEstadoPrisma } from '@prisma/client'; 
import { webReadyOrdersService } from '../services/web-ready-orders.service';
import { AuthRequest } from '@shared/middleware/auth.middleware';
import { RequestWithTenant } from '@shared/middleware/tenant.middleware';

type OrderRequest = AuthRequest & RequestWithTenant;

const updateStatusSchema = z.object({
    nuevo_estado: z.nativeEnum(WebPedidoEstadoPrisma),
    razon_cancelacion: z.string().optional(),
});

export const webReadyOrdersController = {
    
    async getReadyOrders(req: OrderRequest, res: Response) : Promise<any> {
        try {
            const tenantId = req.user?.tenant_id;
            
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso no autorizado' });
            }

            const orders = await webReadyOrdersService.getReadyOrders(tenantId);

            res.json({
                success: true,
                orders,
                count: orders.length
            });
        } catch (error: any) {
            console.error('Error en getReadyOrders:', error);
            res.status(500).json({ 
                success: false,
                error: error.message || 'Error interno del servidor al obtener pedidos web listos' 
            });
        }
    },
    
    async updateStatus(req: OrderRequest, res: Response) : Promise<any> {
        try {
            const tenantId = req.user?.tenant_id;
            const orderId = parseInt(req.params.id);
            
            if (!tenantId || isNaN(orderId)) {
                return res.status(400).json({ error: 'Datos de pedido o sesión inválidos.' });
            }

            const validation = updateStatusSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({ 
                    error: 'Datos de estado inválidos.', 
                    details: validation.error.issues 
                });
            }

            const nuevoEstado = validation.data.nuevo_estado as 'Entregado' | 'Cancelado' | 'EnCamino';

            const updatedOrder = await webReadyOrdersService.updateReadyOrderStatus(
                tenantId, 
                orderId, 
                nuevoEstado
            );

            res.json({
                success: true,
                message: `Estado del pedido actualizado a ${nuevoEstado}`,
                order: updatedOrder
            });
        } catch (error: any) {
            console.error('Error en updateReadyOrderStatus:', error);
            res.status(400).json({ 
                success: false,
                error: error.message || 'Error al actualizar el estado del pedido.' 
            });
        }
    },
};
