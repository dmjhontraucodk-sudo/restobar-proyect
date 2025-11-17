import { Request, Response } from 'express';
import { reservationsService, reservas_estado } from '../../services/reservations.service';
import { mesasService } from '../../services/mesas.service'; // ✅ IMPORTAR mesasService
import { emailService } from '../../services/email.service';
import { z } from 'zod';

interface AuthRequest extends Request {
 user?: {
  id: number;
  tenant_id: number;
  email: string;
  rol_id: number;
 };
 tenant?: {
  id: number;
  subdominio: string;
  configuracion: any;
 };
}

// ✅ ACTUALIZADO: Agregar mesa_id al esquema de validación
const createReservationSchema = z.object({
  cliente_nombre: z.string().min(1, "El nombre es requerido."),
  cliente_email: z.string().email("Email inválido.").optional().or(z.literal('')),
  cliente_telefono: z.string().min(6, "El teléfono es requerido."),
  mesa_id: z.number().int().nullable().optional(), // ✅ NUEVO: Acepta mesa_id
  fecha_hora: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, "Formato de fecha y hora inválido."), // ✅ CORREGIDO: Cerrar correctamente el refine
  cantidad_personas: z.number().int().min(1, "Debe reservar para al menos una persona."),
  notas: z.string().optional(),
});

export const reservationsController = {
  // ==================== RUTAS PÚBLICAS ====================

  /**
  * Crea una nueva reserva desde el sitio web público.
  * POST /api/web/reservations
  */
  async createReservation(req: Request, res: Response) {
    try {
      const tenant = (req as AuthRequest).tenant;
      
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant no encontrado.' });
      }

      const validation = createReservationSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Datos de reserva inválidos.', 
          details: validation.error.issues 
        });
      }

      // ✅ ACTUALIZADO: Desestructurar mesa_id del resto de los datos
      const { mesa_id, ...reservationData } = validation.data;

      // Creación en el servicio (automáticamente en estado 'Pendiente')
      const newReservation = await reservationsService.createReservation(
        tenant.id, 
        reservationData,
        mesa_id // ✅ NUEVO: Pasar mesa_id como tercer argumento
      );

      res.status(201).json({
        success: true,
        message: 'Reserva solicitada exitosamente. Esperando confirmación.',
        reservationId: newReservation.id
      });

    } catch (error: any) {
      console.error('Error en createReservation:', error);
      res.status(500).json({ error: error.message || 'Error interno del servidor.' });
    }
  },

  /**
   * ✅ NUEVO: Obtiene mesas disponibles (estado "Libre")
   * GET /api/web/mesas/disponibles
   */
  async getAvailableMesas(req: Request, res: Response) {
      try {
          const tenant = (req as AuthRequest).tenant;
          
          if (!tenant) {
              return res.status(404).json({ error: 'Servicio no disponible. Tenant requerido.' });
          }

          // Obtener mesas disponibles
          const availableMesas = await mesasService.getAvailableMesas(tenant.id);

          console.log(`✅ Mesas libres encontradas para tenant ${tenant.id}:`, availableMesas.length);
          console.log('Mesas:', JSON.stringify(availableMesas, null, 2)); // ✅ Debug

          // ✅ IMPORTANTE: Retornar SOLO el array, sin envolver en objeto
          return res.json(availableMesas);

      } catch (error: any) {
          console.error('❌ Error en getAvailableMesas:', error);
          return res.status(500).json({ error: error.message || 'Error interno del servidor.' });
      }
  },

  async getReservations(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const { estado } = req.query;

      if (!tenantId) {
        return res.status(403).json({ error: 'Acceso no autorizado.' });
      }
      
      const filters: { estado?: reservas_estado } = {};
      if (estado && typeof estado === 'string' && Object.values(reservas_estado).includes(estado as reservas_estado)) {
        filters.estado = estado as reservas_estado;
      }
      
      const reservations = await reservationsService.getReservationsByTenant(tenantId, filters);

      res.json(reservations);

    } catch (error: any) {
      console.error('Error en getReservations:', error);
      res.status(500).json({ error: 'Error interno del servidor.' });
    }
  },

  async updateReservationStatus(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const reservationId = parseInt(req.params.id);
      const { nuevo_estado, mesa_id } = req.body;

      if (!tenantId) {
        return res.status(403).json({ error: 'Acceso no autorizado.' });
      }
      
      if (!nuevo_estado || !Object.values(reservas_estado).includes(nuevo_estado)) {
        return res.status(400).json({ error: 'Estado de reserva inválido.' });
      }

      const updatedReservation = await reservationsService.updateReservationStatus(
        tenantId,
        reservationId,
        nuevo_estado as reservas_estado,
        mesa_id
      );

      // Envío de Correo (Resend)
      if (updatedReservation.cliente_email) {
        if (nuevo_estado === reservas_estado.Confirmada) {
          await emailService.sendReservationConfirmation(updatedReservation);
        } else if (nuevo_estado === reservas_estado.Cancelada) {
          await emailService.sendReservationCancellation(updatedReservation);
        }
      }

      res.json({
        success: true,
        message: `Reserva actualizada a ${nuevo_estado}.`,
        reservation: updatedReservation
      });
    } catch (error: any) {
      console.error('Error en updateReservationStatus:', error);
      res.status(500).json({ error: error.message || 'Error interno del servidor.' });
    }
  },
};