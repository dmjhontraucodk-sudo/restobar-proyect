import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { prisma } from '@shared/database/prisma.service';
import axios from 'axios';

/**
 * Genera un ticket PDF configurable para un pedido web
 */
export const ticketController = {
    async generateTicket(req: Request, res: Response) : Promise<any> {
        try {
            const { numero_pedido } = req.params;

            // 1. Buscar el pedido
            const pedido = await prisma.webpedidos.findFirst({
                where: { numero_pedido },
                include: {
                    webpedidos_detalles: {
                        include: {
                            productos: true
                        }
                    },
                    tenants: {
                        select: {
                            nombre_empresa: true
                        }
                    }
                }
            });

            if (!pedido) {
                return res.status(404).json({ error: 'Pedido no encontrado' });
            }

            // 2. Obtener configuración del tenant
            const tenantConfig = await prisma.tenant_config.findUnique({
                where: { tenant_id: pedido.tenant_id },
                select: {
                    nombre_negocio: true,
                    logo_url: true,
                    yape_qr_url: true,
                    yape_numero: true,
                    plin_qr_url: true,
                    plin_numero: true,
                    acepta_yape: true,
                    acepta_plin: true,
                    ticket_formato: true,
                    ticket_mostrar_logo: true,
                    ticket_incluir_qr: true,
                    ticket_mostrar_metodo: true,
                    ticket_pie_mensaje: true,
                    tiempo_prep_web: true,
                }
            });

            // 3. Determinar ancho según configuración
            const ticketWidth = tenantConfig?.ticket_formato === '58mm' ? 164.41 : 226.77; 
            const maxWidth = ticketWidth - 40;

            // 4. Crear documento PDF
            const doc = new PDFDocument({
                size: [ticketWidth, 841.89], 
                margins: { top: 20, bottom: 20, left: 20, right: 20 }
            });

            // 5. Configurar respuesta HTTP
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="ticket-${numero_pedido}.pdf"`);
            doc.pipe(res);

            let yPosition = 20;

            const downloadImage = async (url: string): Promise<Buffer | null> => {
                try {
                    const response = await axios.get(url, { responseType: 'arraybuffer' });
                    return Buffer.from(response.data);
                } catch (error) {
                    console.error('Error descargando imagen:', error);
                    return null;
                }
            };

            // LOGO
            if (tenantConfig?.ticket_mostrar_logo && tenantConfig?.logo_url) {
                const logoBuffer = await downloadImage(tenantConfig.logo_url);
                if (logoBuffer) {
                    try {
                        const logoSize = 60;
                        const logoX = (ticketWidth - logoSize) / 2;
                        doc.image(logoBuffer, logoX, yPosition, {
                            fit: [logoSize, logoSize],
                            align: 'center',
                            valign: 'center'
                        });
                        yPosition += logoSize + 15; 
                    } catch (error) {
                        console.error('Error insertando logo:', error);
                    }
                }
            }

            // HEADER
            doc.font('Helvetica-Bold')
            .fontSize(14) 
            .text(tenantConfig?.nombre_negocio || 'RESTAURANTE', 20, yPosition, {
                width: maxWidth,
                align: 'center'
            });
            yPosition += 25; 

            doc.fontSize(10)
            .text('TICKET DE PEDIDO', 20, yPosition, {
                width: maxWidth,
                align: 'center'
            });
            yPosition += 18; 

            // Fecha y hora
            doc.font('Helvetica')
            .fontSize(8)
            .text(new Date(pedido.created_at).toLocaleString('es-PE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }), 20, yPosition, {
                width: maxWidth,
                align: 'center'
            });
            yPosition += 18; 

            // Línea
            doc.moveTo(20, yPosition)
            .lineTo(ticketWidth - 20, yPosition)
            .stroke();
            yPosition += 15; 

            // NÚMERO DE PEDIDO
            doc.font('Helvetica-Bold')
            .fontSize(11)
            .text(`Pedido #${pedido.numero_pedido}`, 20, yPosition, {
                width: maxWidth,
                align: 'center'
            });
            yPosition += 25; 

            doc.moveTo(20, yPosition)
            .lineTo(ticketWidth - 20, yPosition)
            .stroke();
            yPosition += 15; 

            // DATOS DEL CLIENTE
            doc.font('Helvetica-Bold')
            .fontSize(9)
            .text('DATOS DEL CLIENTE', 20, yPosition, {
                width: maxWidth,
                align: 'left'
            });
            yPosition += 12;

            doc.font('Helvetica')
            .fontSize(8);

            doc.text(`Cliente: ${pedido.cliente_nombre}`, 20, yPosition, { width: maxWidth, align: 'left' });
            yPosition += 12;

            doc.text(`Telefono: ${pedido.cliente_telefono}`, 20, yPosition, { width: maxWidth, align: 'left' });
            yPosition += 12;

            if (pedido.cliente_email) {
                doc.text(`Email: ${pedido.cliente_email}`, 20, yPosition, { width: maxWidth, align: 'left' });
                yPosition += 12;
            }

            yPosition += 5;

            // DIRECCIÓN DE ENTREGA
            const isDelivery = pedido.tipo_pedido === 'EntregaDomicilio';
            if (isDelivery && pedido.direccion_entrega) {
                doc.moveTo(20, yPosition).lineTo(ticketWidth - 20, yPosition).stroke();
                yPosition += 10;

                doc.font('Helvetica-Bold').fontSize(9).text('DIRECCION DE ENTREGA:', 20, yPosition, { width: maxWidth, align: 'left' });
                yPosition += 12;

                doc.font('Helvetica').fontSize(8).fillColor('black').text(pedido.direccion_entrega, 20, yPosition, { width: maxWidth, align: 'left' });
                yPosition += 15;

                if (pedido.instrucciones_entrega) {
                    doc.font('Helvetica-Bold').fontSize(8).text('Instrucciones:', 20, yPosition, { width: maxWidth, align: 'left' });
                    yPosition += 10;
                    doc.font('Helvetica').fontSize(8).text(pedido.instrucciones_entrega, 20, yPosition, { width: maxWidth, align: 'left' });
                    yPosition += 15;
                }
                yPosition += 5;
            }

            doc.moveTo(20, yPosition).lineTo(ticketWidth - 20, yPosition).stroke();
            yPosition += 10;

            // PRODUCTOS
            doc.font('Helvetica-Bold').fontSize(9).text('PRODUCTOS', 20, yPosition, { width: maxWidth, align: 'left' });
            yPosition += 15;

            doc.font('Helvetica').fontSize(8);

            for (const detalle of pedido.webpedidos_detalles) {
                const productoText = `${detalle.cantidad}x ${detalle.productos.nombre}`;
                const precio = `S/ ${Number(detalle.subtotal).toFixed(2)}`;

                doc.text(productoText, 20, yPosition, { width: maxWidth - 50, align: 'left', continued: false });
                doc.text(precio, ticketWidth - 70, yPosition, { width: 50, align: 'right' });
                yPosition += 12;
            }

            yPosition += 5;
            doc.moveTo(20, yPosition).lineTo(ticketWidth - 20, yPosition).stroke();
            yPosition += 10;

            // TOTALES
            doc.font('Helvetica').fontSize(8);
            doc.text('Subtotal:', 20, yPosition, { width: maxWidth - 50, align: 'left', continued: false });
            doc.text(`S/ ${Number(pedido.subtotal).toFixed(2)}`, ticketWidth - 70, yPosition, { width: 50, align: 'right' });
            yPosition += 12;

            if (pedido.costo_envio && Number(pedido.costo_envio) > 0) {
                doc.text('Envio:', 20, yPosition, { width: maxWidth - 50, align: 'left', continued: false });
                doc.text(`S/ ${Number(pedido.costo_envio).toFixed(2)}`, ticketWidth - 70, yPosition, { width: 50, align: 'right' });
                yPosition += 12;
            }

            yPosition += 5;
            doc.font('Helvetica-Bold').fontSize(10);
            doc.text('TOTAL:', 20, yPosition, { width: maxWidth - 50, align: 'left', continued: false });
            doc.text(`S/ ${Number(pedido.total).toFixed(2)}`, ticketWidth - 70, yPosition, { width: 50, align: 'right' });
            yPosition += 20;

            doc.moveTo(20, yPosition).lineTo(ticketWidth - 20, yPosition).stroke();
            yPosition += 2;
            doc.moveTo(20, yPosition).lineTo(ticketWidth - 20, yPosition).stroke();
            yPosition += 10;

            // MÉTODO DE PAGO
            if (tenantConfig?.ticket_mostrar_metodo) {
                doc.font('Helvetica-Bold').fontSize(9).text('METODO DE PAGO', 20, yPosition, { width: maxWidth, align: 'center' });
                yPosition += 12;
                doc.font('Helvetica').fontSize(8).text('Pago contra entrega', 20, yPosition, { width: maxWidth, align: 'center' });
                yPosition += 15;
                doc.moveTo(20, yPosition).lineTo(ticketWidth - 20, yPosition).stroke();
                yPosition += 10;
            }

            // PIE DE PÁGINA
            if (tenantConfig?.ticket_pie_mensaje) {
                doc.font('Helvetica').fontSize(8).text(tenantConfig.ticket_pie_mensaje, 20, yPosition, { width: maxWidth, align: 'center' });
                yPosition += 15;
            }

            if (tenantConfig?.tiempo_prep_web) {
                doc.font('Helvetica').fontSize(7).text(`Tiempo estimado: ${tenantConfig.tiempo_prep_web} min`, 20, yPosition, { width: maxWidth, align: 'center' });
                yPosition += 12;
            }

            doc.font('Helvetica-Bold').fontSize(9).text('Gracias por su compra!', 20, yPosition, { width: maxWidth, align: 'center' });
            yPosition += 15;

            doc.font('Helvetica').fontSize(7).text('*** COMPROBANTE ***', 20, yPosition, { width: maxWidth, align: 'center' });

            doc.end();

        } catch (error: any) {
            console.error('Error generando ticket:', error);
            if (!res.headersSent) {
                return res.status(500).json({
                    error: 'Error generando ticket',
                    message: error.message
                });
            }
        }
    }
};
