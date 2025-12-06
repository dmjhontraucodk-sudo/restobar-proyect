"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nominaService = void 0;
const prisma_service_1 = require("@shared/database/prisma.service");
exports.nominaService = {
    async getEmpleadoById(empleadoId) {
        return prisma_service_1.prisma.empleados.findUnique({
            where: { id: empleadoId },
            include: { roles: true }
        });
    },
    async getNomina(tenantId) {
        const empleados = await prisma_service_1.prisma.empleados.findMany({
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
        const empleadosNomina = empleados.map(emp => ({
            id: emp.id,
            nombre: emp.nombre,
            email: emp.email,
            rol: emp.roles.nombre,
            salario: emp.salario ? parseFloat(emp.salario.toString()) : 0,
            fecha_ingreso: emp.fecha_ingreso,
            is_active: emp.is_active
        }));
        const estadisticas = await this.calcularEstadisticas(empleados);
        return {
            empleados: empleadosNomina,
            estadisticas
        };
    },
    async getEstadisticasNomina(tenantId) {
        const empleados = await prisma_service_1.prisma.empleados.findMany({
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
    async calcularEstadisticas(empleados) {
        const salarios = empleados
            .filter(e => e.salario !== null)
            .map(e => parseFloat(e.salario.toString()));
        const total_nomina_mensual = salarios.reduce((sum, s) => sum + s, 0);
        const salario_promedio = salarios.length > 0 ? total_nomina_mensual / salarios.length : 0;
        const salario_maximo = salarios.length > 0 ? Math.max(...salarios) : 0;
        const salario_minimo = salarios.length > 0 ? Math.min(...salarios) : 0;
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
    },
    async calcularPago(tenantId, empleadoId) {
        const empleado = await prisma_service_1.prisma.empleados.findUnique({
            where: { id: empleadoId },
            select: { id: true, nombre: true, salario: true }
        });
        if (!empleado)
            throw new Error('Empleado no encontrado');
        const descuentos = await prisma_service_1.prisma.descuentos_empleados.findMany({
            where: {
                tenant_id: tenantId,
                empleado_id: empleadoId,
                estado: 'Pendiente'
            }
        });
        const fechaActual = new Date();
        const inicioMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
        const pagoPrevio = await prisma_service_1.prisma.gastos.findFirst({
            where: {
                tenant_id: tenantId,
                fecha: { gte: inicioMes },
                descripcion: { contains: `Pago de Nómina: ${empleado.nombre}` }
            }
        });
        const sueldoBase = Number(empleado.salario || 0);
        const totalDescuentos = descuentos.reduce((sum, d) => sum + Number(d.monto), 0);
        const totalPagar = Math.max(sueldoBase - totalDescuentos, 0);
        return {
            empleado: empleado.nombre,
            sueldo_base: sueldoBase,
            total_descuentos: totalDescuentos,
            total_pagar: totalPagar,
            descuentos_detalle: descuentos,
            ultimo_pago: pagoPrevio ? pagoPrevio.fecha : null,
            ya_pagado_mes_actual: !!pagoPrevio
        };
    }
};
