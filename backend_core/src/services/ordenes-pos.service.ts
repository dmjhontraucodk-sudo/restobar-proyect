// backend_core/src/services/ordenes-pos.service.ts (CORREGIDO)

import { prisma } from '../lib/prisma';
import { ordenes_estado } from '@prisma/client';
// Importamos el DTO del servicio web
import { KitchenOrderDto } from './pedidos-web-flow.service'; 

// Usamos Pick para obtener solo las propiedades que necesitamos para mapear
export type OrdenesQuery = {
    id: number;
    // ✅ CORRECCIÓN: Permitimos 'null' en el tipo de estado para coincidir con la base de datos (Prisma)
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

    /**
     * Consulta y devuelve las órdenes POS (de mesa) activas para ser enviadas a Cocina.
     */
    async getOrdenesActivasParaCocina(tenantId: number): Promise<OrdenesQuery[]> {
        return [];
    },

    /**
     * Mapea una orden POS a la estructura unificada (KitchenOrderDto).
     */
    mapOrdenToDto(orden: OrdenesQuery): KitchenOrderDto {
        // Manejo del estado: Si es null, asumimos 'Abierta' o 'Pendiente' para la cocina.
        const estadoOrden = orden.estado || ordenes_estado.Abierta; 

        // Mapeamos el estado de POS a un estado compatible con el Front-end de Cocina (webpedidos_estado)
        // La orden POS Abierta se mapea a Pendiente, ya que Cocina debe empezar a procesarla.
        let estadoCocina: string;
        switch (estadoOrden) {
            case ordenes_estado.Abierta:
                estadoCocina = 'Pendiente'; 
                break;
            default:
                estadoCocina = 'Pendiente'; 
        }

        return {
            // ✅ ID UNIFICADO: Prefijo 'P-' para POS
            id: `P-${orden.id}`,
            numero_orden: `M-${orden.mesas.nombre_o_numero}`, // Usamos el número de mesa como referencia
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
            notas_especiales: null, // Las notas se ponen por detalle en órdenes POS
        };
    },

    /**
     * Actualiza el estado de una orden POS y maneja el inventario (futuro).
     */
    async actualizarEstadoOrdenPos(
        tenantId: number, 
        ordenId: number, 
        nuevoEstado: string
    ) {
        // En el flujo de Cocina, el estado pasa a ser 'EnPreparacion' o 'ListoParaRecoger'

        if (nuevoEstado === 'EnPreparacion') {
            // Lógica de Descuento de Inventario:
            // 1. Obtener detalles de la orden
            const orden = await prisma.ordenes.findUnique({
                where: { id: ordenId, tenant_id: tenantId },
                include: { ordendetalles: true }
            });
            
            if (!orden) throw new Error('Orden POS no encontrada.');
            
            // 2. Aquí iría la lógica avanzada para descontar inventario
            //    por cada item en `orden.ordendetalles`. 
            //    (Se asume que la lógica de kardex y recetas se implementará aquí)
            console.log(`⚠️ Lógica de inventario: Descontando stock para Orden POS #${ordenId}...`);
            // Lógica de inventario...
            
            // 3. Actualizamos el estado de la orden POS a 'Abierta' (ya que el Front-end de Pedidos
            //    controla el estado más alto (Pagada/Cerrada), pero el de Cocina controla la preparación).
            const estadoDB = ordenes_estado.Abierta; 

            await prisma.ordenes.update({
                where: { id: ordenId },
                data: {
                    estado: estadoDB,
                }
            });
            return { id: ordenId, estado: estadoDB }; // Devolver un objeto simple
        }
        
        // Si el estado es "ListoParaRecoger" o "Listo", NO modificamos el estado de la orden
        // ya que la orden POS debe permanecer 'Abierta' hasta el cobro en caja.
        // Solo la notificación visual en Cocina se actualiza.
        
        // Aquí puedes actualizar los detalles del ítem de la orden para marcarlo como listo
        // (Si se quiere una granularidad por ítem en Cocina)
        
        // Retornamos la orden sin actualizar el estado principal
        const orden = await prisma.ordenes.findUnique({ where: { id: ordenId } });
        if (!orden) throw new Error('Orden POS no encontrada después de actualización.');
        return { id: ordenId, estado: orden.estado };
    }
};