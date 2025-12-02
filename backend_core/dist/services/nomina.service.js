"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nominaService = void 0;
// backend_core/src/services/nomina.service.ts
const prisma_1 = require("../lib/prisma");
exports.nominaService = {
    // ==================== OBTENER ====================
    /**
     * Obtiene un empleado por ID con su rol
     */
    async getEmpleadoById(empleadoId) {
        return prisma_1.prisma.empleados.findUnique({
            where: { id: empleadoId },
            include: { roles: true }
        });
    },
    /**
     * Obtiene la nómina completa del tenant
     */
    async getNomina(tenantId) {
        // Obtener empleados activos con salario
        const empleados = await prisma_1.prisma.empleados.findMany({
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
        const empleadosNomina = empleados.map(emp => ({
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
    async getEstadisticasNomina(tenantId) {
        const empleados = await prisma_1.prisma.empleados.findMany({
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
    async calcularEstadisticas(empleados) {
        const salarios = empleados
            .filter(e => e.salario !== null)
            .map(e => parseFloat(e.salario.toString()));
        const total_nomina_mensual = salarios.reduce((sum, s) => sum + s, 0);
        const salario_promedio = salarios.length > 0 ? total_nomina_mensual / salarios.length : 0;
        const salario_maximo = salarios.length > 0 ? Math.max(...salarios) : 0;
        const salario_minimo = salarios.length > 0 ? Math.min(...salarios) : 0;
        // Agrupar por rol
        const porRolMap = new Map();
        empleados.forEach(emp => {
            if (emp.salario === null)
                return;
            const rolNombre = emp.roles.nombre;
            const salario = parseFloat(emp.salario.toString());
            if (!porRolMap.has(rolNombre)) {
                porRolMap.set(rolNombre, {
                    cantidad: 0,
                    total_salarios: 0
                });
            }
            const rolData = porRolMap.get(rolNombre);
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
