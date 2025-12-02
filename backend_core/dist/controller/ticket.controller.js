"use strict";
// backend/src/controllers/ticket.controller.ts - VERSIÓN CORREGIDA
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTicket = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const prisma_1 = require("../lib/prisma");
const axios_1 = __importDefault(require("axios"));
/**
 * Genera un ticket PDF configurable para un pedido web
 * Endpoint: GET /api/web/orders/:numero_pedido/ticket
 */
const generateTicket = async (req, res) => {
    try {
        const { numero_pedido } = req.params;
        // 1. Buscar el pedido
        const pedido = await prisma_1.prisma.webpedidos.findFirst({
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
        const tenantConfig = await prisma_1.prisma.tenant_config.findUnique({
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
        const ticketWidth = tenantConfig?.ticket_formato === '58mm' ? 164.41 : 226.77; // 58mm o 80mm en puntos
        const maxWidth = ticketWidth - 40; // Margen de 20 puntos a cada lado
        // 4. Crear documento PDF
        const doc = new pdfkit_1.default({
            size: [ticketWidth, 841.89], // Ancho dinámico, alto A4
            margins: { top: 20, bottom: 20, left: 20, right: 20 }
        });
        // 5. Configurar respuesta HTTP
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="ticket-${numero_pedido}.pdf"`);
        doc.pipe(res);
        let yPosition = 20;
        // ========================================================================
        // FUNCIÓN AUXILIAR: Descargar imagen desde URL
        // ========================================================================
        const downloadImage = async (url) => {
            try {
                const response = await axios_1.default.get(url, { responseType: 'arraybuffer' });
                return Buffer.from(response.data);
            }
            catch (error) {
                console.error('Error descargando imagen:', error);
                return null;
            }
        };
        // ========================================================================
        // SECCIÓN 1: LOGO (si está configurado)
        // ========================================================================
        if (tenantConfig?.ticket_mostrar_logo && tenantConfig?.logo_url) {
            const logoBuffer = await downloadImage(tenantConfig.logo_url);
            if (logoBuffer) {
                try {
                    const logoSize = 60; // Aumentado de 50 a 60
                    const logoX = (ticketWidth - logoSize) / 2;
                    doc.image(logoBuffer, logoX, yPosition, {
                        fit: [logoSize, logoSize],
                        align: 'center',
                        valign: 'center'
                    });
                    yPosition += logoSize + 15; // Más espacio después del logo
                }
                catch (error) {
                    console.error('Error insertando logo:', error);
                    // Si falla, continuar sin logo
                }
            }
        }
        // ========================================================================
        // SECCIÓN 2: HEADER - Nombre del negocio y título
        // ========================================================================
        doc.font('Helvetica-Bold')
            .fontSize(14) // Aumentado de 12 a 14
            .text(tenantConfig?.nombre_negocio || 'RESTAURANTE', 20, yPosition, {
            width: maxWidth,
            align: 'center'
        });
        yPosition += 25; // Más espacio
        doc.fontSize(10)
            .text('TICKET DE PEDIDO', 20, yPosition, {
            width: maxWidth,
            align: 'center'
        });
        yPosition += 18; // Más espacio
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
        yPosition += 18; // Más espacio antes de la línea
        // Línea separadora
        doc.moveTo(20, yPosition)
            .lineTo(ticketWidth - 20, yPosition)
            .stroke();
        yPosition += 15; // ⭐ MÁS ESPACIO después de la línea
        // ========================================================================
        // NÚMERO DE PEDIDO (destacado)
        // ========================================================================
        doc.font('Helvetica-Bold')
            .fontSize(11)
            .text(`Pedido #${pedido.numero_pedido}`, 20, yPosition, {
            width: maxWidth,
            align: 'center'
        });
        yPosition += 25; // ⭐ MÁS ESPACIO después del número
        // Línea separadora
        doc.moveTo(20, yPosition)
            .lineTo(ticketWidth - 20, yPosition)
            .stroke();
        yPosition += 15; // Espacio después de la segunda línea
        // ========================================================================
        // SECCIÓN 3: DATOS DEL CLIENTE
        // ========================================================================
        doc.font('Helvetica-Bold')
            .fontSize(9)
            .text('DATOS DEL CLIENTE', 20, yPosition, {
            width: maxWidth,
            align: 'left'
        });
        yPosition += 12;
        doc.font('Helvetica')
            .fontSize(8);
        // Cliente
        doc.text(`Cliente: ${pedido.cliente_nombre}`, 20, yPosition, {
            width: maxWidth,
            align: 'left'
        });
        yPosition += 12;
        // Teléfono
        doc.text(`Telefono: ${pedido.cliente_telefono}`, 20, yPosition, {
            width: maxWidth,
            align: 'left'
        });
        yPosition += 12;
        // Email (si existe)
        if (pedido.cliente_email) {
            doc.text(`Email: ${pedido.cliente_email}`, 20, yPosition, {
                width: maxWidth,
                align: 'left'
            });
            yPosition += 12;
        }
        yPosition += 5;
        // ========================================================================
        // SECCIÓN 4: DIRECCIÓN DE ENTREGA (si es delivery)
        // ========================================================================
        const isDelivery = pedido.tipo_pedido === 'EntregaDomicilio';
        if (isDelivery && pedido.direccion_entrega) {
            // Línea separadora
            doc.moveTo(20, yPosition)
                .lineTo(ticketWidth - 20, yPosition)
                .stroke();
            yPosition += 10;
            doc.font('Helvetica-Bold')
                .fontSize(9)
                .text('DIRECCION DE ENTREGA:', 20, yPosition, {
                width: maxWidth,
                align: 'left'
            });
            yPosition += 12;
            // ⭐ CORRECCIÓN: Usar fillColor('black') para texto normal
            doc.font('Helvetica')
                .fontSize(8)
                .fillColor('black')
                .text(pedido.direccion_entrega, 20, yPosition, {
                width: maxWidth,
                align: 'left'
            });
            yPosition += 15;
            // Instrucciones (si existen)
            if (pedido.instrucciones_entrega) {
                doc.font('Helvetica-Bold')
                    .fontSize(8)
                    .text('Instrucciones:', 20, yPosition, {
                    width: maxWidth,
                    align: 'left'
                });
                yPosition += 10;
                doc.font('Helvetica')
                    .fontSize(8)
                    .text(pedido.instrucciones_entrega, 20, yPosition, {
                    width: maxWidth,
                    align: 'left'
                });
                yPosition += 15;
            }
            yPosition += 5;
        }
        // Línea separadora
        doc.moveTo(20, yPosition)
            .lineTo(ticketWidth - 20, yPosition)
            .stroke();
        yPosition += 10;
        // ========================================================================
        // SECCIÓN 5: PRODUCTOS
        // ========================================================================
        doc.font('Helvetica-Bold')
            .fontSize(9)
            .text('PRODUCTOS', 20, yPosition, {
            width: maxWidth,
            align: 'left'
        });
        yPosition += 15;
        // Listar productos
        doc.font('Helvetica')
            .fontSize(8);
        for (const detalle of pedido.webpedidos_detalles) {
            const productoText = `${detalle.cantidad}x ${detalle.productos.nombre}`;
            const precio = `S/ ${Number(detalle.subtotal).toFixed(2)}`;
            // Producto (lado izquierdo)
            doc.text(productoText, 20, yPosition, {
                width: maxWidth - 50,
                align: 'left',
                continued: false
            });
            // Precio (lado derecho)
            doc.text(precio, ticketWidth - 70, yPosition, {
                width: 50,
                align: 'right'
            });
            yPosition += 12;
        }
        yPosition += 5;
        // Línea separadora
        doc.moveTo(20, yPosition)
            .lineTo(ticketWidth - 20, yPosition)
            .stroke();
        yPosition += 10;
        // ========================================================================
        // SECCIÓN 6: TOTALES
        // ========================================================================
        doc.font('Helvetica')
            .fontSize(8);
        // Subtotal
        doc.text('Subtotal:', 20, yPosition, {
            width: maxWidth - 50,
            align: 'left',
            continued: false
        });
        doc.text(`S/ ${Number(pedido.subtotal).toFixed(2)}`, ticketWidth - 70, yPosition, {
            width: 50,
            align: 'right'
        });
        yPosition += 12;
        // Costo de envío (si aplica)
        if (pedido.costo_envio && Number(pedido.costo_envio) > 0) {
            doc.text('Envio:', 20, yPosition, {
                width: maxWidth - 50,
                align: 'left',
                continued: false
            });
            doc.text(`S/ ${Number(pedido.costo_envio).toFixed(2)}`, ticketWidth - 70, yPosition, {
                width: 50,
                align: 'right'
            });
            yPosition += 12;
        }
        yPosition += 5;
        // TOTAL (destacado)
        doc.font('Helvetica-Bold')
            .fontSize(10);
        doc.text('TOTAL:', 20, yPosition, {
            width: maxWidth - 50,
            align: 'left',
            continued: false
        });
        doc.text(`S/ ${Number(pedido.total).toFixed(2)}`, ticketWidth - 70, yPosition, {
            width: 50,
            align: 'right'
        });
        yPosition += 20;
        // Línea separadora doble
        doc.moveTo(20, yPosition)
            .lineTo(ticketWidth - 20, yPosition)
            .stroke();
        yPosition += 2;
        doc.moveTo(20, yPosition)
            .lineTo(ticketWidth - 20, yPosition)
            .stroke();
        yPosition += 10;
        // ========================================================================
        // SECCIÓN 7: MÉTODO DE PAGO (si está configurado)
        // ========================================================================
        if (tenantConfig?.ticket_mostrar_metodo) {
            doc.font('Helvetica-Bold')
                .fontSize(9)
                .text('METODO DE PAGO', 20, yPosition, {
                width: maxWidth,
                align: 'center'
            });
            yPosition += 12;
            doc.font('Helvetica')
                .fontSize(8)
                .text('Pago contra entrega', 20, yPosition, {
                width: maxWidth,
                align: 'center'
            });
            yPosition += 15;
            // Línea separadora
            doc.moveTo(20, yPosition)
                .lineTo(ticketWidth - 20, yPosition)
                .stroke();
            yPosition += 10;
        }
        // ========================================================================
        // SECCIÓN 8: QR DE PAGO (si está configurado)
        // ========================================================================
        if (tenantConfig?.ticket_incluir_qr) {
            const hasYape = tenantConfig?.acepta_yape && tenantConfig?.yape_qr_url;
            const hasPlin = tenantConfig?.acepta_plin && tenantConfig?.plin_qr_url;
            if (hasYape || hasPlin) {
                doc.font('Helvetica-Bold')
                    .fontSize(9)
                    .text('OPCIONES DE PAGO', 20, yPosition, {
                    width: maxWidth,
                    align: 'center'
                });
                yPosition += 12;
                // YAPE
                if (hasYape && tenantConfig.yape_qr_url) {
                    doc.font('Helvetica-Bold')
                        .fontSize(8)
                        .text('YAPE:', 20, yPosition, {
                        width: maxWidth,
                        align: 'center'
                    });
                    yPosition += 10;
                    doc.font('Helvetica')
                        .fontSize(8)
                        .text(tenantConfig?.yape_numero || '', 20, yPosition, {
                        width: maxWidth,
                        align: 'center'
                    });
                    yPosition += 12;
                    // ⭐ CARGAR Y MOSTRAR QR YAPE
                    const yapeQrBuffer = await downloadImage(tenantConfig.yape_qr_url);
                    if (yapeQrBuffer) {
                        try {
                            const qrSize = 80; // Tamaño del QR
                            const qrX = (ticketWidth - qrSize) / 2; // Centrar
                            doc.image(yapeQrBuffer, qrX, yPosition, {
                                fit: [qrSize, qrSize],
                                align: 'center'
                            });
                            yPosition += qrSize + 10;
                        }
                        catch (error) {
                            console.error('Error insertando QR Yape:', error);
                            doc.fontSize(7)
                                .text('[QR no disponible]', 20, yPosition, {
                                width: maxWidth,
                                align: 'center'
                            });
                            yPosition += 15;
                        }
                    }
                }
                // PLIN
                if (hasPlin && tenantConfig.plin_qr_url) {
                    doc.font('Helvetica-Bold')
                        .fontSize(8)
                        .text('PLIN:', 20, yPosition, {
                        width: maxWidth,
                        align: 'center'
                    });
                    yPosition += 10;
                    doc.font('Helvetica')
                        .fontSize(8)
                        .text(tenantConfig?.plin_numero || '', 20, yPosition, {
                        width: maxWidth,
                        align: 'center'
                    });
                    yPosition += 12;
                    // ⭐ CARGAR Y MOSTRAR QR PLIN
                    const plinQrBuffer = await downloadImage(tenantConfig.plin_qr_url);
                    if (plinQrBuffer) {
                        try {
                            const qrSize = 80;
                            const qrX = (ticketWidth - qrSize) / 2;
                            doc.image(plinQrBuffer, qrX, yPosition, {
                                fit: [qrSize, qrSize],
                                align: 'center'
                            });
                            yPosition += qrSize + 10;
                        }
                        catch (error) {
                            console.error('Error insertando QR Plin:', error);
                            doc.fontSize(7)
                                .text('[QR no disponible]', 20, yPosition, {
                                width: maxWidth,
                                align: 'center'
                            });
                            yPosition += 15;
                        }
                    }
                }
                // Instrucciones
                doc.font('Helvetica')
                    .fontSize(7)
                    .text('Escanee el codigo al recibir su pedido', 20, yPosition, {
                    width: maxWidth,
                    align: 'center'
                });
                yPosition += 15;
                // Línea separadora
                doc.moveTo(20, yPosition)
                    .lineTo(ticketWidth - 20, yPosition)
                    .stroke();
                yPosition += 10;
            }
        }
        // ========================================================================
        // SECCIÓN 9: NOTAS ESPECIALES (si existen)
        // ========================================================================
        if (pedido.notas_especiales) {
            doc.font('Helvetica-Bold')
                .fontSize(9)
                .text('NOTAS ESPECIALES:', 20, yPosition, {
                width: maxWidth,
                align: 'left'
            });
            yPosition += 12;
            doc.font('Helvetica')
                .fontSize(8)
                .text(pedido.notas_especiales, 20, yPosition, {
                width: maxWidth,
                align: 'left'
            });
            yPosition += 15;
            // Línea separadora
            doc.moveTo(20, yPosition)
                .lineTo(ticketWidth - 20, yPosition)
                .stroke();
            yPosition += 10;
        }
        // ========================================================================
        // SECCIÓN 10: PIE DE PÁGINA
        // ========================================================================
        // Mensaje personalizado (si existe)
        if (tenantConfig?.ticket_pie_mensaje) {
            doc.font('Helvetica')
                .fontSize(8)
                .text(tenantConfig.ticket_pie_mensaje, 20, yPosition, {
                width: maxWidth,
                align: 'center'
            });
            yPosition += 15;
        }
        // Tiempo estimado (si existe)
        if (tenantConfig?.tiempo_prep_web) {
            doc.font('Helvetica')
                .fontSize(7)
                .text(`Tiempo estimado: ${tenantConfig.tiempo_prep_web} min`, 20, yPosition, {
                width: maxWidth,
                align: 'center'
            });
            yPosition += 12;
        }
        // ⭐ CORRECCIÓN: Mensaje "¡Gracias!" dentro del ancho del ticket
        doc.font('Helvetica-Bold')
            .fontSize(9)
            .text('Gracias por su compra!', 20, yPosition, {
            width: maxWidth,
            align: 'center'
        });
        yPosition += 15;
        // Comprobante
        doc.font('Helvetica')
            .fontSize(7)
            .text('*** COMPROBANTE ***', 20, yPosition, {
            width: maxWidth,
            align: 'center'
        });
        // ========================================================================
        // FINALIZAR DOCUMENTO
        // ========================================================================
        doc.end();
    }
    catch (error) {
        console.error('Error generando ticket:', error);
        // Si ya se empezó a escribir en el stream, no se puede cambiar el status
        if (!res.headersSent) {
            return res.status(500).json({
                error: 'Error generando ticket',
                message: error.message
            });
        }
    }
};
exports.generateTicket = generateTicket;
