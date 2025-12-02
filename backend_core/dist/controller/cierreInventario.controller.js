"use strict";
// backend/src/controllers/cierreInventario.controller.ts - ARCHIVO NUEVO
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCierreEstadisticas = exports.finalizarCierre = exports.updateCierreInventario = exports.createCierreInventario = exports.getCierreById = exports.getCierresInventario = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// ========== LISTAR CIERRES CON FILTROS ==========
const getCierresInventario = async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { estado, tipo_cierre, fechaInicio, fechaFin } = req.query;
        const where = { tenant_id: tenantId };
        if (estado) {
            where.estado = estado;
        }
        if (tipo_cierre) {
            where.tipo_cierre = tipo_cierre;
        }
        if (fechaInicio || fechaFin) {
            where.fecha_inicio = {};
            if (fechaInicio) {
                where.fecha_inicio.gte = new Date(fechaInicio);
            }
            if (fechaFin) {
                where.fecha_inicio.lte = new Date(fechaFin);
            }
        }
        const cierres = await prisma.cierres_inventario.findMany({
            where,
            include: {
                empleados: {
                    select: {
                        nombre: true,
                        email: true,
                    },
                },
                detalles: {
                    include: {
                        productos_inventario: {
                            select: {
                                nombre: true,
                            },
                        },
                    },
                },
            },
            orderBy: { created_at: 'desc' },
        });
        res.json(cierres);
    }
    catch (error) {
        console.error('❌ Error en getCierresInventario:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.getCierresInventario = getCierresInventario;
// ========== OBTENER CIERRE POR ID ==========
const getCierreById = async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { id } = req.params;
        const cierre = await prisma.cierres_inventario.findFirst({
            where: {
                id: parseInt(id),
                tenant_id: tenantId,
            },
            include: {
                empleados: {
                    select: {
                        nombre: true,
                        email: true,
                    },
                },
                detalles: {
                    include: {
                        productos_inventario: {
                            select: {
                                nombre: true,
                                costo_unitario: true,
                                unidades_medida: {
                                    select: {
                                        abreviatura: true,
                                    },
                                },
                                categorias_inventario: {
                                    select: {
                                        nombre: true,
                                        color: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: {
                        productos_inventario: {
                            nombre: 'asc',
                        },
                    },
                },
            },
        });
        if (!cierre) {
            return res.status(404).json({ error: 'Cierre no encontrado' });
        }
        res.json(cierre);
    }
    catch (error) {
        console.error('❌ Error en getCierreById:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.getCierreById = getCierreById;
// ========== CREAR NUEVO CIERRE ==========
const createCierreInventario = async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const empleadoId = req.userId;
        const { fecha_inicio, fecha_fin, tipo_cierre, observaciones, detalles } = req.body;
        console.log('📋 [DEBUG] Datos recibidos:', {
            tenantId,
            empleadoId,
            fecha_inicio,
            fecha_fin,
            tipo_cierre,
            detallesCount: detalles?.length
        });
        // Validar tenantId y empleadoId
        if (!tenantId) {
            return res.status(400).json({ error: 'TenantId no encontrado en la solicitud' });
        }
        if (!empleadoId) {
            return res.status(400).json({ error: 'Usuario no autenticado correctamente' });
        }
        // Validaciones
        if (!fecha_inicio || !fecha_fin || !tipo_cierre) {
            return res.status(400).json({
                error: 'Faltan campos requeridos: fecha_inicio, fecha_fin, tipo_cierre'
            });
        }
        if (!detalles || detalles.length === 0) {
            return res.status(400).json({
                error: 'Debes incluir al menos un producto en el cierre'
            });
        }
        // Calcular diferencias y valores
        let totalDiferencias = new client_1.Prisma.Decimal(0);
        const detallesConDatos = [];
        for (const detalle of detalles) {
            const producto = await prisma.productos_inventario.findUnique({
                where: { id: detalle.producto_inventario_id },
            });
            if (!producto) {
                return res.status(404).json({
                    error: `Producto con ID ${detalle.producto_inventario_id} no encontrado`
                });
            }
            const stockSistema = new client_1.Prisma.Decimal(producto.stock_actual || 0);
            const stockFisico = new client_1.Prisma.Decimal(detalle.stock_fisico);
            const diferencia = stockFisico.minus(stockSistema);
            const costoUnitario = new client_1.Prisma.Decimal(producto.costo_unitario || 0);
            const valorDiferencia = diferencia.mul(costoUnitario);
            totalDiferencias = totalDiferencias.plus(valorDiferencia.abs());
            detallesConDatos.push({
                producto_inventario_id: detalle.producto_inventario_id,
                stock_sistema: stockSistema,
                stock_fisico: stockFisico,
                diferencia: diferencia,
                tipo_diferencia: detalle.tipo_diferencia || null,
                valor_diferencia: valorDiferencia,
                notas: detalle.notas || null,
            });
        }
        // Crear cierre
        const cierre = await prisma.cierres_inventario.create({
            data: {
                tenant_id: tenantId,
                fecha_inicio: new Date(fecha_inicio),
                fecha_fin: new Date(fecha_fin),
                tipo_cierre,
                estado: 'Borrador',
                total_diferencias: totalDiferencias,
                observaciones: observaciones || null,
                realizado_por_id: empleadoId,
                detalles: {
                    create: detallesConDatos,
                },
            },
            include: {
                empleados: {
                    select: {
                        nombre: true,
                        email: true,
                    },
                },
                detalles: {
                    include: {
                        productos_inventario: {
                            select: {
                                nombre: true,
                                costo_unitario: true,
                                unidades_medida: {
                                    select: {
                                        abreviatura: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        console.log('✅ Cierre de inventario creado:', cierre.id);
        res.status(201).json(cierre);
    }
    catch (error) {
        console.error('❌ Error en createCierreInventario:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.createCierreInventario = createCierreInventario;
// ========== ACTUALIZAR CIERRE (SOLO BORRADOR) ==========
const updateCierreInventario = async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { id } = req.params;
        const { observaciones, detalles } = req.body;
        const cierreExistente = await prisma.cierres_inventario.findFirst({
            where: {
                id: parseInt(id),
                tenant_id: tenantId,
            },
        });
        if (!cierreExistente) {
            return res.status(404).json({ error: 'Cierre no encontrado' });
        }
        if (cierreExistente.estado !== 'Borrador') {
            return res.status(400).json({
                error: 'Solo se pueden editar cierres en estado Borrador'
            });
        }
        // Actualizar observaciones
        let updateData = {};
        if (observaciones !== undefined) {
            updateData.observaciones = observaciones;
        }
        // Si se enviaron nuevos detalles, reemplazar
        if (detalles && detalles.length > 0) {
            // Eliminar detalles anteriores
            await prisma.cierres_inventario_detalles.deleteMany({
                where: { cierre_id: parseInt(id) },
            });
            // Recalcular diferencias
            let totalDiferencias = new client_1.Prisma.Decimal(0);
            const detallesConDatos = [];
            for (const detalle of detalles) {
                const producto = await prisma.productos_inventario.findUnique({
                    where: { id: detalle.producto_inventario_id },
                });
                if (!producto)
                    continue;
                const stockSistema = new client_1.Prisma.Decimal(producto.stock_actual || 0);
                const stockFisico = new client_1.Prisma.Decimal(detalle.stock_fisico);
                const diferencia = stockFisico.minus(stockSistema);
                const costoUnitario = new client_1.Prisma.Decimal(producto.costo_unitario || 0);
                const valorDiferencia = diferencia.mul(costoUnitario);
                totalDiferencias = totalDiferencias.plus(valorDiferencia.abs());
                detallesConDatos.push({
                    producto_inventario_id: detalle.producto_inventario_id,
                    stock_sistema: stockSistema,
                    stock_fisico: stockFisico,
                    diferencia: diferencia,
                    tipo_diferencia: detalle.tipo_diferencia || null,
                    valor_diferencia: valorDiferencia,
                    notas: detalle.notas || null,
                });
            }
            updateData.total_diferencias = totalDiferencias;
            updateData.detalles = {
                create: detallesConDatos,
            };
        }
        const cierreActualizado = await prisma.cierres_inventario.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                empleados: {
                    select: {
                        nombre: true,
                        email: true,
                    },
                },
                detalles: {
                    include: {
                        productos_inventario: {
                            select: {
                                nombre: true,
                                costo_unitario: true,
                                unidades_medida: {
                                    select: {
                                        abreviatura: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        console.log('✅ Cierre actualizado:', cierreActualizado.id);
        res.json(cierreActualizado);
    }
    catch (error) {
        console.error('❌ Error en updateCierreInventario:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.updateCierreInventario = updateCierreInventario;
// ========== FINALIZAR CIERRE (ACTUALIZA STOCK) ==========
const finalizarCierre = async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { id } = req.params;
        const cierre = await prisma.cierres_inventario.findFirst({
            where: {
                id: parseInt(id),
                tenant_id: tenantId,
            },
            include: {
                detalles: true,
            },
        });
        if (!cierre) {
            return res.status(404).json({ error: 'Cierre no encontrado' });
        }
        if (cierre.estado === 'Finalizado') {
            return res.status(400).json({ error: 'Este cierre ya está finalizado' });
        }
        // Actualizar stock de todos los productos
        for (const detalle of cierre.detalles) {
            await prisma.productos_inventario.update({
                where: { id: detalle.producto_inventario_id },
                data: {
                    stock_anterior: detalle.stock_sistema,
                    stock_actual: detalle.stock_fisico,
                    ultimo_conteo: new Date(),
                },
            });
        }
        // Marcar cierre como finalizado
        const cierreFinalizado = await prisma.cierres_inventario.update({
            where: { id: parseInt(id) },
            data: { estado: 'Finalizado' },
            include: {
                empleados: {
                    select: {
                        nombre: true,
                        email: true,
                    },
                },
                detalles: {
                    include: {
                        productos_inventario: {
                            select: {
                                nombre: true,
                                costo_unitario: true,
                                unidades_medida: {
                                    select: {
                                        abreviatura: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        console.log('✅ Cierre finalizado y stock actualizado:', cierreFinalizado.id);
        res.json({
            message: 'Cierre finalizado exitosamente. Stock actualizado.',
            cierre: cierreFinalizado
        });
    }
    catch (error) {
        console.error('❌ Error en finalizarCierre:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.finalizarCierre = finalizarCierre;
// ========== ESTADÍSTICAS DEL CIERRE ==========
const getCierreEstadisticas = async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { id } = req.params;
        const cierre = await prisma.cierres_inventario.findFirst({
            where: {
                id: parseInt(id),
                tenant_id: tenantId,
            },
            include: {
                detalles: {
                    include: {
                        productos_inventario: {
                            select: {
                                nombre: true,
                            },
                        },
                    },
                },
            },
        });
        if (!cierre) {
            return res.status(404).json({ error: 'Cierre no encontrado' });
        }
        // Calcular estadísticas
        const totalProductos = cierre.detalles.length;
        const diferenciasPositivas = cierre.detalles.filter(d => new client_1.Prisma.Decimal(d.diferencia).greaterThan(0)).length;
        const diferenciasNegativas = cierre.detalles.filter(d => new client_1.Prisma.Decimal(d.diferencia).lessThan(0)).length;
        const valorTotalMermas = cierre.detalles
            .filter(d => d.tipo_diferencia === 'Merma')
            .reduce((sum, d) => sum + parseFloat(d.valor_diferencia.toString()), 0);
        // Productos con mayor diferencia (absoluta)
        const productosMayorDiferencia = cierre.detalles
            .map(d => ({
            producto: d.productos_inventario.nombre,
            diferencia: parseFloat(d.diferencia.toString()),
            valor: parseFloat(d.valor_diferencia.toString()),
        }))
            .sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor))
            .slice(0, 5);
        // Diferencias por tipo
        const diferenciasPorTipo = cierre.detalles
            .filter(d => d.tipo_diferencia)
            .reduce((acc, d) => {
            const tipo = d.tipo_diferencia;
            if (!acc[tipo]) {
                acc[tipo] = { tipo, cantidad: 0, valor: 0 };
            }
            acc[tipo].cantidad += 1;
            acc[tipo].valor += parseFloat(d.valor_diferencia.toString());
            return acc;
        }, {});
        const estadisticas = {
            total_productos_contados: totalProductos,
            total_diferencias_positivas: diferenciasPositivas,
            total_diferencias_negativas: diferenciasNegativas,
            valor_total_mermas: valorTotalMermas,
            productos_con_mayor_diferencia: productosMayorDiferencia,
            diferencias_por_tipo: Object.values(diferenciasPorTipo),
        };
        res.json(estadisticas);
    }
    catch (error) {
        console.error('❌ Error en getCierreEstadisticas:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.getCierreEstadisticas = getCierreEstadisticas;
