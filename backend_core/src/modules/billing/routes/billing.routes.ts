import { Router } from 'express';
import { billingController } from '../controllers/billing.controller';

const router = Router();

// Route to generate an invoice (boleta or factura)
router.get(
    '/generate-invoice/:orderId',
    billingController.generateInvoice
);

export default router;
