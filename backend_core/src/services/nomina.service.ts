// backend_core/src/services/nomina.service.ts
import { prisma } from '../lib/prisma';
import { empleados, roles } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

type EmpleadoConRol = empleados & {
    roles: roles;
};

interface EmpleadoNomina {
    id: number;
    nombre: string | null;
    email: string;
    rol: string;
    salario: number;
    fecha_ingreso: Date | null;
    is_active: boolean;
}

interface EstadisticasNomina {
    total_empleados_con_salario: number;
    total_nomina_mensual: number;
    salario_promedio: number;
    salario_maximo: number;
    salario_minimo: number;
    por_rol: Array<{
        rol: string;
        cantidad: number;
        total_salarios: number;
        promedio: number;
    }>;
}

export const nominaService = {
    
    // ==================== OBTENER ====================
    
    /**
     * Obtiene un empleado por ID con su rol
     */
    async getEmpleadoById(empleadoId: number): Promise<EmpleadoConRol | null> {
        return prisma.empleados.findUnique({
            where: { id: empleadoId },
            include: { roles: true }
        });
    },

    /**
     * Obtiene la nómina completa del tenant
     */
    async getNomina(tenantId: number): Promise<{
        empleados: EmpleadoNomina[];
        estadisticas: EstadisticasNomina;
    }> {
        // Obtener empleados activos con salario
        const empleados = await prisma.empleados.findMany({
            where: {
                tenant_id: tenantId,
                is_active: true,
                salario: { not: null }
            },
            include: {
                roles: true
            },
            orderBy: [
                { es_propietario: 'desc' },
                { salario: 'desc' }
            ]
        });

        // Mapear a formato de respuesta
        const empleadosNomina: EmpleadoNomina[] = empleados.map(emp => ({
            id: emp.id,
            nombre: emp.nombre,
            email: emp.email,
            rol: emp.roles.nombre,
            salario: emp.salario ? parseFloat(emp.salario.toString()) : 0,
            fecha_ingreso: emp.fecha_ingreso,
            is_active: emp.is_active
        }));

        // Calcular estadísticas
        const estadisticas = await this.calcularEstadisticas(empleados);

        return {
            empleados: empleadosNomina,
            estadisticas
        };
    },

    /**
     * Obtiene solo las estadísticas de nómina
     */
    async getEstadisticasNomina(tenantId: number): Promise<EstadisticasNomina> {
        const empleados = await prisma.empleados.findMany({
            where: {
                tenant_id: tenantId,
                is_active: true,
                salario: { not: null }
            },
            include: {
                roles: true
            }
        });

        return this.calcularEstadisticas(empleados);
    },

    // ==================== UTILIDADES ====================
    
    /**
     * Calcula estadísticas de nómina
     */
    async calcularEstadisticas(empleados: EmpleadoConRol[]): Promise<EstadisticasNomina> {
        const salarios = empleados
            .filter(e => e.salario !== null)
            .map(e => parseFloat(e.salario!.toString()));

        const total_nomina_mensual = salarios.reduce((sum, s) => sum + s, 0);
        const salario_promedio = salarios.length > 0 ? total_nomina_mensual / salarios.length : 0;
        const salario_maximo = salarios.length > 0 ? Math.max(...salarios) : 0;
        const salario_minimo = salarios.length > 0 ? Math.min(...salarios) : 0;

        // Agrupar por rol
        const porRolMap = new Map<string, {
            cantidad: number;
            total_salarios: number;
        }>();

        empleados.forEach(emp => {
            if (emp.salario === null) return;

            const rolNombre = emp.roles.nombre;
            const salario = parseFloat(emp.salario.toString());

            if (!porRolMap.has(rolNombre)) {
                porRolMap.set(rolNombre, {
                    cantidad: 0,
                    total_salarios: 0
                });
            }

            const rolData = porRolMap.get(rolNombre)!;
            rolData.cantidad++;
            rolData.total_salarios += salario;
        });

        const por_rol = Array.from(porRolMap.entries()).map(([rol, data]) => ({
            rol,
            cantidad: data.cantidad,
            total_salarios: data.total_salarios,
            promedio: data.total_salarios / data.cantidad
        }));

        return {
            total_empleados_con_salario: empleados.length,
            total_nomina_mensual,
            salario_promedio,
            salario_maximo,
            salario_minimo,
            por_rol
        };
    }
};