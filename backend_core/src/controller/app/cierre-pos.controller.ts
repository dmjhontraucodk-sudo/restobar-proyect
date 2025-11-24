// backend_core/src/controller/app/cierre-pos.controller.ts (CORREGIDO FINAL)

import { Request, Response } from 'express';
import { z } from 'zod';
import { ordenes_estado, pagos_metodo_pago } from '@prisma/client';
import { cierrePosService } from '../../services/cierre-pos.service';
import { prisma } from '../../lib/prisma'; // ✅ IMPORTANTE: Necesitamos prisma para el inventario

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
    estado: z.nativeEnum(ordenes_estado), 
    monto_pago: z.number().min(0, "El monto pagado debe ser válido."),
    metodo_pago: z.string(), 
    descuento_monto: z.number().min(0).default(0).optional(), 
    cliente_nombre: z.string().optional(),
    cliente_telefono: z.string().optional(),
}).refine(data => {
    return data.estado === ordenes_estado.Pagada || data.estado === ordenes_estado.Cerrada;
}, {
    message: "El estado final debe ser Pagada o Cerrada.",
    path: ["estado"],
});

// Función de mapeo para métodos de pago
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

            console.log(`🔥 [POS] Intentando cerrar orden #${ordenId}`);

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
            
            const cierreData = {
                estado: data.estado as 'Pagada' | 'Cerrada', 
                monto_pago: data.monto_pago,
                metodo_pago: metodoPagoDB,
                descuento_monto: data.descuento_monto,
                cliente_nombre: data.cliente_nombre,
                cliente_telefono: data.cliente_telefono,
            };
            
            // 1. Llamamos al servicio para cerrar la orden (Cobro, Caja, Pagos)
            const ordenCerrada = await cierrePosService.closeOrder(
                tenantId,
                empleadoId,
                ordenId,
                cierreData
            );

            // ===========================================================================
            // 🌊 2. GESTIÓN DE INVENTARIO (Lógica agregada en el Controlador)
            // ===========================================================================
            // Ejecutamos esto DESPUÉS de que el cobro fue exitoso.
            // Usamos un bloque try/catch independiente para no fallar la respuesta si el inventario falla.
            try {
                console.log(`📉 [POS] Procesando inventario para Orden #${ordenId}...`);
                
                // A. Buscar los detalles de la orden recién cerrada para saber qué productos tenía
                const ordenDetalles = await prisma.ordenes.findUnique({
                    where: { id: ordenId },
                    include: {
                        ordendetalles: {
                            include: {
                                productos: true // Necesitamos el producto para ver el 'producto_inventario_id'
                            }
                        }
                    }
                });

                if (ordenDetalles) {
                    await prisma.$transaction(async (tx) => {
                        let itemsDescontados = 0;

                        for (const detalle of ordenDetalles.ordendetalles) {
                            const productoMenu = detalle.productos;

                            // Verificamos si tiene vínculo con inventario
                            if (productoMenu && productoMenu.producto_inventario_id) {
                                const inventarioId = productoMenu.producto_inventario_id;
                                const cantidadVendida = Number(detalle.cantidad);

                                // B. Obtener item del inventario
                                const itemInv = await tx.productos_inventario.findUnique({
                                    where: { id: inventarioId }
                                });

                                if (itemInv) {
                                    const stockActual = Number(itemInv.stock_actual);
                                    const nuevoStock = stockActual - cantidadVendida;
                                    const costoUnitario = Number(itemInv.costo_unitario || 0);

                                    // C. Actualizar Stock
                                    await tx.productos_inventario.update({
                                        where: { id: inventarioId },
                                        data: { stock_actual: nuevoStock }
                                    });

                                    // D. Registrar en Kardex
                                    await tx.kardex.create({
                                        data: {
                                            tenant_id: tenantId,
                                            fecha: new Date(),
                                            tipo_movimiento: 'SALIDA',
                                            motivo: `Venta POS Orden #${ordenId}`,
                                            producto_inventario_id: inventarioId,
                                            cantidad: cantidadVendida,
                                            costo_unitario: costoUnitario,
                                            valor_total: cantidadVendida * costoUnitario,
                                            saldo_cantidad: nuevoStock,
                                            saldo_valor: nuevoStock * costoUnitario,
                                            documento_tipo: 'OrdenPOS',
                                            documento_id: ordenId,
                                            usuario_id: empleadoId,
                                            observaciones: `Venta de ${productoMenu.nombre}`
                                        }
                                    });
                                    
                                    console.log(`✅ [POS] Stock descontado: ${itemInv.nombre} (-${cantidadVendida})`);
                                    itemsDescontados++;
                                }
                            }
                        }
                        if (itemsDescontados === 0) console.log("ℹ️ [POS] No hubo items vinculados a inventario en esta orden.");
                    });
                }
            } catch (invError) {
                // Solo logueamos el error, no detenemos la respuesta al cliente porque ya pagó.
                console.error('❌ [POS] Error actualizando inventario:', invError);
            }
            // ===========================================================================

            return res.status(200).json({
                success: true,
                message: 'Cuenta cerrada, mesa liberada e inventario actualizado.',
                orden: ordenCerrada
            });

        } catch (error: any) {
            console.error('Error en cierrePosController.closeOrder:', error);
            return res.status(400).json({ error: error.message || 'Error al procesar el cierre de cuenta.' });
        }
    }
};