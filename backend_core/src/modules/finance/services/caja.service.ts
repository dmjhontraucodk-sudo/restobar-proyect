import { prisma } from '@shared/database/prisma.service';
// Importación no usada - comenta o elimina
// import { cajas_movimientos, cajas } from '@prisma/client';

export const cajaService = {
    async getCajaAbierta(tenantId: number, userId: number): Promise<any> {
        try {
            return await prisma.cajas.findFirst({
                where: {
                    tenant_id: tenantId,
                    usuario_responsable_id: userId,
                    estado: 'Abierta'
                },
                include: {
                    movimientos: { orderBy: { fecha_hora: 'desc' } }
                }
            });
        } catch (error: any) {
            throw new Error(`Error al obtener caja abierta: ${error.message}`);
        }
    },

    async abrirCaja(tenantId: number, userId: number, montoInicial: number, observaciones?: string): Promise<any> {
        try {
            const existing = await this.getCajaAbierta(tenantId, userId);
            if (existing) throw new Error('Ya tienes una caja abierta');

            return await prisma.cajas.create({
                data: {
                    tenant_id: tenantId,
                    usuario_responsable_id: userId,
                    monto_inicial: montoInicial,
                    monto_esperado: montoInicial,
                    estado: 'Abierta',
                    observaciones
                }
            });
        } catch (error: any) {
            throw new Error(`Error al abrir caja: ${error.message}`);
        }
    },

    async registrarMovimiento(tenantId: number, userId: number, data: any): Promise<any> {
        try {
            const caja = await this.getCajaAbierta(tenantId, userId);
            if (!caja) throw new Error('No tienes caja abierta');

            return await prisma.$transaction(async (tx) => {
                await tx.cajas_movimientos.create({
                    data: {
                        tenant_id: tenantId,
                        caja_id: caja.id,
                        usuario_id: userId,
                        ...data
                    }
                });

                const incremento = data.tipo === 'INGRESO' ? data.monto : -data.monto;
                await tx.cajas.update({
                    where: { id: caja.id },
                    data: { monto_esperado: { increment: incremento } }
                });

                return { success: true, message: 'Movimiento registrado' };
            });
        } catch (error: any) {
            throw new Error(`Error al registrar movimiento: ${error.message}`);
        }
    },

    async cerrarCaja(tenantId: number, userId: number, montoReal: number, observaciones?: string): Promise<any> {
        try {
            const caja = await this.getCajaAbierta(tenantId, userId);
            if (!caja) throw new Error('No tienes caja abierta');

            const montoEsperado = Number(caja.monto_esperado);
            const diferencia = montoReal - montoEsperado;

            return await prisma.cajas.update({
                where: { id: caja.id },
                data: {
                    estado: 'Cerrada',
                    fecha_cierre: new Date(),
                    monto_real: montoReal,
                    diferencia,
                    observaciones: observaciones ? `${caja.observaciones || ''}\n--- CIERRE ---\n${observaciones}` : caja.observaciones
                }
            });
        } catch (error: any) {
            throw new Error(`Error al cerrar caja: ${error.message}`);
        }
    },

    async getHistorial(tenantId: number, filters: any): Promise<any> {
        try {
            const where: any = { tenant_id: tenantId, estado: 'Cerrada' };
            if (filters.fechaInicio) where.fecha_cierre = { gte: new Date(filters.fechaInicio) };
            if (filters.fechaFin) {
                if (!where.fecha_cierre) where.fecha_cierre = {};
                where.fecha_cierre.lte = new Date(filters.fechaFin);
            }

            return await prisma.cajas.findMany({
                where,
                include: {
                    empleados: { select: { nombre: true, email: true } },
                    _count: { select: { movimientos: true } }
                },
                orderBy: { fecha_cierre: 'desc' },
                take: 50
            });
        } catch (error: any) {
            throw new Error(`Error al obtener historial: ${error.message}`);
        }
    }
};