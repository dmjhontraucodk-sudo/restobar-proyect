// backend_core/src/services/cierre-pos.service.ts (VERSIÓN FINAL INTEGRADA)

import { prisma } from '../lib/prisma';
import { ordenes_estado, pagos_metodo_pago } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Tipo de datos que el Controller enviará
interface CierreData {
    estado: 'Pagada' | 'Cerrada';
    monto_pago: number;
    metodo_pago: pagos_metodo_pago;
    descuento_monto?: number;
    cliente_nombre?: string;
    cliente_telefono?: string;
}

export const cierrePosService = {

    /**
     * Procesa el pago, aplica el descuento, cierra la orden, libera la mesa y gestiona el cliente.
     */
    async closeOrder(tenantId: number, empleadoId: number, ordenId: number, data: CierreData) {
        
        const resultadoCierre = await prisma.$transaction(async (tx) => {
            // 1. Verificar la orden
            const orden = await tx.ordenes.findUnique({
                where: { id: ordenId, tenant_id: tenantId },
                include: { mesas: true }
            });

            if (!orden || orden.estado !== ordenes_estado.Abierta) {
                throw new Error('La orden no existe o ya está cerrada/pagada.');
            }

            // 2. Calcular el total final después del descuento
            const totalOrden = Number(orden.total || 0);
            const descuento = Number(data.descuento_monto ?? 0);
            const totalNeto = totalOrden - descuento;

            if (totalNeto < 0) {
                 throw new Error('Descuento inválido. El total neto no puede ser negativo.');
            }
            if (data.monto_pago < totalNeto) {
                 throw new Error('Monto de pago insuficiente para cubrir el total neto.');
            }

            // 3. REGISTRO / ACTUALIZACIÓN DEL CLIENTE
            let clienteId: number | undefined = undefined;

            if (data.cliente_nombre && data.cliente_telefono) {
                const nombreCliente = data.cliente_nombre.trim();
                const telefonoCliente = data.cliente_telefono.trim();

                let cliente = await tx.clientes.findFirst({
                    where: {
                        tenant_id: tenantId,
                        telefono: telefonoCliente,
                    },
                });

                if (cliente) {
                    // Actualizar cliente existente
                    cliente = await tx.clientes.update({
                        where: { id: cliente.id },
                        data: {
                            nombre: nombreCliente,
                            // Si tuvieras email/dni/ruc del front-end, también se actualizarían aquí
                        },
                    });
                } else {
                    // Crear nuevo cliente
                    cliente = await tx.clientes.create({
                        data: {
                            tenant_id: tenantId,
                            nombre: nombreCliente,
                            telefono: telefonoCliente,
                        },
                    });
                }
                clienteId = cliente.id;
            }
            
            // 4. Registrar el Pago (tabla 'pagos')
            await tx.pagos.create({
                data: {
                    tenant_id: tenantId,
                    orden_id: ordenId,
                    empleado_id: empleadoId,
                    metodo_pago: data.metodo_pago,
                    monto: new Decimal(data.monto_pago),
                }
            });
            
            // 5. Actualizar la Orden (estado, descuento, total y closed_at)
            const ordenActualizada = await tx.ordenes.update({
                where: { id: ordenId },
                data: {
                    estado: ordenes_estado.Pagada,
                    descuento: new Decimal(descuento),
                    total: new Decimal(totalNeto),
                    closed_at: new Date(),
                    // NOTA: Si quieres enlazar el cliente a la orden, necesitarías agregar
                    // cliente_id: clienteId, 
                    // al modelo de Prisma de ordenes
                },
                
            });

            // 6. Liberar la Mesa (tabla 'mesas')
            const mesaLiberada = await tx.mesas.update({
                where: { id: orden.mesa_id },
                data: { estado: 'Libre' }
            });

            return { 
                ...ordenActualizada, 
                estado: ordenes_estado.Pagada, 
                total: new Decimal(totalNeto), 
                descuento: new Decimal(descuento), 
                mesas: mesaLiberada,
                cliente_id: clienteId // Incluimos el ID del cliente si se registró/actualizó
            };
        });

        return resultadoCierre;
    }
};