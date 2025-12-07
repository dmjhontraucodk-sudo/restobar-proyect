import { Request, Response } from 'express';
import { billingService } from '../services/billing.service';

export const billingController = {
    // Añadimos Promise<any> para satisfacer el tipo implícito de la función async del controlador
    async generateInvoice(req: Request, res: Response): Promise<any> { 
        try {
            const { orderId } = req.params;
            const { type } = req.query; // 'boleta' or 'factura'

            if (!orderId || !type) {
                return res.status(400).json({ message: 'Order ID and type are required' });
            }

            const pdfBuffer = await billingService.generateInvoice(parseInt(orderId, 10), type as 'boleta' | 'factura');

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=invoice.pdf`);
            
            res.send(pdfBuffer);
            
            // ✅ CORRECCIÓN TS7030: Asegura que la función termine después de enviar la respuesta.
            return; 

        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    },
};