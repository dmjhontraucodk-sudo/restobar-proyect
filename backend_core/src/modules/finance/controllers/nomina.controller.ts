import { Response } from 'express';
import { nominaService } from '../services/nomina.service';
import { AuthRequest } from '@shared/middleware/auth.middleware';
import { RequestWithTenant } from '@shared/middleware/tenant.middleware';
import { z } from 'zod';
import { pagos_metodo_pago } from '@prisma/client';

type FinanceRequest = AuthRequest & RequestWithTenant;

const pagarNominaSchema = z.object({
    metodo_pago: z.nativeEnum(pagos_metodo_pago)
});

export const nominaController = {
    async getNomina(req: FinanceRequest, res: Response) : Promise<any> {
        try {
            const tenantId = req.user?.tenant_id;
            const userId = req.user?.id;
            if (!tenantId || !userId) return res.status(403).json({ error: 'Acceso prohibido' });

            const usuarioActual = await nominaService.getEmpleadoById(userId);
            if (!usuarioActual) return res.status(404).json({ error: 'Usuario no encontrado' });

            const puedeVer = usuarioActual.es_propietario || usuarioActual.roles.nombre === 'Gerente';
            if (!puedeVer) return res.status(403).json({ error: 'No tienes permisos' });

            const result = await nominaService.getNomina(tenantId);
            res.json({ success: true, ...result });
        } catch (error: any) {
            console.error('Error en getNomina:', error);
            res.status(500).json({ success: false, error: 'Error interno' });
        }
    },

    async getEstadisticasNomina(req: FinanceRequest, res: Response) : Promise<any> {
        try {
            const tenantId = req.user?.tenant_id;
            const userId = req.user?.id;
            if (!tenantId || !userId) return res.status(403).json({ error: 'Acceso prohibido' });

            const usuarioActual = await nominaService.getEmpleadoById(userId);
            if (!usuarioActual) return res.status(404).json({ error: 'Usuario no encontrado' });

            const puedeVer = usuarioActual.es_propietario || usuarioActual.roles.nombre === 'Gerente';
            if (!puedeVer) return res.status(403).json({ error: 'No tienes permisos' });

            const estadisticas = await nominaService.getEstadisticasNomina(tenantId);
            res.json({ success: true, estadisticas });
        } catch (error: any) {
            console.error('Error en getEstadisticasNomina:', error);
            res.status(500).json({ success: false, error: 'Error interno' });
        }
    },

    async calcularPagoEmpleado(req: FinanceRequest, res: Response) : Promise<any> {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = parseInt(req.params.id);
            if (!tenantId || isNaN(empleadoId)) return res.status(400).json({ error: 'Datos inválidos' });

            const calculo = await nominaService.calcularPago(tenantId, empleadoId);
            res.json(calculo);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error al calcular nómina' });
        }
    },

    async pagarNomina(req: FinanceRequest, res: Response) : Promise<any> {
        try {
            const tenantId = req.user?.tenant_id;
            const empleadoId = parseInt(req.params.id);
            const usuarioPagadorId = req.user?.id;

            if (!tenantId || !usuarioPagadorId || isNaN(empleadoId)) {
                return res.status(400).json({ error: 'Datos de empleado o usuario pagador inválidos.' });
            }

            const validation = pagarNominaSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({ error: 'Método de pago inválido', details: validation.error.issues });
            }
            const { metodo_pago } = validation.data;

            // Permisos: Solo administrador o gerente pueden pagar nómina
            const usuarioActual = await nominaService.getEmpleadoById(usuarioPagadorId);
            if (!usuarioActual || (!usuarioActual.es_propietario && usuarioActual.roles.nombre !== 'Gerente')) {
                return res.status(403).json({ error: 'No tienes permisos para pagar nómina.' });
            }

            const result = await nominaService.pagarNomina(tenantId, empleadoId, usuarioPagadorId, metodo_pago);
            res.status(200).json({ success: true, message: result.message, montoPagado: result.montoPagado });

        } catch (error: any) {
            console.error('Error al pagar nómina:', error);
            res.status(500).json({ success: false, error: error.message || 'Error interno del servidor al pagar nómina.' });
        }
    }
};
