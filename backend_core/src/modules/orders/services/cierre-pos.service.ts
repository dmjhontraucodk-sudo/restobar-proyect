import { prisma } from '@shared/database/prisma.service';
import { pagos_metodo_pago } from '@prisma/client';

interface CierreOrdenData {
    estado: 'Pagada' | 'Cerrada';
    monto_pago: number;
    metodo_pago: pagos_metodo_pago;
    descuento_monto?: number;
    cliente_nombre?: string;
    cliente_telefono?: string;
    tipo_documento?: string;
    documento_identidad?: string;
    puntos_canjeados?: number; // ✅ NUEVO: Puntos a restar
}

interface RegistrarVentaEnCajaParams {
    tenantId: number;
    empleadoId: number;
    ordenId: number;
    monto: number;
    metodoPago: pagos_metodo_pago;
    tipoDocumento: 'Orden' | 'WebPedido';
    puntosCanjeados?: number; // ✅ NUEVO: Puntos a restar
}

export const cierrePosService = {

    async closeOrder(
        tenantId: number,
        empleadoId: number,
        ordenId: number,
        data: CierreOrdenData
    ) {
        const orden = await prisma.ordenes.findFirst({
            where: { id: ordenId, tenant_id: tenantId },
            include: { 
                ordendetalles: { include: { productos: true } },
                mesas: true 
            }
        });

        if (!orden) throw new Error('Orden no encontrada o no pertenece a tu restaurante.');
        if (orden.estado === 'Pagada' || orden.estado === 'Cerrada') throw new Error('Esta orden ya fue cerrada anteriormente.');

        const cajaAbierta = await this.verificarCajaAbierta(tenantId, empleadoId);
        if (!cajaAbierta) throw new Error('No tienes una caja abierta. Debes abrir caja antes de cobrar.');

        const subtotal = Number(orden.subtotal);
        const descuento = data.descuento_monto || 0;
        const totalFinal = subtotal - descuento;

        return await prisma.$transaction(async (tx) => {

            // Lógica para buscar o crear cliente y sumar/restar puntos
            if (data.documento_identidad && data.tipo_documento && data.cliente_nombre) {
                let cliente = await tx.clientes.findFirst({
                    where: {
                        tenant_id: tenantId,
                        tipo_documento: data.tipo_documento,
                        documento_identidad: data.documento_identidad,
                    },
                });

                // Calcular puntos ganados (si aplica)
                // Por defecto 1 punto por compra si no hay configuración (mantener lógica anterior o mejorar)
                // MEJORA: Consultar configuración
                const lealtadConfig = await tx.programa_lealtad.findUnique({ where: { tenant_id: tenantId } });
                let puntosGanados = 0;
                if (lealtadConfig && lealtadConfig.activo) {
                    puntosGanados = Math.floor(data.monto_pago * Number(lealtadConfig.puntos_por_sol));
                } else if (!lealtadConfig) {
                     puntosGanados = 1; // Default antiguo
                }

                const puntosRestar = data.puntos_canjeados || 0;
                const cambioNetoPuntos = puntosGanados - puntosRestar;

                if (cliente) {
                    // Cliente existe, actualizar puntos y fecha de último pedido
                    cliente = await tx.clientes.update({
                        where: { id: cliente.id },
                        data: {
                            puntos_lealtad: {
                                increment: cambioNetoPuntos,
                            },
                            ultimo_pedido_at: new Date(),
                            nombre: data.cliente_nombre, 
                            telefono: data.cliente_telefono, 
                        },
                    });
                } else {
                    // Cliente no existe, crear uno nuevo
                    cliente = await tx.clientes.create({
                        data: {
                            tenant_id: tenantId,
                            nombre: data.cliente_nombre,
                            tipo_documento: data.tipo_documento,
                            documento_identidad: data.documento_identidad,
                            telefono: data.cliente_telefono,
                            puntos_lealtad: Math.max(0, puntosGanados), // No puede empezar con negativo
                            ultimo_pedido_at: new Date(),
                        },
                    });
                }
            }

            const ordenActualizada = await tx.ordenes.update({
                where: { id: ordenId },
                data: {
                    estado: data.estado,
                    descuento: descuento,
                    total: totalFinal,
                    closed_at: new Date(),
                    cliente_documento: data.documento_identidad,
                    cliente_razon_social: data.cliente_nombre,
                }
            });

            await tx.pagos.create({
                data: {
                    tenant_id: tenantId,
                    orden_id: ordenId,
                    empleado_id: empleadoId,
                    metodo_pago: data.metodo_pago,
                    monto: data.monto_pago,
                }
            });

            await tx.cajas_movimientos.create({
                data: {
                    tenant_id: tenantId,
                    caja_id: cajaAbierta.id,
                    usuario_id: empleadoId,
                    tipo: 'INGRESO',
                    concepto: `Venta Orden POS #${ordenId}`,
                    monto: data.monto_pago,
                    metodo_pago: data.metodo_pago,
                    documento_tipo: 'Orden',
                    documento_id: ordenId,
                }
            });

            await tx.cajas.update({
                where: { id: cajaAbierta.id },
                data: { monto_esperado: { increment: data.monto_pago } }
            });

            await tx.mesas.update({
                where: { id: orden.mesa_id },
                data: { estado: 'Libre' }
            });

            await this.descontarInventario(tx, tenantId, empleadoId, ordenId, orden.ordendetalles);

            return ordenActualizada;
        });
    },

    async registrarVentaEnCaja(params: RegistrarVentaEnCajaParams) {
        const { tenantId, empleadoId, ordenId, monto, metodoPago, tipoDocumento } = params;

        const cajaAbierta = await this.verificarCajaAbierta(tenantId, empleadoId);
        if (!cajaAbierta) throw new Error('No hay una caja abierta para registrar esta venta.');

        await prisma.$transaction(async (tx) => {
            await tx.cajas_movimientos.create({
                data: {
                    tenant_id: tenantId,
                    caja_id: cajaAbierta.id,
                    usuario_id: empleadoId,
                    tipo: 'INGRESO',
                    concepto: `Venta ${tipoDocumento} #${ordenId}`,
                    monto: monto,
                    metodo_pago: metodoPago,
                    documento_tipo: tipoDocumento,
                    documento_id: ordenId,
                }
            });

            await tx.cajas.update({
                where: { id: cajaAbierta.id },
                data: { monto_esperado: { increment: monto } }
            });
        });
    },

    async verificarCajaAbierta(tenantId: number, empleadoId: number) {
        return await prisma.cajas.findFirst({
            where: {
                tenant_id: tenantId,
                usuario_responsable_id: empleadoId,
                estado: 'Abierta'
            }
        });
    },

    async descontarInventario(
        tx: any,
        tenantId: number,
        empleadoId: number,
        ordenId: number,
        detalles: any[]
    ) {
        for (const detalle of detalles) {
            const productoMenu = detalle.productos;

            if (productoMenu && productoMenu.producto_inventario_id) {
                const inventarioId = productoMenu.producto_inventario_id;
                const cantidadVendida = Number(detalle.cantidad);

                const itemInv = await tx.productos_inventario.findUnique({
                    where: { id: inventarioId }
                });

                if (itemInv) {
                    const stockActual = Number(itemInv.stock_actual);
                    const nuevoStock = stockActual - cantidadVendida;
                    const costoUnitario = Number(itemInv.costo_unitario || 0);

                    await tx.productos_inventario.update({
                        where: { id: inventarioId },
                        data: { stock_actual: nuevoStock }
                    });

                    await tx.kardex.create({
                        data: {
                            tenant_id: tenantId,
                            fecha: new Date(),
                            tipo_movimiento: 'SALIDA',
                            motivo: `Venta Orden #${ordenId}`,
                            producto_inventario_id: inventarioId,
                            cantidad: cantidadVendida,
                            costo_unitario: costoUnitario,
                            valor_total: cantidadVendida * costoUnitario,
                            saldo_cantidad: nuevoStock,
                            saldo_valor: nuevoStock * costoUnitario,
                            documento_tipo: 'Orden',
                            documento_id: ordenId,
                            usuario_id: empleadoId,
                            observaciones: `Venta de ${productoMenu.nombre}`
                        }
                    });
                }
            }
        }
    }
};
