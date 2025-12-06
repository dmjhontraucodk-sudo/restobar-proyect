import { Response } from 'express';
import { z } from 'zod';
import { cajaService } from '../services/caja.service';
import { AuthRequest } from '@shared/middleware/auth.middleware';
import { RequestWithTenant } from '@shared/middleware/tenant.middleware';
// Importa el tipo correcto desde Prisma
import type { cajas_movimientos } from '@prisma/client';

type FinanceRequest = AuthRequest & RequestWithTenant;

const abrirCajaSchema = z.object({
    monto_inicial: z.number().min(0),
    observaciones: z.string().optional(),
});

const cerrarCajaSchema = z.object({
    monto_real: z.number().min(0),
    observaciones: z.string().optional(),
});

const movimientoSchema = z.object({
    tipo: z.enum(['INGRESO', 'EGRESO']),
    concepto: z.string().min(1),
    monto: z.number().positive(),
    metodo_pago: z.enum(['Efectivo', 'Tarjeta', 'Transferencia', 'Otro']),
    notas: z.string().optional(),
});

export const cajaController = {
    async getEstadoCaja(req: FinanceRequest, res: Response): Promise<any> {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = req.user?.id;
            if (!tenantId || !empleadoId) return res.status(403).json({ error: 'Acceso no autorizado' });

            const cajaAbierta = await cajaService.getCajaAbierta(tenantId, empleadoId);
            if (!cajaAbierta) return res.status(404).json({ error: 'No tienes caja abierta', message: 'Debes abrir una caja antes de realizar operaciones' });

            const movimientos = cajaAbierta.movimientos;
            
            // USANDO EL TIPO CORRECTO DE PRISMA
            const ingresos = movimientos.filter((m: cajas_movimientos) => m.tipo === 'INGRESO')
                .reduce((sum: number, m: cajas_movimientos) => sum + Number(m.monto), 0);
            
            const egresos = movimientos.filter((m: cajas_movimientos) => m.tipo === 'EGRESO')
                .reduce((sum: number, m: cajas_movimientos) => sum + Number(m.monto), 0);
            
            const saldoTeorico = Number(cajaAbierta.monto_inicial) + ingresos - egresos;

            return res.json({
                caja: cajaAbierta,
                resumen: {
                    inicial: Number(cajaAbierta.monto_inicial),
                    ingresos,
                    egresos,
                    saldo_teorico: saldoTeorico
                }
            });
        } catch (error: any) {
            console.error('Error en getEstadoCaja:', error);
            return res.status(500).json({ error: 'Error al obtener estado de caja' });
        }
    },

    async abrirCaja(req: FinanceRequest, res: Response): Promise<any> {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = req.user?.id;
            if (!tenantId || !empleadoId) return res.status(403).json({ error: 'Acceso no autorizado' });

            const validation = abrirCajaSchema.safeParse(req.body);
            if (!validation.success) return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });

            const { monto_inicial, observaciones } = validation.data;
            const nuevaCaja = await cajaService.abrirCaja(tenantId, empleadoId, monto_inicial, observaciones);

            return res.status(201).json({ success: true, message: 'Caja abierta exitosamente', caja: nuevaCaja });
        } catch (error: any) {
            if (error.message === 'Ya tienes una caja abierta') return res.status(400).json({ error: error.message });
            console.error('Error en abrirCaja:', error);
            return res.status(500).json({ error: 'Error al abrir caja' });
        }
    },

    async registrarMovimiento(req: FinanceRequest, res: Response): Promise<any> {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = req.user?.id;
            if (!tenantId || !empleadoId) return res.status(403).json({ error: 'Acceso no autorizado' });

            const validation = movimientoSchema.safeParse(req.body);
            if (!validation.success) return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });

            await cajaService.registrarMovimiento(tenantId, empleadoId, validation.data);
            return res.json({ success: true, message: 'Movimiento registrado exitosamente' });
        } catch (error: any) {
            console.error('Error en registrarMovimiento:', error);
            return res.status(500).json({ error: error.message || 'Error al registrar movimiento' });
        }
    },

    async cerrarCaja(req: FinanceRequest, res: Response): Promise<any> {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = req.user?.id;
            if (!tenantId || !empleadoId) return res.status(403).json({ error: 'Acceso no autorizado' });

            const validation = cerrarCajaSchema.safeParse(req.body);
            if (!validation.success) return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });

            const cajaCerrada = await cajaService.cerrarCaja(tenantId, empleadoId, validation.data.monto_real, validation.data.observaciones);
            return res.json({ success: true, message: 'Caja cerrada exitosamente', caja: cajaCerrada });
        } catch (error: any) {
            console.error('Error en cerrarCaja:', error);
            return res.status(500).json({ error: error.message || 'Error al cerrar caja' });
        }
    },

    async getHistorial(req: FinanceRequest, res: Response): Promise<any> {
        try {
            const tenantId = req.user?.tenant_id;
            if (!tenantId) return res.status(403).json({ error: 'Acceso no autorizado' });

            const historial = await cajaService.getHistorial(tenantId, req.query);
            return res.json(historial);
        } catch (error: any) {
            console.error('Error en getHistorial:', error);
            return res.status(500).json({ error: 'Error al obtener historial' });
        }
    }
};