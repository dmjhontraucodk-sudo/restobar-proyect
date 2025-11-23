// backend_core/src/controller/app/cierre-pos.controller.ts (CORREGIDO FINAL)

import { Request, Response } from 'express';
import { z } from 'zod';
import { ordenes_estado, pagos_metodo_pago } from '@prisma/client';
import { cierrePosService } from '../../services/cierre-pos.service';

// --- Interfaz de Autenticación ---
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

// Esquema Zod para validar la data de cierre
const closeOrderPosSchema = z.object({
    // La validación Zod acepta todos los strings del enum, por eso necesitamos el refine.
    estado: z.nativeEnum(ordenes_estado), 
    monto_pago: z.number().min(0, "El monto pagado debe ser válido."),
    metodo_pago: z.string(), 
    descuento_monto: z.number().min(0).default(0).optional(), 
    cliente_nombre: z.string().optional(),
    cliente_telefono: z.string().optional(),
}).refine(data => {
    // Forzar que el estado sea Pagada o Cerrada (evita que pase 'Abierta' o 'Cancelada')
    return data.estado === ordenes_estado.Pagada || data.estado === ordenes_estado.Cerrada;
}, {
    message: "El estado final debe ser Pagada o Cerrada.",
    path: ["estado"],
});

// Función de mapeo para métodos de pago que vienen del Front-end con 'QR'
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
    async closeOrder(req: AuthRequest, res: Response) {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = req.user?.id;
            const ordenId = parseInt(req.params.id);

            if (!tenantId || !empleadoId || isNaN(ordenId)) {
                return res.status(400).json({ error: 'Datos de orden o sesión inválidos.' });
            }

            const validation = closeOrderPosSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({ 
                    error: 'Datos de cierre inválidos.', 
                    details: validation.error.issues 
                });
            }
            
            const data = validation.data;

            const metodoPagoDB = mapMetodoPago(data.metodo_pago);
            
            // ✅ CORRECCIÓN TS2345: Usamos una aserción de tipo para garantizar que el Service solo reciba los tipos que espera.
            // Le decimos a TypeScript que confiamos en que el paso de `refine` anterior hizo su trabajo.
            const cierreData = {
                estado: data.estado as 'Pagada' | 'Cerrada', 
                monto_pago: data.monto_pago,
                metodo_pago: metodoPagoDB,
                descuento_monto: data.descuento_monto,
                cliente_nombre: data.cliente_nombre,
                cliente_telefono: data.cliente_telefono,
            };
            
            // Llamamos al servicio dedicado
            const ordenCerrada = await cierrePosService.closeOrder(
                tenantId,
                empleadoId,
                ordenId,
                cierreData
            );

            return res.status(200).json({
                success: true,
                message: 'Cuenta cerrada y mesa liberada.',
                orden: ordenCerrada
            });

        } catch (error: any) {
            console.error('Error en cierrePosController.closeOrder:', error);
            return res.status(400).json({ error: error.message || 'Error al procesar el cierre de cuenta.' });
        }
    }
};