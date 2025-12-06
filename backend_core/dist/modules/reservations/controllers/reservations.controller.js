"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reservationsController = void 0;
const reservations_service_1 = require("../services/reservations.service");
const mesas_service_1 = require("@modules/tables/services/mesas.service");
const email_service_1 = require("@core/email/email.service");
const zod_1 = require("zod");
// ✅ ACTUALIZADO: Agregar mesa_id al esquema de validación
const createReservationSchema = zod_1.z.object({
    cliente_nombre: zod_1.z.string().min(1, "El nombre es requerido."),
    cliente_email: zod_1.z.string().email("Email inválido.").optional().or(zod_1.z.literal('')),
    cliente_telefono: zod_1.z.string().min(6, "El teléfono es requerido."),
    mesa_id: zod_1.z.number().int().nullable().optional(), // ✅ NUEVO: Acepta mesa_id
    fecha_hora: zod_1.z.string().refine((val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
    }, "Formato de fecha y hora inválido."), // ✅ CORREGIDO: Cerrar correctamente el refine
    cantidad_personas: zod_1.z.number().int().min(1, "Debe reservar para al menos una persona."),
    notas: zod_1.z.string().optional(),
});
exports.reservationsController = {
    // ==================== RUTAS PÚBLICAS ====================
    /**
    * Crea una nueva reserva desde el sitio web público.
    * POST /api/web/reservations
    */
    async createReservation(req, res) {
        try {
            const tenant = req.tenant;
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
            const newReservation = await reservations_service_1.reservationsService.createReservation(tenant.id, reservationData, mesa_id // ✅ NUEVO: Pasar mesa_id como tercer argumento
            );
            res.status(201).json({
                success: true,
                message: 'Reserva solicitada exitosamente. Esperando confirmación.',
                reservationId: newReservation.id
            });
        }
        catch (error) {
            console.error('Error en createReservation:', error);
            res.status(500).json({ error: error.message || 'Error interno del servidor.' });
        }
    },
    /**
     * ✅ NUEVO: Obtiene mesas disponibles (estado "Libre")
     * GET /api/web/mesas/disponibles
     */
    async getAvailableMesas(req, res) {
        try {
            const tenant = req.tenant;
            if (!tenant) {
                return res.status(404).json({ error: 'Servicio no disponible. Tenant requerido.' });
            }
            // Obtener mesas disponibles
            const availableMesas = await mesas_service_1.mesasService.getAvailableMesas(tenant.id);
            console.log(`✅ Mesas libres encontradas para tenant ${tenant.id}:`, availableMesas.length);
            console.log('Mesas:', JSON.stringify(availableMesas, null, 2)); // ✅ Debug
            // ✅ IMPORTANTE: Retornar SOLO el array, sin envolver en objeto
            return res.json(availableMesas);
        }
        catch (error) {
            console.error('❌ Error en getAvailableMesas:', error);
            return res.status(500).json({ error: error.message || 'Error interno del servidor.' });
        }
    },
    async getReservations(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const { estado } = req.query;
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso no autorizado.' });
            }
            const filters = {};
            if (estado && typeof estado === 'string' && Object.values(reservations_service_1.reservas_estado).includes(estado)) {
                filters.estado = estado;
            }
            const reservations = await reservations_service_1.reservationsService.getReservationsByTenant(tenantId, filters);
            res.json(reservations);
        }
        catch (error) {
            console.error('Error en getReservations:', error);
            res.status(500).json({ error: 'Error interno del servidor.' });
        }
    },
    async updateReservationStatus(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const reservationId = parseInt(req.params.id);
            const { nuevo_estado, mesa_id } = req.body;
            if (!tenantId) {
                return res.status(403).json({ error: 'Acceso no autorizado.' });
            }
            if (!nuevo_estado || !Object.values(reservations_service_1.reservas_estado).includes(nuevo_estado)) {
                return res.status(400).json({ error: 'Estado de reserva inválido.' });
            }
            const updatedReservation = await reservations_service_1.reservationsService.updateReservationStatus(tenantId, reservationId, nuevo_estado, mesa_id);
            // Envío de Correo (Resend)
            if (updatedReservation.cliente_email) {
                if (nuevo_estado === reservations_service_1.reservas_estado.Confirmada) {
                    await email_service_1.emailService.sendReservationConfirmation(updatedReservation);
                }
                else if (nuevo_estado === reservations_service_1.reservas_estado.Cancelada) {
                    await email_service_1.emailService.sendReservationCancellation(updatedReservation);
                }
            }
            res.json({
                success: true,
                message: `Reserva actualizada a ${nuevo_estado}.`,
                reservation: updatedReservation
            });
        }
        catch (error) {
            console.error('Error en updateReservationStatus:', error);
            res.status(500).json({ error: error.message || 'Error interno del servidor.' });
        }
    },
};
