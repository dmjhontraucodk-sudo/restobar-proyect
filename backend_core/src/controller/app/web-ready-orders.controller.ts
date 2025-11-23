// backend_core/src/controller/app/web-ready-orders.controller.ts

import { Request, Response } from 'express';
import { webReadyOrdersService } from '../../services/web-ready-orders.service';
import { z } from 'zod';
import { webpedidos_estado as WebPedidoEstadoPrisma } from '@prisma/client'; // Importamos el ENUM de Prisma

// --- Interfaz de Autenticación (Reutilizada de tu código) ---
interface AuthRequest extends Request {
    user?: {
        id: number;
        tenant_id: number;
        email: string;
        rol_id: number;
    };
    tenant?: {
        id: number;
        subdominio: string;
        configuracion: any;
    };
}

// Esquema Zod para validar la actualización de estado
const updateStatusSchema = z.object({
    // Usamos z.nativeEnum(PrismaEnum) para que Zod valide directamente contra el enum de Prisma
    nuevo_estado: z.nativeEnum(WebPedidoEstadoPrisma).refine(val => 
        // Solo permitimos los estados relevantes para esta gestión: Entregado, Cancelado, EnCamino
        val === WebPedidoEstadoPrisma.Entregado || 
        val === WebPedidoEstadoPrisma.Cancelado ||
        val === WebPedidoEstadoPrisma.EnCamino
    , {
        message: "Estado inválido. Solo se permite 'Entregado', 'Cancelado' o 'EnCamino'.",
    }),
    razon_cancelacion: z.string().optional(),
});


export const webReadyOrdersController = {
    
    // ... getReadyOrders se mantiene igual ...
    async getReadyOrders(req: AuthRequest, res: Response) {
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
    
    /**
     * Cambia el estado de un pedido web (Entregado, Cancelado, EnCamino).
     */
    async updateStatus(req: AuthRequest, res: Response) {
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

            // Usamos el tipo validado por Zod, que garantiza que es uno de los tres estados.
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