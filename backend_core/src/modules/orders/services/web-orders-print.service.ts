import { prisma } from '@shared/database/prisma.service';
import PDFDocument from 'pdfkit';
import axios from 'axios';

async function fetchImage(url: string): Promise<Buffer> {
    const response = await axios.get(url, {
        responseType: 'arraybuffer'
    });
    return response.data;
}

class WebOrdersPrintService {
  private readonly prisma = prisma;

  async generatePdfsForDateRange(tenantId: number, startDate: Date, endDate: Date, type: 'boleta' | 'factura'): Promise<Buffer> {
    const orders = await this.prisma.webpedidos.findMany({
        where: {
            tenant_id: tenantId,
            estado: 'Entregado',
            created_at: {
                gte: startDate,
                lte: endDate,
            },
            documento_identidad: {
                not: null,
            },
            cliente_nombre: {
                not: '',
            },
        },
        include: {
            webpedidos_detalles: {
                include: {
                    productos: true,
                },
            },
            tenants: {
                include: {
                    tenant_config: true,
                }
            }
        },
        orderBy: {
            created_at: 'asc'
        }
    });

    if (orders.length === 0) {
        throw new Error('No se encontraron pedidos entregados con datos de cliente en el rango de fechas especificado.');
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50, autoFirstPage: false });

    for (const order of orders) {
        doc.addPage();
        await this.addInvoiceToDoc(doc, order, type);
    }

    doc.end();

    return new Promise<Buffer>((resolve, reject) => {
        const buffers: any[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            resolve(Buffer.concat(buffers));
        });
        doc.on('error', reject);
    });
  }

  private async addInvoiceToDoc(doc: PDFKit.PDFDocument, order: any, type: 'boleta' | 'factura') {
      const tenant = order.tenants;
      const tenantConfig = tenant.tenant_config;

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

      doc.moveDown();
      const docTypeTitle = type === 'factura' ? 'FACTURA ELECTRÓNICA' : 'BOLETA ELECTRÓNICA';
      doc.fontSize(16).text(docTypeTitle, 50, 120);
      doc.fontSize(10).text(`Serie/Nro: WEB-${order.numero_pedido || '0'}`, 50, 140);
      doc.text(`Fecha: ${order.created_at.toLocaleDateString()}`, 50, 155);

      doc.moveDown();
      doc.fontSize(12).text('Cliente:', 50, 180);
      
      doc.text(`Nombre/Razón Social: ${order.cliente_nombre || 'Público General'}`, 50, 195);
      doc.text(`DNI/RUC: ${order.documento_identidad || '00000000'}`, 50, 210);

      const tableTop = 250;
      doc.fontSize(10);
      doc.text('Producto', 50, tableTop);
      doc.text('Cantidad', 250, tableTop, { width: 90, align: 'right' });
      doc.text('P. Unitario', 350, tableTop, { width: 90, align: 'right' });
      doc.text('Total', 0, tableTop, { align: 'right' });

      let i = 0;
      for (const item of order.webpedidos_detalles) {
          const y = tableTop + 25 + (i * 25);
          doc.text(item.productos.nombre, 50, y);
          doc.text(item.cantidad.toString(), 250, y, { width: 90, align: 'right' });
          doc.text(item.precio_unitario.toFixed(2), 350, y, { width: 90, align: 'right' });
          doc.text((item.cantidad * Number(item.precio_unitario)).toFixed(2), 0, y, { align: 'right' });
          i++;
      }
      
      const totalsTop = tableTop + 25 + (order.webpedidos_detalles.length * 25) + 10;
      doc.fontSize(10);
      doc.text(`Subtotal: ${Number(order.subtotal).toFixed(2)}`, 400, totalsTop);
      doc.text(`Envío: ${Number(order.costo_envio).toFixed(2)}`, 400, totalsTop + 15);
      doc.font('Helvetica-Bold').text(`Total: ${Number(order.total).toFixed(2)}`, 400, totalsTop + 30);
      
      doc.fontSize(8).text(tenantConfig?.ticket_pie_mensaje || '¡Gracias por su compra! Comprobante emitido electrónicamente.', 50, 750, { align: 'center', width: 500 });
  }

  async generatePdf(tenantId: number, orderId: number, type: 'boleta' | 'factura' | 'contra-entrega'): Promise<Buffer> {
    const order = await this.prisma.webpedidos.findFirst({
      where: { id: orderId, tenant_id: tenantId },
      include: {
        webpedidos_detalles: {
          include: {
            productos: true,
          },
        },
        clientes: true,
        motorizado: true,
        tenants: {
            include: {
                tenant_config: true,
            }
        }
      },
    });

    if (!order) {
      throw new Error('Pedido no encontrado');
    }
    
    if (type === 'contra-entrega') {
      const tenantConfig = order.tenants.tenant_config;
      return this.generateContraEntregaTicket(order, tenantConfig);
    }
    
    if (type === 'factura' || type === 'boleta') {
        if (!order.documento_identidad || !order.cliente_nombre) {
            throw new Error(`Datos de cliente (DNI/RUC y Nombre/Razón Social) son obligatorios para emitir una ${type}.`);
        }
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    await this.addInvoiceToDoc(doc, order, type);
    doc.end();
    
    return new Promise<Buffer>((resolve, reject) => {
        const buffers: any[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            resolve(Buffer.concat(buffers));
        });
        doc.on('error', reject);
    });
  }

  private async generateContraEntregaTicket(order: any, tenant: any): Promise<Buffer>{
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    doc.fontSize(20).text(`Ticket de Contra Entrega`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Pedido #${order.numero_pedido}`);
    doc.text(`Cliente: ${order.cliente_nombre}`);
    doc.text(`Dirección: ${order.direccion_entrega}`);
    doc.moveDown();

    doc.text('Productos:');
    order.webpedidos_detalles.forEach((item: any) => {
      doc.text(`${item.cantidad}x ${item.productos.nombre} - ${item.subtotal}`);
    });
    doc.moveDown();

    doc.fontSize(16).text(`Total a Pagar: ${order.total}`, { align: 'right' });
    doc.moveDown();

    doc.fontSize(10).text('Datos de pago:', { underline: true });
    if(tenant.acepta_yape) doc.text(`Yape: ${tenant.yape_numero}`);
    if(tenant.acepta_plin) doc.text(`Plin: ${tenant.plin_numero}`);
    if(tenant.acepta_transferencia) doc.text(`Transferencia: ${tenant.banco_nombre} - ${tenant.banco_cuenta}`);
    
    doc.end();

    return new Promise<Buffer>((resolve, reject) => {
        const buffers: any[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            resolve(Buffer.concat(buffers));
        });
        doc.on('error', reject);
    });
  }
}

export const webOrdersPrintService = new WebOrdersPrintService();
