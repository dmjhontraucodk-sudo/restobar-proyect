import { Router } from 'express';
import { ticketController } from '../controllers/ticket.controller';

const router = Router();

// Ruta PÚBLICA para descargar tickets (no requiere auth, solo conocer el número de pedido)
router.get('/:numero_pedido/ticket', ticketController.generateTicket);

export default router;
