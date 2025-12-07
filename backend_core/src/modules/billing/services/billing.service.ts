import { prisma } from '@shared/database/prisma.service';
import PDFDocument from 'pdfkit';
import axios from 'axios';

async function fetchImage(url: string): Promise<Buffer> {
    const response = await axios.get(url, {
        responseType: 'arraybuffer'
    });
    return response.data;
}

export const billingService = {
    async generateInvoice(orderId: number, type: 'boleta' | 'factura'): Promise<Buffer> {
        // Incluimos todas las relaciones necesarias
        const order = await prisma.ordenes.findUnique({
            where: { id: orderId },
            include: {
                ordendetalles: {
                    include: {
                        productos: true,
                    },
                },
                mesas: true,
                empleados: true,
                tenants: {
                    include: {
                        tenant_config: true,
                    }
                }
            },
        });

        if (!order) {
            throw new Error('Orden no encontrada.');
        }

        const tenantConfig = order.tenants.tenant_config;
        const tenant = order.tenants;

        // --- VALIDACIÓN CRÍTICA (REQUISITO 3) ---
        if (type === 'factura' || type === 'boleta') {
            if (!order.cliente_documento || !order.cliente_razon_social) {
                throw new Error(`Datos de cliente (RUC/DNI y Razón Social) son obligatorios para emitir una ${type}.`);
            }
        }
        // --- FIN VALIDACIÓN ---

        const doc = new PDFDocument({ size: 'A4', margin: 50 });

        // Header
        if (tenantConfig?.logo_url) {
            try {
                const logoImage = await fetchImage(tenantConfig.logo_url);
                doc.image(logoImage, 50, 45, { width: 50 });
            } catch (error) {
                console.error("No se pudo obtener el logo:", error);
            }
        }
        
        const rucEmisor = tenantConfig?.ruc_emisor || 'N/A';
        
        doc.fontSize(20).text(tenantConfig?.nombre_negocio || tenant.nombre_empresa, 110, 57);
        doc.fontSize(10).text(`RUC: ${rucEmisor}`, 110, 75);
        doc.fontSize(10).text(tenantConfig?.direccion || 'Sin Dirección', 200, 65, { align: 'right' });
        doc.fontSize(10).text(tenantConfig?.telefono_principal || 'Sin Teléfono', 200, 80, { align: 'right' });

        // Invoice Info
        doc.moveDown();
        const docTypeTitle = type === 'factura' ? 'FACTURA ELECTRÓNICA' : 'BOLETA ELECTRÓNICA';
        doc.fontSize(16).text(docTypeTitle, 50, 120);
        doc.fontSize(10).text(`Serie/Nro: ${order.serie_comprobante || 'PENDIENTE'}-${order.numero_comprobante || '0'}`, 50, 140);
        doc.text(`Fecha: ${order.created_at.toLocaleDateString()}`, 50, 155);

        // Client Info
        doc.moveDown();
        doc.fontSize(12).text('Cliente:', 50, 180);
        
        doc.text(`Nombre/Razón Social: ${order.cliente_razon_social || 'Público General'}`, 50, 195);
        doc.text(`DNI/RUC: ${order.cliente_documento || '00000000'}`, 50, 210);

        // Table Header
        const tableTop = 250;
        doc.fontSize(10);
        doc.text('Product', 50, tableTop);
        doc.text('Quantity', 250, tableTop, { width: 90, align: 'right' });
        doc.text('Unit Price', 350, tableTop, { width: 90, align: 'right' });
        doc.text('Total', 0, tableTop, { align: 'right' });

        // Table Rows
        let i = 0;
        for (const item of order.ordendetalles) {
            const y = tableTop + 25 + (i * 25);
            doc.text(item.productos.nombre, 50, y);
            doc.text(item.cantidad.toString(), 250, y, { width: 90, align: 'right' });
            doc.text(item.precio_unitario.toFixed(2), 350, y, { width: 90, align: 'right' });
            doc.text((item.cantidad * Number(item.precio_unitario)).toFixed(2), 0, y, { align: 'right' });
            i++;
        }
        
        // Totals
        const totalsTop = tableTop + 25 + (order.ordendetalles.length * 25) + 10;
        doc.fontSize(10);
        doc.text(`Subtotal: ${Number(order.subtotal).toFixed(2)}`, 400, totalsTop);
        doc.text(`Discount: ${Number(order.descuento).toFixed(2)}`, 400, totalsTop + 15);
        doc.font('Helvetica-Bold').text(`Total: ${Number(order.total).toFixed(2)}`, 400, totalsTop + 30);
        
        // Footer
        doc.fontSize(8).text(tenantConfig?.ticket_pie_mensaje || '¡Gracias por su visita! Comprobante emitido electrónicamente.', 50, 750, { align: 'center', width: 500 });
        
        doc.end();

        return new Promise<Buffer>((resolve, reject) => {
            const buffers: any[] = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                resolve(Buffer.concat(buffers));
            });
            doc.on('error', reject);
        });
    },
};