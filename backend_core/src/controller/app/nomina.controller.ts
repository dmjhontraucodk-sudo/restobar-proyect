// backend_core/src/controller/app/nomina.controller.ts
import { Request, Response } from 'express';
import { nominaService } from '../../services/nomina.service';

// --- Interfaz de Autenticación ---
interface AuthRequest extends Request {
    user?: {
        id: number;
        tenant_id: number;
        rol_id: number;
        email: string;
        es_propietario?: boolean;
    };
    tenant?: {
        id: number;
        subdominio: string;
    };
}

// ==================== CONTROLLER ====================

export const nominaController = {
    
    /**
     * GET /api/dashboard/nomina - Obtiene lista de salarios (Administrador y Gerente)
     */
    async getNomina(req: AuthRequest, res: Response) {
        try {
            const tenantId = req.user?.tenant_id;
            const usuarioActualId = req.user?.id;

            if (!tenantId || !usuarioActualId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }

            // Obtener empleado actual para validar permisos
            const usuarioActual = await nominaService.getEmpleadoById(usuarioActualId);

            if (!usuarioActual) {
                return res.status(404).json({ error: 'Usuario no encontrado.' });
            }

            // Solo Administrador (propietario) y Gerente pueden ver salarios
            const puedeVerSalarios = usuarioActual.es_propietario || 
                                    usuarioActual.roles.nombre === 'Gerente';

            if (!puedeVerSalarios) {
                return res.status(403).json({ 
                    error: 'No tienes permisos para ver la información de nómina.' 
                });
            }

            // Obtener nómina
            const nomina = await nominaService.getNomina(tenantId);

            return res.status(200).json({
                success: true,
                nomina: nomina.empleados,
                estadisticas: nomina.estadisticas
            });

        } catch (error: any) {
            console.error('Error en getNomina:', error);
            return res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor.' 
            });
        }
    },

    /**
     * GET /api/dashboard/nomina/estadisticas - Obtiene estadísticas de nómina
     */
    async getEstadisticasNomina(req: AuthRequest, res: Response) {
        try {
            const tenantId = req.user?.tenant_id;
            const usuarioActualId = req.user?.id;

            if (!tenantId || !usuarioActualId || tenantId !== req.tenant?.id) {
                return res.status(403).json({ error: 'Acceso prohibido.' });
            }

            const usuarioActual = await nominaService.getEmpleadoById(usuarioActualId);

            if (!usuarioActual) {
                return res.status(404).json({ error: 'Usuario no encontrado.' });
            }

            const puedeVerSalarios = usuarioActual.es_propietario || 
                                    usuarioActual.roles.nombre === 'Gerente';

            if (!puedeVerSalarios) {
                return res.status(403).json({ 
                    error: 'No tienes permisos para ver estadísticas de nómina.' 
                });
            }

            const estadisticas = await nominaService.getEstadisticasNomina(tenantId);

            return res.status(200).json({
                success: true,
                estadisticas
            });

        } catch (error: any) {
            console.error('Error en getEstadisticasNomina:', error);
            return res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor.' 
            });
        }
    },
};