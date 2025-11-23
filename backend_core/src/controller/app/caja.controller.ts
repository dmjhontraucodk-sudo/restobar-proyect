import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { z } from 'zod';

// Definimos tipos manuales para evitar problemas de importación si Prisma no ha regenerado
type CajasTipoMov = 'INGRESO' | 'EGRESO';
type MetodoPago = 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Otro';

interface AuthRequest extends Request {
  user?: { id: number; tenant_id: number; };
  tenant?: { id: number; };
}

// --- 1. ABRIR CAJA ---
const abrirCajaSchema = z.object({
    monto_inicial: z.number().min(0),
    observaciones: z.string().optional()
});

export const abrirCaja = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.id;
        if (!tenantId || !userId) return res.status(403).json({ error: 'Acceso denegado' });

        const { monto_inicial, observaciones } = abrirCajaSchema.parse(req.body);

        // Verificar si ya tiene caja abierta
        const cajaAbierta = await prisma.cajas.findFirst({
            where: { tenant_id: tenantId, usuario_responsable_id: userId, estado: 'Abierta' }
        });

        if (cajaAbierta) return res.status(400).json({ error: 'Ya tienes una caja abierta.' });

        const nuevaCaja = await prisma.cajas.create({
            data: {
                tenant_id: tenantId,
                usuario_responsable_id: userId,
                monto_inicial,
                monto_esperado: monto_inicial, // Al inicio es igual al inicial
                monto_real: 0,
                estado: 'Abierta',
                observaciones
            }
        });

        res.status(201).json(nuevaCaja);
    } catch (error) {
        res.status(500).json({ error: 'Error al abrir caja' });
    }
};

// --- 2. OBTENER ESTADO DE CAJA ---
export const getEstadoCaja = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.id;
        
        // Buscamos la caja abierta del usuario
        const caja = await prisma.cajas.findFirst({
            where: { tenant_id: tenantId, usuario_responsable_id: userId, estado: 'Abierta' },
            include: {
                movimientos: {
                    orderBy: { fecha_hora: 'desc' },
                    take: 20 // Últimos 20 movimientos
                }
            }
        });

        if (!caja) return res.status(404).json({ message: 'No tienes caja abierta' });

        // Calcular totales en tiempo real
        const ingresos = await prisma.cajas_movimientos.aggregate({
            where: { caja_id: caja.id, tipo: 'INGRESO' },
            _sum: { monto: true }
        });
        const egresos = await prisma.cajas_movimientos.aggregate({
            where: { caja_id: caja.id, tipo: 'EGRESO' },
            _sum: { monto: true }
        });

        const totalIngresos = Number(ingresos._sum.monto || 0);
        const totalEgresos = Number(egresos._sum.monto || 0);
        const saldoActual = Number(caja.monto_inicial) + totalIngresos - totalEgresos;

        res.json({
            caja,
            resumen: {
                inicial: Number(caja.monto_inicial),
                ingresos: totalIngresos,
                egresos: totalEgresos,
                saldo_teorico: saldoActual
            }
        });

    } catch (error) {
        res.status(500).json({ error: 'Error al obtener caja' });
    }
};

// --- 3. REGISTRAR MOVIMIENTO MANUAL (Gastos menores / Retiros) ---
const movimientoSchema = z.object({
    tipo: z.enum(['INGRESO', 'EGRESO']),
    concepto: z.string().min(1),
    monto: z.number().positive(),
    metodo_pago: z.enum(['Efectivo', 'Tarjeta', 'Transferencia', 'Otro']),
    notas: z.string().optional()
});

export const registrarMovimientoCaja = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.id;
        
        const { tipo, concepto, monto, metodo_pago, notas } = movimientoSchema.parse(req.body);

        const caja = await prisma.cajas.findFirst({
            where: { tenant_id: tenantId, usuario_responsable_id: userId, estado: 'Abierta' }
        });

        if (!caja) return res.status(400).json({ error: 'Debes abrir caja antes de registrar movimientos.' });

        // Crear movimiento
        await prisma.$transaction([
            prisma.cajas_movimientos.create({
                data: {
                    tenant_id: tenantId!,
                    caja_id: caja.id,
                    usuario_id: userId!,
                    tipo: tipo as CajasTipoMov,
                    concepto,
                    monto,
                    metodo_pago: metodo_pago as MetodoPago,
                    notas
                }
            }),
            // Actualizamos el monto esperado de la caja
            prisma.cajas.update({
                where: { id: caja.id },
                data: {
                    monto_esperado: {
                        increment: tipo === 'INGRESO' ? monto : -monto
                    }
                }
            })
        ]);

        res.status(201).json({ message: 'Movimiento registrado' });

    } catch (error) {
        res.status(500).json({ error: 'Error al registrar movimiento' });
    }
};

// --- 4. CERRAR CAJA ---
const cerrarCajaSchema = z.object({
    monto_real: z.number().min(0), // Lo que contó el cajero
    observaciones: z.string().optional()
});

export const cerrarCaja = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.id;
        
        const { monto_real, observaciones } = cerrarCajaSchema.parse(req.body);

        const caja = await prisma.cajas.findFirst({
            where: { tenant_id: tenantId, usuario_responsable_id: userId, estado: 'Abierta' }
        });

        if (!caja) return res.status(400).json({ error: 'No hay caja abierta para cerrar.' });

        // Calcular diferencia final
        const diferencia = monto_real - Number(caja.monto_esperado);

        const cajaCerrada = await prisma.cajas.update({
            where: { id: caja.id },
            data: {
                estado: 'Cerrada',
                fecha_cierre: new Date(),
                monto_real,
                diferencia,
                observaciones
            }
        });

        res.json(cajaCerrada);

    } catch (error) {
        res.status(500).json({ error: 'Error al cerrar caja' });
    }
};

export const getHistorialCajas = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenant_id;
        if (!tenantId) return res.status(403).json({ error: 'Acceso denegado' });

        const { fechaInicio, fechaFin, usuario_id } = req.query;

        const whereClause: any = { 
            tenant_id: tenantId,
            estado: 'Cerrada' // Solo queremos ver las cerradas
        };

        // Filtros opcionales
        if (usuario_id) whereClause.usuario_responsable_id = parseInt(usuario_id as string);
        
        if (fechaInicio || fechaFin) {
            whereClause.fecha_apertura = {};
            if (fechaInicio) whereClause.fecha_apertura.gte = new Date(fechaInicio as string);
            // Para fecha fin, aseguramos que cubra todo el día
            if (fechaFin) {
                const end = new Date(fechaFin as string);
                end.setHours(23, 59, 59, 999);
                whereClause.fecha_apertura.lte = end;
            }
        }

        const historial = await prisma.cajas.findMany({
            where: whereClause,
            include: {
                empleados: {
                    select: { nombre: true, email: true }
                },
                // Opcional: Incluir movimientos si quieres ver el detalle profundo, 
                // pero para la lista general puede ser mucho peso.
                _count: {
                    select: { movimientos: true }
                }
            },
            orderBy: { fecha_apertura: 'desc' },
            take: 50 // Paginación simple
        });

        res.json(historial);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener historial' });
    }
};