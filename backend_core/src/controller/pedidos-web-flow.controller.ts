// backend_core/src/controller/pedidos-web-flow.controller.ts - ✅ CORREGIDO
import { Request, Response } from 'express';
import { z } from 'zod';
import { pedidosWebFlowService } from '../services/pedidos-web-flow.service';
import { webpedidos_tipo } from '@prisma/client';

// --- Interfaz de Autenticación (para obtener el tenant) ---
interface AuthRequest extends Request {
  tenant?: {
    id: number;
    subdominio: string;
  };
}

// Esquema Zod para validar los ítems del pedido
const pedidoItemSchema = z.object({
  id: z.number().int().positive(),
  cantidad: z.number().int().positive(),
  precio: z.number().positive(),
});

// Esquema Zod para validar la creación completa del pedido
const createWebOrderSchema = z.object({
  cliente_nombre: z.string().min(1, "El nombre es requerido."),
  cliente_email: z.string().email("Email inválido.").optional().or(z.literal('')),
  cliente_telefono: z.string().min(6, "El teléfono es requerido."),
  tipo_pedido: z.nativeEnum(webpedidos_tipo),
  direccion_entrega: z.string().optional().nullable(),
  instrucciones_entrega: z.string().optional().nullable(),
  notas_especiales: z.string().optional().nullable(),
  subtotal: z.number().min(0),
  total: z.number().min(0),
  costo_envio: z.number().min(0).default(0),
  items: z.array(pedidoItemSchema).min(1, "El pedido debe tener al menos un producto."),
}).refine(data => {
  // Regla de validación: si es EntregaDomicilio, la dirección es requerida.
  return data.tipo_pedido === webpedidos_tipo.EntregaDomicilio 
    ? !!data.direccion_entrega 
    : true;
}, {
  message: "La dirección de entrega es requerida para pedidos a domicilio.",
  path: ["direccion_entrega"],
});


export const pedidosWebFlowController = {
    /**
    * POST /api/web/orders - Crea un nuevo pedido web.
    */
    async createWebOrder(req: AuthRequest, res: Response) {
        try {
            const tenantId = req.tenant?.id;
            
            if (!tenantId) {
                return res.status(404).json({ error: 'Tenant no encontrado.' });
            }

            const validation = createWebOrderSchema.safeParse(req.body);
            
            if (!validation.success) {
                return res.status(400).json({ 
                    error: 'Datos de pedido inválidos.', 
                    details: validation.error.issues 
                });
            }

            const nuevoPedido = await pedidosWebFlowService.crearWebPedido(
                tenantId, 
                validation.data
            );

            // ✅ CORRECCIÓN: Mejor manejo de Decimal types
            return res.status(201).json({
                order: {
                  id: nuevoPedido.id,
                  numero_pedido: nuevoPedido.numero_pedido,
                  total: Number(nuevoPedido.total), // ✅ Conversión más segura
                  estado: nuevoPedido.estado,
                }
            });

        } catch (error: any) {
            console.error('Error en createWebOrder:', error);
            return res.status(500).json({ 
                error: error.message || 'Error interno del servidor al crear el pedido.' 
            });
        }
    }
};