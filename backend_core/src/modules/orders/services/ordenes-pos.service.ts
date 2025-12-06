import { prisma } from '@shared/database/prisma.service';
import { ordenes_estado } from '@prisma/client';
import { KitchenOrderDto } from './pedidos-web-flow.service'; 

export type OrdenesQuery = {
    id: number;
    estado: ordenes_estado | null; 
    created_at: Date;
    mesas: {
        nombre_o_numero: string;
    };
    ordendetalles: Array<{
        id: number;
        cantidad: number;
        notas: string | null;
        productos: {
            nombre: string;
        };
    }>;
};


export const ordenesPosService = {

    async getOrdenesActivasParaCocina(tenantId: number): Promise<OrdenesQuery[]> {
            
            const ordenes = await prisma.ordenes.findMany({
            where: { 
                    tenant_id: tenantId,
                    estado: { notIn: [ordenes_estado.Cerrada, ordenes_estado.Pagada, ordenes_estado.Cancelada] } 
            },
            include: {
                    mesas: { select: { nombre_o_numero: true } },
                                                            ordendetalles: {
                                                            where: {
                                                                    productos: {
                                                                        producto_inventario_id: null
                                                                    }
                                                            },
                                                            include: {
                                                                    productos: { select: { nombre: true } }
                                                            }
                                                            }            }
            });
            
            return ordenes
            .filter(o => o.ordendetalles.length > 0) as OrdenesQuery[];
    },

    mapOrdenToDto(orden: OrdenesQuery): KitchenOrderDto {
        const estadoOrden = orden.estado || ordenes_estado.Abierta; 

        let estadoCocina: string;
        switch (estadoOrden) {
            case ordenes_estado.Abierta:
                estadoCocina = 'Pendiente'; 
                break;
            default:
                estadoCocina = 'Pendiente'; 
        }

        return {
            id: `P-${orden.id}`,
            numero_orden: `M-${orden.mesas.nombre_o_numero}`, 
            origen: `MESA-${orden.mesas.nombre_o_numero}`,
            estado: estadoCocina,
            cliente_mesa_nombre: `Mesa ${orden.mesas.nombre_o_numero}`,
            items: orden.ordendetalles.map(detalle => ({
                id_detalle: detalle.id,
                producto_nombre: detalle.productos.nombre,
                cantidad: detalle.cantidad,
                notas: detalle.notas,
            })),
            created_at: orden.created_at,
            notas_especiales: null, 
        };
    },

    async actualizarEstadoOrdenPos(
        tenantId: number, 
        ordenId: number, 
        nuevoEstado: string
    ) {
        if (nuevoEstado === 'EnPreparacion') {
            const orden = await prisma.ordenes.findUnique({
                where: { id: ordenId, tenant_id: tenantId },
                include: { ordendetalles: true }
            });
            
            if (!orden) throw new Error('Orden POS no encontrada.');
            
            console.log(`⚠️ Lógica de inventario: Descontando stock para Orden POS #${ordenId}...`);
            
            const estadoDB = ordenes_estado.Abierta; 

            await prisma.ordenes.update({
                where: { id: ordenId },
                data: {
                    estado: estadoDB,
                }
            });
            return { id: ordenId, estado: estadoDB }; 
        }
        
        const orden = await prisma.ordenes.findUnique({ where: { id: ordenId } });
        if (!orden) throw new Error('Orden POS no encontrada después de actualización.');
        return { id: ordenId, estado: orden.estado };
    }
};
