import { prisma } from '@shared/database/prisma.service';
import { ordenes as OrdenPrisma, mesas as MesaPrisma, empleados as EmpleadoPrisma, ordendetalles as DetallePrisma } from '@prisma/client';

export interface ApiOrdenResponse extends OrdenPrisma {
    mesas: Pick<MesaPrisma, 'nombre_o_numero'>;
    empleados: Pick<EmpleadoPrisma, 'nombre' | 'email'>;
    ordendetalles: Array<DetallePrisma & {
        productos: {
            nombre: string;
        };
    }>;
}

interface AddItemsData {
    items: Array<{
        producto_id: number;
        cantidad: number;
        precio_unitario: number;
        notas?: string | null;
    }>;
}

export const ordenesService = {
    
    /**
     * Añade nuevos ítems a una orden abierta existente y recalcula los totales.
     */
    async addItemsToOrder(tenantId: number, _empleadoId: number, ordenId: number, data: AddItemsData): Promise<ApiOrdenResponse> {
        
        return await prisma.$transaction(async (tx) => {
            
            const ordenExistente = await tx.ordenes.findUnique({
                where: { id: ordenId, tenant_id: tenantId },
                select: { id: true, estado: true, subtotal: true, total: true, descuento: true }
            });

            if (!ordenExistente || ordenExistente.estado !== 'Abierta') {
                throw new Error('La orden no existe o no está en estado Abierta.');
            }

            const detallesData = data.items.map(item => ({
                tenant_id: tenantId,
                orden_id: ordenId,
                producto_id: item.producto_id,
                cantidad: item.cantidad,
                precio_unitario: item.precio_unitario, 
                notas: item.notas || null,
            }));

            await tx.ordendetalles.createMany({
                data: detallesData,
            });

            const nuevoSubtotalItems = data.items.reduce(
                (acc, item) => acc + (item.precio_unitario * item.cantidad), 
                0
            );
            
            const subtotalAnterior = Number(ordenExistente.subtotal || 0);
            const descuentoActual = Number(ordenExistente.descuento || 0);
            
            const nuevoSubtotal = subtotalAnterior + nuevoSubtotalItems;
            const nuevoTotal = nuevoSubtotal - descuentoActual;

            const ordenActualizada = await tx.ordenes.update({
                where: { id: ordenId },
                data: {
                    subtotal: nuevoSubtotal,
                    total: nuevoTotal,
                },
                include: { 
                    mesas: { select: { nombre_o_numero: true } },
                    empleados: { select: { nombre: true, email: true } },
                    ordendetalles: {
                        include: { productos: { select: { nombre: true } } }
                    }
                }
            });

            return ordenActualizada as ApiOrdenResponse;
        });
    },
};