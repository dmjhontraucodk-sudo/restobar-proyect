import { Response } from 'express';
import { z } from 'zod';
import { ordenes_estado, pagos_metodo_pago } from '@prisma/client';
import { cierrePosService } from '../services/cierre-pos.service';
import { AuthRequest } from '@shared/middleware/auth.middleware';
import { RequestWithTenant } from '@shared/middleware/tenant.middleware';

type FinanceRequest = AuthRequest & RequestWithTenant;

const closeOrderPosSchema = z.object({
    estado: z.nativeEnum(ordenes_estado), 
    monto_pago: z.number().min(0),
    metodo_pago: z.string(), 
    descuento_monto: z.number().min(0).default(0).optional(), 
    cliente_nombre: z.string().optional(),
    cliente_telefono: z.string().optional(),
    tipo_documento: z.string().optional(),
    documento_identidad: z.string().optional(),
    puntos_canjeados: z.number().min(0).default(0).optional(), // ✅ NUEVO: Campo para puntos
}).refine(data => {
    return data.estado === ordenes_estado.Pagada || data.estado === ordenes_estado.Cerrada;
}, {
    message: "El estado final debe ser Pagada o Cerrada.",
    path: ["estado"],
}).strict();

const mapMetodoPago = (metodo: string): pagos_metodo_pago => {
    switch(metodo.toUpperCase()) {
        case 'EFECTIVO': return pagos_metodo_pago.Efectivo;
        case 'TARJETA': return pagos_metodo_pago.Tarjeta;
        case 'TRANSFERENCIA': return pagos_metodo_pago.Transferencia;
        case 'QR':
        case 'OTRO':
        default:
            return pagos_metodo_pago.Otro; 
    }
}

export const cierrePosController = {
    async closeOrder(req: FinanceRequest, res: Response) : Promise<any> {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = req.user?.id;
            const ordenId = parseInt(req.params.id);

            if (!tenantId || !empleadoId || isNaN(ordenId)) {
                return res.status(400).json({ error: 'Datos de orden o sesión inválidos.' });
            }

            const validation = closeOrderPosSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
            }
            
            const data = validation.data;
            const metodoPagoDB = mapMetodoPago(data.metodo_pago);
            
            const ordenCerrada = await cierrePosService.closeOrder(
                tenantId,
                empleadoId,
                ordenId,
                {
                    estado: data.estado as 'Pagada' | 'Cerrada', 
                    monto_pago: data.monto_pago,
                    metodo_pago: metodoPagoDB,
                    descuento_monto: data.descuento_monto,
                    cliente_nombre: data.cliente_nombre,
                    cliente_telefono: data.cliente_telefono,
                    tipo_documento: data.tipo_documento,
                    documento_identidad: data.documento_identidad,
                    puntos_canjeados: data.puntos_canjeados, // ✅ PASAR AL SERVICIO
                }
            );

            res.json({ success: true, message: 'Orden cerrada', orden: ordenCerrada });
        } catch (error: any) {
            console.error('Error en closeOrder:', error);
            res.status(400).json({ error: error.message || 'Error al cerrar cuenta' });
        }
    }
};
