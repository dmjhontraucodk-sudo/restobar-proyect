import { prisma } from '@shared/database/prisma.service';
import { webpedidos_estado, webpedidos as WebPedidoPrisma } from '@prisma/client'; // Eliminadas importaciones no usadas

interface WebPedidoDetalleOutput {
    id: number;
    cantidad: number;
    precio_unitario: string; 
    subtotal: string;       
    productos: {
        id: number;
        nombre: string;
    };
}

export interface WebPedidoOutput extends Omit<WebPedidoPrisma, 'subtotal' | 'total' | 'costo_envio' | 'hora_programada' | 'created_at' | 'updated_at'> {
    subtotal: string;
    total: string;
    costo_envio: string;
    hora_programada: string | null;
    created_at: string;
    updated_at: string | null;
    webpedidos_detalles: WebPedidoDetalleOutput[];
}

const mapWebPedidoToOutput = (pedido: any): WebPedidoOutput => ({
    ...pedido,
    subtotal: pedido.subtotal.toFixed(2), 
    total: pedido.total.toFixed(2),
    costo_envio: pedido.costo_envio.toFixed(2),
    created_at: pedido.created_at.toISOString(),
    updated_at: pedido.updated_at?.toISOString() || null,
    hora_programada: pedido.hora_programada?.toISOString() || null,
    
    webpedidos_detalles: pedido.webpedidos_detalles.map((detalle: any) => ({
        ...detalle,
        precio_unitario: detalle.precio_unitario.toFixed(2),
        subtotal: detalle.subtotal.toFixed(2),
        productos: {
            id: detalle.productos.id,
            nombre: detalle.productos.nombre,
        }
    }))
});

export const webReadyOrdersService = {
    
    async getReadyOrders(tenantId: number): Promise<WebPedidoOutput[]> {
        const estadosListos: webpedidos_estado[] = [
            webpedidos_estado.Pendiente,
            webpedidos_estado.Confirmado,
            webpedidos_estado.EnPreparacion,
            webpedidos_estado.ListoParaRecoger,
            webpedidos_estado.EnCamino,
        ];

        const webPedidos = await prisma.webpedidos.findMany({
            where: {
                tenant_id: tenantId,
                estado: {
                    in: estadosListos,
                },
            },
            include: {
                webpedidos_detalles: {
                    include: {
                        productos: {
                            select: { id: true, nombre: true }
                        }
                    }
                }
            },
            orderBy: {
                created_at: 'asc',
            }
        });

        return webPedidos.map(mapWebPedidoToOutput);
    },
    
    async updateReadyOrderStatus(
        tenantId: number, 
        orderId: number, 
        newStatus: 'Entregado' | 'Cancelado' | 'EnCamino'
    ): Promise<WebPedidoOutput> {
        
        const updatedOrder = await prisma.webpedidos.update({
            where: { id: orderId, tenant_id: tenantId },
            data: {
                estado: newStatus,
                updated_at: new Date(),
            },
            include: { 
                webpedidos_detalles: {
                    include: {
                        productos: {
                            select: { id: true, nombre: true }
                        }
                    }
                }
            }
        });

        return mapWebPedidoToOutput(updatedOrder);
    },
};