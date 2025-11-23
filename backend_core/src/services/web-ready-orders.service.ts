// backend_core/src/services/web-ready-orders.service.ts (Versión CORREGIDA FINAL)

import { prisma } from '../lib/prisma';
import { 
    webpedidos_estado as WebPedidoEstadoPrisma, 
    webpedidos as WebPedidoPrisma,
    webpedidos_detalles as WebPedidoDetallePrisma,
    productos as ProductoPrisma
} from '@prisma/client';

// 🛑 Definimos la interfaz de SALIDA del servicio aquí.
// Esta interfaz es lo que el controlador consumirá, y su estructura ya es amigable 
// (Decimal convertido a number o string, Date a string, etc.) para el Front-end.
// Esto sigue el patrón de los servicios que defines localmente.

interface WebPedidoDetalleOutput {
    id: number;
    cantidad: number;
    precio_unitario: string; // Mantener como string si el Front-end lo maneja así
    subtotal: string;       // Mantener como string si el Front-end lo maneja así
    productos: {
        id: number;
        nombre: string;
    };
}

// Interfaz de retorno para la lista de pedidos
export interface WebPedidoOutput extends Omit<WebPedidoPrisma, 'subtotal' | 'total' | 'costo_envio' | 'hora_programada' | 'created_at' | 'updated_at'> {
    subtotal: string;
    total: string;
    costo_envio: string;
    hora_programada: string | null;
    created_at: string;
    updated_at: string | null;
    webpedidos_detalles: WebPedidoDetalleOutput[];
}

// Función de mapeo (Para convertir tipos de Prisma a la interfaz de salida WebPedidoOutput)
const mapWebPedidoToOutput = (pedido: any): WebPedidoOutput => ({
    ...pedido,
    // Convertir Decimal y Date a string para la salida JSON consistente
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
    
    /**
     * Obtiene todos los pedidos web que están listos para ser entregados o recogidos.
     */
    async getReadyOrders(tenantId: number): Promise<WebPedidoOutput[]> {
        const estadosListos: WebPedidoEstadoPrisma[] = [
            WebPedidoEstadoPrisma.ListoParaRecoger,
            WebPedidoEstadoPrisma.EnCamino,
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

        // Aplicamos el mapeo de tipos
        return webPedidos.map(mapWebPedidoToOutput);
    },
    
    /**
     * Actualiza el estado de un pedido web a Entregado, Cancelado o EnCamino.
     */
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

        // Aplicamos el mapeo de tipos
        return mapWebPedidoToOutput(updatedOrder);
    },
};