"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGastosEstadisticas = exports.deleteGasto = exports.updateGasto = exports.createGasto = exports.getGastoById = exports.getGastos = void 0;
// ✅ 1. CORRECCIÓN: Ruta ajustada (un solo punto ..)
const prisma_1 = require("../lib/prisma");
// ========== LISTAR GASTOS OPERATIVOS ==========
const getGastos = async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const gastos = await prisma_1.prisma.gastos.findMany({
            where: {
                tenant_id: tenantId,
            },
            include: {
                tipos_gasto: {
                    select: {
                        id: true,
                        nombre: true,
                        color: true,
                        icono: true,
                        afecta_inventario: true,
                    },
                },
                proveedores: {
                    select: {
                        id: true,
                        nombre_empresa: true,
                    },
                },
                empleados: {
                    select: {
                        id: true,
                        nombre: true,
                        email: true,
                    },
                },
                descuentos_aplicados: true
            },
            orderBy: {
                fecha: 'desc',
            },
        });
        return res.json(gastos);
    }
    catch (error) {
        console.error('Error al obtener gastos:', error);
        return res.status(500).json({ error: 'Error al obtener gastos' });
    }
};
exports.getGastos = getGastos;
// ========== OBTENER GASTO POR ID ==========
const getGastoById = async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { id } = req.params;
        const gasto = await prisma_1.prisma.gastos.findFirst({
            where: {
                id: parseInt(id),
                tenant_id: tenantId,
            },
            include: {
                tipos_gasto: true,
                proveedores: true,
                empleados: {
                    select: {
                        id: true,
                        nombre: true,
                        email: true,
                    },
                },
                descuentos_aplicados: {
                    include: {
                        empleados: { select: { nombre: true } }
                    }
                }
            },
        });
        if (!gasto) {
            return res.status(404).json({ error: 'Gasto no encontrado' });
        }
        return res.json(gasto);
    }
    catch (error) {
        console.error('Error al obtener gasto:', error);
        return res.status(500).json({ error: 'Error al obtener gasto' });
    }
};
exports.getGastoById = getGastoById;
// ========== CREAR GASTO (CON SOPORTE PARA NÓMINA) ==========
const createGasto = async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const empleadoId = req.userId;
        const { tipo_gasto_id, proveedor_id, fecha, monto, numero_documento, descripcion, metodo_pago, descuentos_ids } = req.body;
        if (!tipo_gasto_id || !fecha || !monto) {
            return res.status(400).json({
                error: 'Faltan campos requeridos: tipo_gasto_id, fecha, monto',
            });
        }
        if (monto <= 0) {
            return res.status(400).json({
                error: 'El monto debe ser mayor a 0',
            });
        }
        const tipoGasto = await prisma_1.prisma.tipos_gasto.findFirst({
            where: {
                id: tipo_gasto_id,
                tenant_id: tenantId,
            },
        });
        if (!tipoGasto) {
            return res.status(404).json({ error: 'Tipo de gasto no encontrado' });
        }
        if (tipoGasto.afecta_inventario) {
            return res.status(400).json({
                error: 'Este tipo de gasto afecta inventario. Usa el endpoint de compras.',
            });
        }
        // ✅ 2. CORRECCIÓN: Tipar explícitamente 'tx' como any
        const nuevoGasto = await prisma_1.prisma.$transaction(async (tx) => {
            // 1. Crear el registro de Gasto
            const gasto = await tx.gastos.create({
                data: {
                    tenant_id: tenantId,
                    tipo_gasto_id,
                    proveedor_id: proveedor_id || null,
                    fecha: new Date(fecha),
                    monto,
                    numero_documento: numero_documento || null,
                    descripcion: descripcion || null,
                    metodo_pago: metodo_pago || null,
                    aprobado_por_id: empleadoId,
                },
                include: {
                    tipos_gasto: true,
                    proveedores: true,
                    empleados: {
                        select: {
                            nombre: true,
                            email: true,
                        },
                    },
                },
            });
            // 2. Si vienen descuentos, vincularlos
            if (descuentos_ids && Array.isArray(descuentos_ids) && descuentos_ids.length > 0) {
                await tx.descuentos_empleados.updateMany({
                    where: {
                        id: { in: descuentos_ids },
                        tenant_id: tenantId
                    },
                    data: {
                        estado: 'Aplicado',
                        gasto_id: gasto.id
                    }
                });
            }
            return gasto;
        });
        return res.status(201).json(nuevoGasto);
    }
    catch (error) {
        console.error('Error al crear gasto:', error);
        return res.status(500).json({ error: 'Error al crear gasto' });
    }
};
exports.createGasto = createGasto;
// ========== ACTUALIZAR GASTO ==========
const updateGasto = async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { id } = req.params;
        const { tipo_gasto_id, proveedor_id, fecha, monto, numero_documento, descripcion, metodo_pago, } = req.body;
        const gastoExistente = await prisma_1.prisma.gastos.findFirst({
            where: {
                id: parseInt(id),
                tenant_id: tenantId,
            },
        });
        if (!gastoExistente) {
            return res.status(404).json({ error: 'Gasto no encontrado' });
        }
        const gastoActualizado = await prisma_1.prisma.gastos.update({
            where: { id: parseInt(id) },
            data: {
                tipo_gasto_id: tipo_gasto_id || gastoExistente.tipo_gasto_id,
                proveedor_id: proveedor_id !== undefined ? proveedor_id : gastoExistente.proveedor_id,
                fecha: fecha ? new Date(fecha) : gastoExistente.fecha,
                monto: monto || gastoExistente.monto,
                numero_documento: numero_documento !== undefined ? numero_documento : gastoExistente.numero_documento,
                descripcion: descripcion !== undefined ? descripcion : gastoExistente.descripcion,
                metodo_pago: metodo_pago !== undefined ? metodo_pago : gastoExistente.metodo_pago,
            },
            include: {
                tipos_gasto: true,
                proveedores: true,
                empleados: {
                    select: {
                        nombre: true,
                        email: true,
                    },
                },
            },
        });
        return res.json(gastoActualizado);
    }
    catch (error) {
        console.error('Error al actualizar gasto:', error);
        return res.status(500).json({ error: 'Error al actualizar gasto' });
    }
};
exports.updateGasto = updateGasto;
// ========== ELIMINAR GASTO ==========
const deleteGasto = async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { id } = req.params;
        const gastoExistente = await prisma_1.prisma.gastos.findFirst({
            where: {
                id: parseInt(id),
                tenant_id: tenantId,
            },
        });
        if (!gastoExistente) {
            return res.status(404).json({ error: 'Gasto no encontrado' });
        }
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.descuentos_empleados.updateMany({
                where: { gasto_id: parseInt(id) },
                data: {
                    estado: 'Pendiente',
                    gasto_id: null
                }
            }),
            prisma_1.prisma.gastos.delete({
                where: { id: parseInt(id) },
            })
        ]);
        return res.json({ message: 'Gasto eliminado correctamente' });
    }
    catch (error) {
        console.error('Error al eliminar gasto:', error);
        return res.status(500).json({ error: 'Error al eliminar gasto' });
    }
};
exports.deleteGasto = deleteGasto;
// ========== OBTENER ESTADÍSTICAS DE GASTOS ==========
const getGastosEstadisticas = async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { fechaInicio, fechaFin } = req.query;
        const whereCondition = {
            tenant_id: tenantId,
        };
        if (fechaInicio && fechaFin) {
            whereCondition.fecha = {
                gte: new Date(fechaInicio),
                lte: new Date(fechaFin),
            };
        }
        const gastos = await prisma_1.prisma.gastos.findMany({
            where: whereCondition,
            include: {
                tipos_gasto: true,
            },
        });
        // ✅ 3. CORRECCIÓN: Tipar explícitamente 'sum' y 'g'
        const totalGastos = gastos.reduce((sum, g) => sum + Number(g.monto), 0);
        // ✅ 4. CORRECCIÓN: Tipar explícitamente 'acc' y 'g'
        const gastosPorTipo = gastos.reduce((acc, g) => {
            const tipoNombre = g.tipos_gasto.nombre;
            if (!acc[tipoNombre]) {
                acc[tipoNombre] = {
                    tipo: tipoNombre,
                    color: g.tipos_gasto.color,
                    icono: g.tipos_gasto.icono,
                    cantidad: 0,
                    total: 0,
                };
            }
            acc[tipoNombre].cantidad++;
            acc[tipoNombre].total += Number(g.monto);
            return acc;
        }, {});
        const estadisticas = {
            total_gastos: totalGastos,
            cantidad_gastos: gastos.length,
            promedio_gasto: gastos.length > 0 ? totalGastos / gastos.length : 0,
            gastos_por_tipo: Object.values(gastosPorTipo),
        };
        return res.json(estadisticas);
    }
    catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
};
exports.getGastosEstadisticas = getGastosEstadisticas;
