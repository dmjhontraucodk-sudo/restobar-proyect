import { prisma } from '@shared/database/prisma.service';

export enum webpedidos_estado {
  Pendiente = 'Pendiente',
  Confirmado = 'Confirmado',
  EnPreparacion = 'EnPreparacion',
  ListoParaRecoger = 'ListoParaRecoger',
  EnCamino = 'EnCamino',
  Entregado = 'Entregado',
  Cancelado = 'Cancelado'
}

export enum webpedidos_tipo {
  RecogerEnTienda = 'RecogerEnTienda',
  EntregaDomicilio = 'EntregaDomicilio'
}

function toNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (value && typeof value.toNumber === 'function') return value.toNumber();
  return Number(value) || 0;
}

export const webOrdersService = {
  
  async getWebOrdersByTenant(
    tenantId: number, 
    filters?: { estado?: webpedidos_estado }
  ) {
    const where: any = { tenant_id: tenantId };
    
    if (filters?.estado) {
      where.estado = filters.estado;
    }

    return await prisma.webpedidos.findMany({
      where,
      include: {
        webpedidos_detalles: {
          include: {
            productos: {
              select: {
                id: true,
                nombre: true,
                precio: true,
                foto_url: true,
                descripcion: true,
                producto_inventario_id: true
              }
            }
          }
        },
        clientes: true,
        ordenes: {
          include: {
            pagos: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  },

  async processInventoryDeduction(tenantId: number, orderId: number, userId?: number) {
    const order = await prisma.webpedidos.findUnique({
      where: { id: orderId },
      include: {
        webpedidos_detalles: {
          include: {
            productos: true
          }
        }
      }
    });

    if (!order || order.tenant_id !== tenantId) {
        return;
    }

    await prisma.$transaction(async (tx) => {
      for (const detalle of order.webpedidos_detalles) {
        const productoMenu = detalle.productos;
        
        if (!productoMenu.producto_inventario_id) continue;

        const inventarioId = productoMenu.producto_inventario_id;
        const cantidad = detalle.cantidad;

        const productoInv = await tx.productos_inventario.findUnique({
           where: { id: inventarioId }
        });

        if (!productoInv) continue;

        const stockActual = toNumber(productoInv.stock_actual);
        const costoUnitario = toNumber(productoInv.costo_unitario);
        const nuevoStock = stockActual - cantidad;

        await tx.productos_inventario.update({
          where: { id: inventarioId },
          data: { 
            stock_actual: nuevoStock,
            stock_anterior: stockActual,
            ultimo_conteo: new Date()
          }
        });

        await tx.kardex.create({
          data: {
            tenant_id: tenantId,
            fecha: new Date(),
            tipo_movimiento: 'Salida',
            motivo: `Venta Web #${order.numero_pedido}`,
            producto_inventario_id: inventarioId,
            cantidad: cantidad,
            costo_unitario: costoUnitario,
            valor_total: cantidad * costoUnitario,
            saldo_cantidad: nuevoStock, 
            saldo_valor: nuevoStock * costoUnitario,
            documento_tipo: 'PedidoWeb',
            documento_id: orderId,
            usuario_id: userId || null,
            observaciones: 'Descuento automático por entrega de pedido web'
          }
        });
      }
    });
  },

  async getWebOrderById(tenantId: number, orderId: number) {
    return await prisma.webpedidos.findFirst({
      where: {
        id: orderId,
        tenant_id: tenantId
      },
      include: {
        webpedidos_detalles: {
          include: {
            productos: {
              select: {
                id: true,
                nombre: true,
                descripcion: true,
                precio: true,
                foto_url: true,
                producto_inventario_id: true
              }
            }
          }
        },
        clientes: true,
        ordenes: {
          include: {
            pagos: true,
            empleados: {
              select: {
                id: true,
                nombre: true,
                email: true
              }
            }
          }
        }
      }
    });
  },

  async createWebOrder(tenantId: number, orderData: {
    cliente_nombre: string;
    cliente_email?: string;
    cliente_telefono: string;
    tipo_pedido: webpedidos_tipo;
    direccion_entrega?: string;
    instrucciones_entrega?: string;
    hora_programada?: string;
    notas_especiales?: string;
    notas?: string;
    items: Array<{
      id: number;
      cantidad: number;
      precio: number;
    }>;
  }) {
    const { 
      cliente_nombre, 
      cliente_email, 
      cliente_telefono, 
      tipo_pedido, 
      direccion_entrega, 
      instrucciones_entrega, 
      hora_programada, 
      notas_especiales, 
      notas, 
      items 
    } = orderData;

    if (!items || items.length === 0) {
      throw new Error('El pedido debe contener al menos un producto');
    }

    const productIds = items.map(item => item.id);
    const productos = await prisma.productos.findMany({
      where: {
        id: { in: productIds },
        tenant_id: tenantId,
        disponible: true
      }
    });

    if (productos.length !== items.length) {
      throw new Error('Algunos productos no están disponibles');
    }

    const subtotal = items.reduce((sum, item) => {
      return sum + (Number(item.precio) * Number(item.cantidad));
    }, 0);

    const tenantConfig = await prisma.tenant_config.findUnique({
      where: { tenant_id: tenantId }
    });

    if (!tenantConfig) {
      throw new Error('Configuración del tenant no encontrada');
    }

    let costoEnvio = 0;
    if (tipo_pedido === 'EntregaDomicilio') {
      costoEnvio = toNumber(tenantConfig.costo_delivery);
      if (subtotal >= 50) {
        costoEnvio = 0;
      }
    }

    const total = subtotal + costoEnvio;

    const montoMinimo = toNumber(tenantConfig.monto_minimo_pedido);
    if (montoMinimo > 0 && subtotal < montoMinimo) {
      throw new Error(`El pedido mínimo es de S/ ${montoMinimo.toFixed(2)}`);
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const numeroPedido = `RB-${timestamp}-${random}`;

    return await prisma.webpedidos.create({
      data: {
        tenant_id: tenantId,
        cliente_nombre,
        cliente_email: cliente_email || null,
        cliente_telefono,
        tipo_pedido,
        numero_pedido: numeroPedido,
        subtotal,
        total,
        costo_envio: costoEnvio,
        direccion_entrega: tipo_pedido === 'EntregaDomicilio' ? direccion_entrega || null : null,
        instrucciones_entrega: instrucciones_entrega || null,
        hora_programada: hora_programada ? new Date(hora_programada) : null,
        notas_especiales: notas_especiales || null,
        notas: notas || null,
        estado: webpedidos_estado.Pendiente,
        webpedidos_detalles: {
          create: items.map((item) => ({
            tenant_id: tenantId,
            producto_id: item.id,
            cantidad: item.cantidad,
            precio_unitario: item.precio,
            subtotal: Number(item.precio) * Number(item.cantidad)
          }))
        }
      },
      include: {
        webpedidos_detalles: {
          include: {
            productos: {
              select: {
                id: true,
                nombre: true,
                precio: true,
                foto_url: true,
                producto_inventario_id: true
              }
            }
          }
        }
      }
    });
  },

  async updateOrderStatus(
    tenantId: number, 
    orderId: number, 
    newStatus: webpedidos_estado
  ) {
    if (!this.isValidOrderStatus(newStatus)) {
      throw new Error(`Estado inválido: ${newStatus}`);
    }

    const existingOrder = await prisma.webpedidos.findFirst({
      where: {
        id: orderId,
        tenant_id: tenantId
      }
    });

    if (!existingOrder) {
      throw new Error('Pedido no encontrado');
    }

    return await prisma.webpedidos.update({
      where: {
        id: orderId
      },
      data: {
        estado: newStatus,
        updated_at: new Date()
      },
      include: {
        webpedidos_detalles: {
          include: {
            productos: {
              select: {
                id: true,
                nombre: true,
                precio: true,
                foto_url: true,
                producto_inventario_id: true
              }
            }
          }
        }
      }
    });
  },

  async convertToPosOrder(
    tenantId: number, 
    webOrderId: number, 
    empleadoId: number
  ) {
    const webOrder = await this.getWebOrderById(tenantId, webOrderId);
    
    if (!webOrder) {
      throw new Error('Pedido web no encontrado');
    }

    if (webOrder.ordenes && webOrder.ordenes.length > 0) {
      throw new Error('Este pedido ya fue convertido a una orden POS');
    }

    const posOrder = await prisma.ordenes.create({
      data: {
        tenant_id: tenantId,
        mesa_id: 1, 
        empleado_id: empleadoId,
        estado: 'Abierta',
        subtotal: webOrder.subtotal,
        total: webOrder.total,
        webpedido_id: webOrderId,
        ordendetalles: {
          create: webOrder.webpedidos_detalles.map((detalle: any) => ({
            tenant_id: tenantId,
            producto_id: detalle.producto_id,
            cantidad: detalle.cantidad,
            precio_unitario: detalle.precio_unitario
          }))
        }
      },
      include: {
        ordendetalles: {
          include: {
            productos: {
              select: {
                id: true,
                nombre: true,
                precio: true,
                foto_url: true,
                producto_inventario_id: true
              }
            }
          }
        }
      }
    });

    await this.updateOrderStatus(tenantId, webOrderId, webpedidos_estado.Confirmado);

    return posOrder;
  },

  async getOrderConfig(tenantId: number) {
    let config = await prisma.tenant_config_pedidos.findUnique({
      where: { tenant_id: tenantId }
    });

    if (!config) {
      config = await prisma.tenant_config_pedidos.create({
        data: {
          tenant_id: tenantId,
          dias_limite_reserva: 2,
          notif_pedido_confirmado: true,
          notif_pedido_cancelado: true,
          notif_pedido_listo: true,
          email_asunto_confirmado: 'Confirmación de tu pedido',
          email_asunto_cancelado: 'Actualización sobre tu pedido',
          email_asunto_listo: '¡Tu pedido está listo!'
        }
      });
    }

    return config;
  },

  async updateOrderConfig(tenantId: number, configData: any) {
    const existingConfig = await prisma.tenant_config_pedidos.findUnique({
      where: { tenant_id: tenantId }
    });

    if (existingConfig) {
      return await prisma.tenant_config_pedidos.update({
        where: { tenant_id: tenantId },
        data: configData
      });
    } else {
      return await prisma.tenant_config_pedidos.create({
        data: {
          tenant_id: tenantId,
          ...configData
        }
      });
    }
  },

  async calculateShippingCost(
    tenantId: number, 
    subtotal: number, 
    __address?: string
  ) {
    const config = await prisma.tenant_config.findUnique({
      where: { tenant_id: tenantId }
    });
    
    if (!config) {
      return 0;
    }
    
    let costoEnvio = toNumber(config.costo_delivery);
    
    if (subtotal >= 50) {
      costoEnvio = 0;
    }
    
    return costoEnvio;
  },

  async validateOrder(
    tenantId: number, 
    items: Array<{ id: number; cantidad: number; precio?: number }>
  ) {
    if (!items || items.length === 0) {
      throw new Error('El pedido debe contener al menos un producto');
    }

    const config = await prisma.tenant_config.findUnique({
      where: { tenant_id: tenantId }
    });

    if (!config) {
      throw new Error('Configuración del tenant no encontrada');
    }
    
    const productIds = items.map(item => item.id);
    const productos = await prisma.productos.findMany({
      where: {
        id: { in: productIds },
        tenant_id: tenantId,
        disponible: true
      }
    });
    
    if (productos.length !== items.length) {
      const availableIds = productos.map((p: any) => p.id);
      const unavailableIds = productIds.filter(id => !availableIds.includes(id));
      throw new Error(`Productos no disponibles: ${unavailableIds.join(', ')}`);
    }

    const subtotal = items.reduce((sum, item) => {
      const producto = productos.find((p: any) => p.id === item.id);
      const precio = producto ? toNumber(producto.precio) : 0;
      return sum + (precio * item.cantidad);
    }, 0);
    
    const montoMinimo = toNumber(config.monto_minimo_pedido);
    if (montoMinimo > 0 && subtotal < montoMinimo) {
      throw new Error(`El pedido mínimo es de S/ ${montoMinimo.toFixed(2)}`);
    }
    
    return {
      valid: true,
      subtotal,
      productos
    };
  },

  isValidOrderStatus(status: string): status is webpedidos_estado {
    return Object.values(webpedidos_estado).includes(status as webpedidos_estado);
  },

  isValidOrderType(type: string): type is webpedidos_tipo {
    return Object.values(webpedidos_tipo).includes(type as webpedidos_tipo);
  },

  async getOrderStats(tenantId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const [
      totalPedidos, 
      pedidosHoy, 
      pedidosPendientes,
      pedidosEnPreparacion,
      ventasHoy
    ] = await Promise.all([
      prisma.webpedidos.count({
        where: { tenant_id: tenantId }
      }),
      
      prisma.webpedidos.count({
        where: {
          tenant_id: tenantId,
          created_at: { 
            gte: today,
            lt: tomorrow
          }
        }
      }),
      
      prisma.webpedidos.count({
        where: {
          tenant_id: tenantId,
          estado: webpedidos_estado.Pendiente
        }
      }),

      prisma.webpedidos.count({
        where: {
          tenant_id: tenantId,
          estado: webpedidos_estado.EnPreparacion
        }
      }),

      prisma.webpedidos.aggregate({
        where: {
          tenant_id: tenantId,
          created_at: { 
            gte: today,
            lt: tomorrow
          },
          estado: {
            notIn: [webpedidos_estado.Cancelado]
          }
        },
        _sum: {
          total: true
        }
      })
    ]);
    
    return {
      totalPedidos,
      pedidosHoy,
      pedidosPendientes,
      pedidosEnPreparacion,
      ventasHoy: toNumber(ventasHoy._sum.total || 0)
    };
  },

  async getOrderStatsByStatus(tenantId: number) {
    const stats = await prisma.webpedidos.groupBy({
      by: ['estado'],
      where: { tenant_id: tenantId },
      _count: {
        id: true
      },
      _sum: {
        total: true
      }
    });

    return stats.map((stat: any) => ({
      estado: stat.estado,
      cantidad: stat._count.id,
      totalVentas: toNumber(stat._sum.total || 0)
    }));
  },

  async getRecentOrders(tenantId: number, limit: number = 10) {
    return await prisma.webpedidos.findMany({
      where: { tenant_id: tenantId },
      include: {
        webpedidos_detalles: {
          include: {
            productos: {
              select: {
                id: true,
                nombre: true,
                precio: true,
                producto_inventario_id: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: limit
    });
  }
};
