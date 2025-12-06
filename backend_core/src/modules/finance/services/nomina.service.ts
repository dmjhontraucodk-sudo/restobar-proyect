import { prisma } from '@shared/database/prisma.service';
import { empleados, roles, pagos_metodo_pago } from '@prisma/client';
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
    
    async getEmpleadoById(empleadoId: number): Promise<EmpleadoConRol | null> {
        return prisma.empleados.findUnique({
            where: { id: empleadoId },
            include: { roles: true }
        });
    },

    async getNomina(tenantId: number): Promise<{
        empleados: EmpleadoNomina[];
        estadisticas: EstadisticasNomina;
    }> {
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

        const empleadosNomina: EmpleadoNomina[] = empleados.map(emp => ({
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

    async calcularEstadisticas(empleados: EmpleadoConRol[]): Promise<EstadisticasNomina> {
        const salarios = empleados
            .filter(e => e.salario !== null)
            .map(e => parseFloat(e.salario!.toString()));

        const total_nomina_mensual = salarios.reduce((sum, s) => sum + s, 0);
        const salario_promedio = salarios.length > 0 ? total_nomina_mensual / salarios.length : 0;
        const salario_maximo = salarios.length > 0 ? Math.max(...salarios) : 0;
        const salario_minimo = salarios.length > 0 ? Math.min(...salarios) : 0;

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
    },

    async calcularPago(tenantId: number, empleadoId: number) {
        const empleado = await prisma.empleados.findUnique({
            where: { id: empleadoId, tenant_id: tenantId },
            select: { id: true, nombre: true, salario: true }
        });

        if (!empleado) throw new Error('Empleado no encontrado.');

        const descuentos = await prisma.descuentos_empleados.findMany({
            where: {
                tenant_id: tenantId,
                empleado_id: empleadoId,
                estado: 'Pendiente'
            }
        });

        const fechaActual = new Date();
        const inicioMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
        
        const pagoPrevio = await prisma.gastos.findFirst({
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
            empleado_id: empleado.id,
            empleado_nombre: empleado.nombre,
            sueldo_base: sueldoBase,
            total_descuentos: totalDescuentos,
            total_pagar: totalPagar,
            descuentos_detalle: descuentos,
            ultimo_pago: pagoPrevio ? pagoPrevio.fecha : null,
            ya_pagado_mes_actual: !!pagoPrevio 
        };
    },

    async pagarNomina(
        tenantId: number,
        empleadoId: number,
        usuarioPagadorId: number,
        metodoPago: pagos_metodo_pago
    ) {
        return await prisma.$transaction(async (tx) => {
            const calculoPago = await this.calcularPago(tenantId, empleadoId);

            if (calculoPago.ya_pagado_mes_actual) {
                throw new Error('La nómina de este empleado ya ha sido pagada este mes.');
            }
            if (calculoPago.total_pagar <= 0) {
                throw new Error('No hay monto a pagar para este empleado.');
            }

            // 1. Obtener Tipo de Gasto "Pago de Nómina"
            let tipoGastoNomina = await tx.tipos_gasto.findFirst({
                where: { tenant_id: tenantId, nombre: "Pago de Nómina" }
            });

            if (!tipoGastoNomina) {
                // Crear tipo de gasto si no existe (con valores por defecto)
                tipoGastoNomina = await tx.tipos_gasto.create({
                    data: {
                        tenant_id: tenantId,
                        nombre: "Pago de Nómina",
                        descripcion: "Gastos relacionados con el pago de salarios al personal",
                        afecta_inventario: false,
                        activo: true
                    }
                });
            }

            // 2. Registrar el Gasto (Pago de Nómina)
            const nuevoGasto = await tx.gastos.create({
                data: {
                    tenant_id: tenantId,
                    tipo_gasto_id: tipoGastoNomina.id,
                    fecha: new Date(),
                    monto: new Decimal(calculoPago.total_pagar),
                    descripcion: `Pago de Nómina: ${calculoPago.empleado_nombre}`,
                    metodo_pago: metodoPago,
                    aprobado_por_id: usuarioPagadorId,
                }
            });

            // 3. Marcar Descuentos Aplicados
            if (calculoPago.descuentos_detalle.length > 0) {
                await tx.descuentos_empleados.updateMany({
                    where: {
                        id: { in: calculoPago.descuentos_detalle.map(d => d.id) },
                        tenant_id: tenantId,
                        empleado_id: empleadoId,
                        estado: 'Pendiente'
                    },
                    data: {
                        estado: 'Aplicado',
                        gasto_id: nuevoGasto.id
                    }
                });
            }

            // 4. Registrar Movimiento en Caja (si es efectivo)
            if (metodoPago === pagos_metodo_pago.Efectivo) {
                const cajaAbierta = await tx.cajas.findFirst({
                    where: {
                        tenant_id: tenantId,
                        usuario_responsable_id: usuarioPagadorId, // O una caja general del tenant
                        estado: 'Abierta'
                    }
                });

                if (!cajaAbierta) {
                    throw new Error('No hay una caja abierta para registrar el egreso en efectivo.');
                }

                await tx.cajas_movimientos.create({
                    data: {
                        tenant_id: tenantId,
                        caja_id: cajaAbierta.id,
                        usuario_id: usuarioPagadorId,
                        tipo: 'EGRESO',
                        concepto: `Pago de Nómina (${calculoPago.empleado_nombre})`,
                        monto: new Decimal(calculoPago.total_pagar),
                        metodo_pago: pagos_metodo_pago.Efectivo,
                        documento_tipo: 'Nomina',
                        documento_id: nuevoGasto.id,
                    }
                });
            }

            return {
                success: true,
                message: `Nómina de ${calculoPago.empleado_nombre} pagada exitosamente.`,
                gastoId: nuevoGasto.id,
                montoPagado: calculoPago.total_pagar
            };
        });
    }
};