// backend/src/controller/gastos.controller.ts - NUEVO CONTROLADOR

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ========== LISTAR GASTOS OPERATIVOS ==========
export const getGastos = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    
    const gastos = await prisma.gastos.findMany({
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
      },
      orderBy: {
        fecha: 'desc',
      },
    });

    return res.json(gastos);
  } catch (error) {
    console.error('Error al obtener gastos:', error);
    return res.status(500).json({ error: 'Error al obtener gastos' });
  }
};

// ========== OBTENER GASTO POR ID ==========
export const getGastoById = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;

    const gasto = await prisma.gastos.findFirst({
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
      },
    });

    if (!gasto) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    return res.json(gasto);
  } catch (error) {
    console.error('Error al obtener gasto:', error);
    return res.status(500).json({ error: 'Error al obtener gasto' });
  }
};

// ========== CREAR GASTO ==========
export const createGasto = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const empleadoId = (req as any).userId;
    const {
      tipo_gasto_id,
      proveedor_id,
      fecha,
      monto,
      numero_documento,
      descripcion,
      metodo_pago,
    } = req.body;

    // Validaciones
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

    // Verificar que el tipo de gasto NO afecta inventario
    const tipoGasto = await prisma.tipos_gasto.findFirst({
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

    // Crear gasto
    const nuevoGasto = await prisma.gastos.create({
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

    return res.status(201).json(nuevoGasto);
  } catch (error) {
    console.error('Error al crear gasto:', error);
    return res.status(500).json({ error: 'Error al crear gasto' });
  }
};

// ========== ACTUALIZAR GASTO ==========
export const updateGasto = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;
    const {
      tipo_gasto_id,
      proveedor_id,
      fecha,
      monto,
      numero_documento,
      descripcion,
      metodo_pago,
    } = req.body;

    // Verificar que existe
    const gastoExistente = await prisma.gastos.findFirst({
      where: {
        id: parseInt(id),
        tenant_id: tenantId,
      },
    });

    if (!gastoExistente) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    // Actualizar
    const gastoActualizado = await prisma.gastos.update({
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
  } catch (error) {
    console.error('Error al actualizar gasto:', error);
    return res.status(500).json({ error: 'Error al actualizar gasto' });
  }
};

// ========== ELIMINAR GASTO ==========
export const deleteGasto = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;

    const gastoExistente = await prisma.gastos.findFirst({
      where: {
        id: parseInt(id),
        tenant_id: tenantId,
      },
    });

    if (!gastoExistente) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    await prisma.gastos.delete({
      where: { id: parseInt(id) },
    });

    return res.json({ message: 'Gasto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar gasto:', error);
    return res.status(500).json({ error: 'Error al eliminar gasto' });
  }
};

// ========== OBTENER ESTADÍSTICAS DE GASTOS ==========
export const getGastosEstadisticas = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { fechaInicio, fechaFin } = req.query;

    const whereCondition: any = {
      tenant_id: tenantId,
    };

    if (fechaInicio && fechaFin) {
      whereCondition.fecha = {
        gte: new Date(fechaInicio as string),
        lte: new Date(fechaFin as string),
      };
    }

    const gastos = await prisma.gastos.findMany({
      where: whereCondition,
      include: {
        tipos_gasto: true,
      },
    });

    // Calcular estadísticas
    const totalGastos = gastos.reduce((sum, g) => sum + Number(g.monto), 0);
    
    const gastosPorTipo = gastos.reduce((acc: any, g) => {
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
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};