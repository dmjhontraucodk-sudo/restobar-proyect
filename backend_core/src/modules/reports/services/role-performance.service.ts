import { prisma } from '@shared/database/prisma.service';

/**
 * Calcula las métricas de desempeño para un único empleado con rol "Motorizado".
 */
const calculateMotorizadoPerformance = async (employeeId: number, tenantId: number, fechaInicio: Date, fechaFin: Date) => {
    const pedidos = await prisma.webpedidos.findMany({
        where: {
            tenant_id: tenantId,
            motorizado_id: employeeId,
            estado: 'Entregado',
            hora_entrega_delivery: {
                gte: fechaInicio,
                lte: fechaFin,
            }
        },
        select: {
            total: true,
            hora_salida_delivery: true,
            hora_entrega_delivery: true
        }
    });

    const totalPedidosEntregados = pedidos.length;
    const totalVentasEntregadas = pedidos.reduce((sum, p) => sum + Number(p.total), 0);
    
    const tiemposDeEntrega = pedidos
        .map(p => {
            if (p.hora_entrega_delivery && p.hora_salida_delivery) {
                return p.hora_entrega_delivery.getTime() - p.hora_salida_delivery.getTime();
            }
            return 0;
        })
        .filter(t => t > 0);

    const tiempoPromedioMs = tiemposDeEntrega.length > 0 
        ? tiemposDeEntrega.reduce((a, b) => a + b, 0) / tiemposDeEntrega.length
        : 0;
        
    const tiempoPromedioMin = Math.round(tiempoPromedioMs / 60000);

    return {
        totalPedidosEntregados,
        totalVentasEntregadas,
        tiempoPromedioEntregaMin: tiempoPromedioMin
    };
};

/**
 * Obtiene el reporte de desempeño para un empleado específico.
 * Determina el rol del empleado y llama a la función de cálculo correspondiente.
 */
const getEmployeePerformance = async (employeeId: number, tenantId: number, fechaInicio: Date, fechaFin: Date) => {
    const employee = await prisma.empleados.findFirst({
        where: {
            id: employeeId,
            tenant_id: tenantId,
        },
        include: {
            roles: true,
        },
    });

    if (!employee) {
        throw new Error('Empleado no encontrado');
    }

    const roleName = employee.roles.nombre;
    let performanceData = {};

    // Switch para determinar qué reporte generar basado en el rol
    switch (roleName) {
        case 'Motorizado':
            performanceData = await calculateMotorizadoPerformance(employeeId, tenantId, fechaInicio, fechaFin);
            break;
        
        // TODO: Añadir casos para otros roles como 'Cajero', 'Cocinero', etc.
        case 'Cajero':
            // performanceData = await calculateCajeroPerformance(employeeId, tenantId, fechaInicio, fechaFin);
            performanceData = { message: 'Reporte para Cajero aún no implementado.' };
            break;
            
        default:
            throw new Error(`El reporte de desempeño no está disponible para el rol: ${roleName}`);
    }

    return {
        employee: {
            id: employee.id,
            nombre: employee.nombre,
            rol: roleName,
        },
        performance: performanceData
    };
};

/**
 * Obtiene la lista de todos los roles activos.
 */
const getRoles = async () => {
    return prisma.roles.findMany({
        where: {
            activo: true
        },
        select: {
            id: true,
            nombre: true,
        }
    });
};

/**
 * Obtiene los empleados de un tenant filtrados por un rol específico.
 */
const getEmployeesByRole = async (tenantId: number, roleId: number) => {
    return prisma.empleados.findMany({
        where: {
            tenant_id: tenantId,
            rol_id: roleId,
            is_active: true
        },
        select: {
            id: true,
            nombre: true
        }
    });
};


export const rolePerformanceService = {
    getEmployeePerformance,
    getRoles,
    getEmployeesByRole
};