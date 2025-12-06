"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ticket_controller_1 = require("../controllers/ticket.controller");
const router = (0, express_1.Router)();
// Ruta PÚBLICA para descargar tickets (no requiere auth, solo conocer el número de pedido)
router.get('/:numero_pedido/ticket', ticket_controller_1.ticketController.generateTicket);
exports.default = router;
