// backend_core/src/services/mesas.service.ts
import { prisma } from '../lib/prisma';

import { 
    mesas as MesaType, 
    mesas_estado as EstadoMesa 
} from '@prisma/client'; 

type MesaCreateInput = Omit<MesaType, 'id' | 'tenant_id' | 'estado' | 'ordenes' | 'reservas'> & { estado?: EstadoMesa };
// MesaUpdateInput solo contiene campos que se pueden actualizar (nombre_o_numero, capacidad, estado)
type MesaUpdateInput = Omit<MesaType, 'id' | 'tenant_id' | 'ordenes' | 'reservas'>;

export const mesasService = {
    
    // --- OBTENER ---

    async getAllMesas(tenantId: number): Promise<MesaType[]> {
        return prisma.mesas.findMany({ 
            where: { tenant_id: tenantId },
            orderBy: { nombre_o_numero: 'asc' },
        });
    },

    async getMesaById(tenantId: number, mesaId: number): Promise<MesaType | null> {
        return prisma.mesas.findUnique({
            where: { id: mesaId, tenant_id: tenantId },
        });
    },

    // --- CREAR ---
    async createMesa(tenantId: number, data: MesaCreateInput): Promise<MesaType> {
        const existing = await prisma.mesas.findFirst({
            where: { tenant_id: tenantId, nombre_o_numero: data.nombre_o_numero }
        });

        if (existing) {
            throw new Error(`Ya existe una mesa con el nombre/número "${data.nombre_o_numero}".`);
        }

        return prisma.mesas.create({
            data: {
                nombre_o_numero: data.nombre_o_numero,
                capacidad: data.capacidad,
                estado: data.estado || 'Libre', 
                tenant_id: tenantId,
            },
        });
    },

    // --- ACTUALIZAR ---
    async updateMesa(tenantId: number, mesaId: number, data: MesaUpdateInput): Promise<MesaType> {
        return prisma.mesas.update({
            where: { id: mesaId, tenant_id: tenantId },
            data: data, 
        }).catch((err: any) => { 
            if (err.code === 'P2025') {
                throw new Error('Mesa no encontrada.');
            }
            throw err;
        });
    },

    // --- ELIMINAR ---
    async deleteMesa(tenantId: number, mesaId: number): Promise<MesaType> {
        const mesa = await prisma.mesas.findUnique({
            where: { id: mesaId, tenant_id: tenantId }
        });

        if (!mesa) {
            throw new Error('Mesa no encontrada.');
        }

        if (mesa.estado === 'Ocupada' || mesa.estado === 'Reservada') {
             throw new Error('No se puede eliminar una mesa que está actualmente en uso o reservada.');
        }

        return prisma.mesas.delete({
            where: { id: mesaId, tenant_id: tenantId },
        });
    },

    // --- CAMBIAR ESTADO ---
    async updateMesaState(tenantId: number, mesaId: number, newState: EstadoMesa): Promise<MesaType> {
        return prisma.mesas.update({
            where: { id: mesaId, tenant_id: tenantId },
            data: { estado: newState },
        });
    },

    async getAvailableMesas(tenantId: number): Promise<MesaType[]> {
    // Solo traer mesas en estado "Libre"
    return await prisma.mesas.findMany({
        where: {
            tenant_id: tenantId,
            estado: 'Libre' 
        },
        orderBy: { capacidad: 'asc' },
    });
}
    }
};