"use strict";
// backend/src/services/inventory-alerts.service.ts
// ✅ 100% CORRECTO según schema.prisma real
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryAlertsService = void 0;
const prisma_1 = require("../lib/prisma");
const tenant_config_service_1 = require("./tenant-config.service");
const notification_service_1 = require("./notification.service");
function toNumber(value) {
    if (typeof value === 'number')
        return value;
    if (value && typeof value.toNumber === 'function')
        return value.toNumber();
    return Number(value) || 0;
}
exports.inventoryAlertsService = {
    /**
     * Verificar si un producto está agotado y enviar alerta
     */
    async verificarProductoAgotado(tenantId, productoInventarioId, nombreProducto, stockActual) {
        try {
            const config = await tenant_config_service_1.tenantConfigService.getOperacionesConfig(tenantId);
            if (!config.alertar_agotados) {
                console.log('ℹ️ [INVENTARIO] Alertas de agotados desactivadas');
                return;
            }
            if (stockActual <= 0) {
                console.log(`⚠️ [INVENTARIO] Producto agotado: ${nombreProducto}`);
                await notification_service_1.notificationService.notificarProductoAgotado(tenantId, {
                    nombre: nombreProducto,
                    stockActual: stockActual
                });
            }
        }
        catch (error) {
            console.error('❌ [INVENTARIO] Error al verificar producto agotado:', error);
        }
    },
    /**
     * Verificar todos los productos con stock bajo
     */
    async verificarStockBajo(tenantId) {
        try {
            const config = await tenant_config_service_1.tenantConfigService.getInventarioConfig(tenantId);
            if (!config.alertas_stock_bajo) {
                console.log('ℹ️ [INVENTARIO] Alertas de stock bajo desactivadas');
                return [];
            }
            const nivelAlerta = toNumber(config.nivel_alerta_stock);
            // productos_inventario tiene stock_actual directamente
            const productosStockBajo = await prisma_1.prisma.productos_inventario.findMany({
                where: {
                    tenant_id: tenantId,
                    stock_actual: {
                        lte: nivelAlerta,
                        gt: 0
                    },
                    activo: true
                }
            });
            if (productosStockBajo.length > 0) {
                console.log(`⚠️ [INVENTARIO] ${productosStockBajo.length} productos con stock bajo`);
                const productosFormateados = productosStockBajo.map((item) => ({
                    nombre: item.nombre,
                    stockActual: toNumber(item.stock_actual),
                    nivelAlerta: nivelAlerta,
                    unidadMedida: 'unidades'
                }));
                await notification_service_1.notificationService.notificarStockBajo(tenantId, productosFormateados);
                return productosFormateados;
            }
            console.log('✅ [INVENTARIO] Todos los productos tienen stock suficiente');
            return [];
        }
        catch (error) {
            console.error('❌ [INVENTARIO] Error al verificar stock bajo:', error);
            return [];
        }
    },
    /**
     * Verificar disponibilidad de items para un pedido
     */
    async verificarDisponibilidadPedido(tenantId, items) {
        const config = await tenant_config_service_1.tenantConfigService.getOperacionesConfig(tenantId);
        const productosAgotados = [];
        const productosInsuficientes = [];
        for (const item of items) {
            // productos tiene producto_inventario_id
            const productoMenu = await prisma_1.prisma.productos.findUnique({
                where: { id: item.producto_id },
                include: {
                    producto_inventario: true // Relación singular
                }
            });
            if (productoMenu?.producto_inventario) {
                const stockActual = toNumber(productoMenu.producto_inventario.stock_actual);
                const cantidadRequerida = item.cantidad;
                const nombreProducto = item.nombre || productoMenu.nombre;
                if (stockActual <= 0) {
                    productosAgotados.push(nombreProducto);
                    if (config.alertar_agotados) {
                        await this.verificarProductoAgotado(tenantId, productoMenu.producto_inventario.id, nombreProducto, stockActual);
                    }
                }
                else if (stockActual < cantidadRequerida) {
                    productosInsuficientes.push({
                        nombre: nombreProducto,
                        disponible: stockActual,
                        requerido: cantidadRequerida
                    });
                }
            }
        }
        return {
            disponible: productosAgotados.length === 0 && productosInsuficientes.length === 0,
            productosAgotados,
            productosInsuficientes
        };
    },
    /**
     * Descontar inventario después de una venta
     */
    async descontarInventario(tenantId, items, empleadoId, referencia) {
        console.log(`📦 [INVENTARIO] Descontando inventario para: ${referencia}`);
        for (const item of items) {
            // Buscar producto del menú con su inventario
            const productoMenu = await prisma_1.prisma.productos.findUnique({
                where: { id: item.producto_id },
                include: {
                    producto_inventario: true // Relación singular
                }
            });
            if (!productoMenu?.producto_inventario) {
                console.log(`⚠️ [INVENTARIO] Producto ${item.producto_id} no tiene inventario asociado`);
                continue;
            }
            const productoInventario = productoMenu.producto_inventario;
            const stockAnterior = toNumber(productoInventario.stock_actual);
            const cantidadDescontar = item.cantidad;
            const stockNuevo = Math.max(0, stockAnterior - cantidadDescontar);
            // Actualizar stock en productos_inventario
            await prisma_1.prisma.productos_inventario.update({
                where: { id: productoInventario.id },
                data: {
                    stock_actual: stockNuevo,
                    stock_anterior: stockAnterior, // ✅ Campo existe en schema
                    ultimo_conteo: new Date()
                }
            });
            // Registrar en Kardex - ⭐ CAMPOS CORRECTOS SEGÚN SCHEMA
            await prisma_1.prisma.kardex.create({
                data: {
                    tenant_id: tenantId,
                    producto_inventario_id: productoInventario.id,
                    tipo_movimiento: 'Salida',
                    motivo: 'Venta',
                    cantidad: cantidadDescontar,
                    costo_unitario: toNumber(productoInventario.costo_unitario),
                    valor_total: toNumber(productoInventario.costo_unitario) * cantidadDescontar,
                    saldo_cantidad: stockNuevo, // ✅ Campo correcto
                    saldo_valor: toNumber(productoInventario.costo_unitario) * stockNuevo, // ✅ Campo correcto
                    documento_tipo: 'Pedido',
                    observaciones: `Venta - ${productoMenu.nombre} - ${referencia}`,
                    usuario_id: empleadoId
                }
            });
            console.log(`✅ [INVENTARIO] ${productoMenu.nombre}: ${stockAnterior} → ${stockNuevo}`);
            // Verificar si quedó con stock bajo o agotado
            const config = await tenant_config_service_1.tenantConfigService.getInventarioConfig(tenantId);
            if (stockNuevo <= 0) {
                await this.verificarProductoAgotado(tenantId, productoInventario.id, productoMenu.nombre, stockNuevo);
            }
            else if (config.alertas_stock_bajo && stockNuevo <= toNumber(config.nivel_alerta_stock)) {
                await this.verificarStockBajo(tenantId);
            }
        }
        console.log(`✅ [INVENTARIO] Descuento completado para: ${referencia}`);
    }
};
