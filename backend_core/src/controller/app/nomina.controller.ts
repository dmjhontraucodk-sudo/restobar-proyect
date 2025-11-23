import { Request, Response } from 'express';
import { nominaService } from '../../services/nomina.service';
import { Prisma } from '@prisma/client';
// ✅ 1. CORRECCIÓN: IMPORTAR LA INSTANCIA DE PRISMA
import { prisma } from '../../lib/prisma';

// --- Interfaz de Autenticación ---
interface AuthRequest extends Request {
    user?: {
        id: number;
        tenant_id: number;
        rol_id: number;
        email: string;
        es_propietario?: boolean;
    };
    tenant?: {
        id: number;
        subdominio: string;
    };
}

// ==================== CONTROLLER ====================

export const nominaController = {
    
    /**
     * GET /api/dashboard/nomina - Obtiene lista de salarios (Administrador y Gerente)
     */
    async getNomina(req: AuthRequest, res: Response) {
        try {
            const tenantId = req.user?.tenant_id;
            const usuarioActualId = req.user?.id;

            if (!tenantId || !usuarioActualId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }

            // Obtener empleado actual para validar permisos
            const usuarioActual = await nominaService.getEmpleadoById(usuarioActualId);

            if (!usuarioActual) {
                return res.status(404).json({ error: 'Usuario no encontrado.' });
            }

            // Solo Administrador (propietario) y Gerente pueden ver salarios
            const puedeVerSalarios = usuarioActual.es_propietario || 
                                     usuarioActual.roles.nombre === 'Gerente';

            if (!puedeVerSalarios) {
                return res.status(403).json({ 
                    error: 'No tienes permisos para ver la información de nómina.' 
                });
            }

            // Obtener nómina
            const nomina = await nominaService.getNomina(tenantId);

            return res.status(200).json({
                success: true,
                nomina: nomina.empleados,
                estadisticas: nomina.estadisticas
            });

        } catch (error: any) {
            console.error('Error en getNomina:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Error interno del servidor.' 
            });
        }
    },

    /**
     * GET /api/dashboard/nomina/estadisticas - Obtiene estadísticas de nómina
     */
    async getEstadisticasNomina(req: AuthRequest, res: Response) {
        try {
            const tenantId = req.user?.tenant_id;
            const usuarioActualId = req.user?.id;

            if (!tenantId || !usuarioActualId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }

            const usuarioActual = await nominaService.getEmpleadoById(usuarioActualId);

            if (!usuarioActual) {
                return res.status(404).json({ error: 'Usuario no encontrado.' });
            }

            const puedeVerSalarios = usuarioActual.es_propietario || 
                                     usuarioActual.roles.nombre === 'Gerente';

            if (!puedeVerSalarios) {
                return res.status(403).json({ 
                    error: 'No tienes permisos para ver estadísticas de nómina.' 
                });
            }

            const estadisticas = await nominaService.getEstadisticasNomina(tenantId);

            return res.status(200).json({
                success: true,
                estadisticas
            });

        } catch (error: any) {
            console.error('Error en getEstadisticasNomina:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Error interno del servidor.' 
            });
        }
    },
};

// ✅ FUNCION CORREGIDA
export const calcularPagoEmpleado = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenant_id;
        const empleadoId = parseInt(req.params.id);

        if (!tenantId || isNaN(empleadoId)) return res.status(400).json({ error: 'Datos inválidos' });

        // 1. Buscar empleado
        const empleado = await prisma.empleados.findUnique({
            where: { id: empleadoId },
            select: { id: true, nombre: true, salario: true }
        });

        if (!empleado) return res.status(404).json({ error: 'Empleado no encontrado' });

        // 2. Buscar descuentos PENDIENTES
        const descuentos = await prisma.descuentos_empleados.findMany({
            where: {
                tenant_id: tenantId,
                empleado_id: empleadoId,
                estado: 'Pendiente'
            }
        });

        // 3. 🔍 VERIFICAR SI YA SE PAGÓ ESTE MES
        const fechaActual = new Date();
        const inicioMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
        
        // Buscamos un gasto que coincida con el patrón de nómina para este empleado en este mes
        const pagoPrevio = await prisma.gastos.findFirst({
            where: {
                tenant_id: tenantId,
                fecha: { gte: inicioMes },
                descripcion: { contains: `Pago de Nómina: ${empleado.nombre}` } // Usamos el nombre como referencia
            }
        });

        // 4. Calcular totales
        const sueldoBase = Number(empleado.salario || 0);
        const totalDescuentos = descuentos.reduce((sum: number, d: any) => sum + Number(d.monto), 0);
        const totalPagar = Math.max(sueldoBase - totalDescuentos, 0);

        return res.json({
            empleado: empleado.nombre,
            sueldo_base: sueldoBase,
            total_descuentos: totalDescuentos,
            total_pagar: totalPagar,
            descuentos_detalle: descuentos,
            // ✅ ENVIAMOS LA ALERTA
            ultimo_pago: pagoPrevio ? pagoPrevio.fecha : null,
            ya_pagado_mes_actual: !!pagoPrevio 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al calcular nómina' });
    }
};